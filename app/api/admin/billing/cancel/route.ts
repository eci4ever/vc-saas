import { eq } from "drizzle-orm";

import { db } from "@/db";
import { organization } from "@/db/auth-schema";
import { subscriptions } from "@/db/billing-schema";
import {
  getRequestAdmin,
  logAdminAction,
} from "@/lib/admin";

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Action failed.";
}

export async function POST(req: Request) {
  const adminUser = await getRequestAdmin();
  if (!adminUser) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }
  let body: { organizationId?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { organizationId } = body;
  if (typeof organizationId !== "string" || !organizationId) {
    return Response.json({ error: "Organization is required." }, { status: 400 });
  }

  try {
    const [org] = await db
      .select({ id: organization.id, name: organization.name })
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1);
    if (!org) {
      return Response.json({ error: "Organization not found." }, { status: 404 });
    }
    await db
      .update(subscriptions)
      .set({ status: "canceled", canceledAt: new Date() })
      .where(eq(subscriptions.organizationId, organizationId));
    await logAdminAction({
      actorUserId: adminUser.id,
      actorEmail: adminUser.email,
      action: "billing-cancel",
      targetUserId: organizationId,
      targetEmail: org.name,
    });
  } catch (e) {
    return Response.json({ error: errorMessage(e) }, { status: 400 });
  }
  return Response.json({ ok: true });
}
