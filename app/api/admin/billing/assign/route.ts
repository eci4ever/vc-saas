import { eq } from "drizzle-orm";

import { db } from "@/db";
import { organization } from "@/db/auth-schema";
import { subscriptions } from "@/db/billing-schema";

import {
  getRequestAdmin,
  logAdminAction,
} from "@/lib/admin";
import { cycleMonths, isBillingCycle, isPlanId, planName } from "@/lib/plans";

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Action failed.";
}

/**
 * Platform admin assigns a paid plan to an organization without a Billplz
 * payment — offline transfer, comp, or correction. anchor "now" restarts
 * the period (plan change); anchor "period_end" renews from the current
 * end (offline renewal for an already-active subscription).
 */
export async function POST(req: Request) {
  const adminUser = await getRequestAdmin();
  if (!adminUser) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }
  let body: {
    organizationId?: unknown;
    planId?: unknown;
    cycle?: unknown;
    anchor?: unknown;
    note?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { organizationId, planId, cycle, anchor, note } = body;
  if (typeof organizationId !== "string" || !organizationId) {
    return Response.json({ error: "Organization is required." }, { status: 400 });
  }
  if (!isPlanId(planId) || planId === "free") {
    return Response.json({ error: "Choose a paid plan." }, { status: 400 });
  }
  if (!isBillingCycle(cycle)) {
    return Response.json({ error: "Choose a billing cycle." }, { status: 400 });
  }
  const renewFromEnd = anchor === "period_end";

  try {
    const [org] = await db
      .select({ id: organization.id, name: organization.name })
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1);
    if (!org) {
      return Response.json({ error: "Organization not found." }, { status: 404 });
    }

    const [current] = await db
      .select({ periodEnd: subscriptions.periodEnd, status: subscriptions.status })
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, organizationId))
      .limit(1);

    const now = new Date();
    const periodStart =
      renewFromEnd && current && current.periodEnd.getTime() > now.getTime()
        ? current.periodEnd
        : now;
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + cycleMonths(cycle));

    await db
      .insert(subscriptions)
      .values({
        organizationId,
        planId,
        cycle,
        status: "active",
        periodStart,
        periodEnd,
      })
      .onConflictDoUpdate({
        target: subscriptions.organizationId,
        set: {
          planId,
          cycle,
          status: "active",
          periodStart,
          periodEnd,
          canceledAt: null,
        },
      });

    const planLabel = `${planName(planId)} (${cycle})`;
    const anchorLabel = renewFromEnd ? "renewal from period end" : "period restarts";
    await logAdminAction({
      actorUserId: adminUser.id,
      actorEmail: adminUser.email,
      action: "billing-assign",
      targetUserId: organizationId,
      targetEmail: org.name,
      reason: `Assigned ${planLabel}, ${anchorLabel}${typeof note === "string" && note.trim() ? ` — ${note.trim()}` : ""}`,
    });
  } catch (e) {
    return Response.json({ error: errorMessage(e) }, { status: 400 });
  }
  return Response.json({ ok: true });
}
