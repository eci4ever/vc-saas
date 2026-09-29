import { db } from "@/db";
import { payments } from "@/db/billing-schema";
import { getAccessContext } from "@/lib/guards";
import { isOrgOwner } from "@/lib/access";
import { createBill } from "@/lib/billplz";
import { supersedeOtherDueBills, BILL_DUE_DAYS } from "@/lib/billing";
import { amountInSen, isBillingCycle, isPlanId, planName } from "@/lib/plans";

function appUrl(): string {
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

export async function POST(req: Request) {
  const ctx = await getAccessContext();
  // Billing actions are owner-only (grilled decision): managers and members
  // can look, only the owner spends.
  if (!ctx || !isOrgOwner(ctx.orgRole)) {
    return Response.json(
      { error: "Only the workspace owner can subscribe." },
      { status: 403 }
    );
  }
  const organizationId = ctx.activeOrganizationId;
  if (!organizationId) {
    return Response.json(
      { error: "No active workspace." },
      { status: 400 }
    );
  }

  let body: { planId?: unknown; cycle?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { planId, cycle } = body;
  if (!isPlanId(planId) || planId === "free") {
    return Response.json({ error: "Choose a paid plan." }, { status: 400 });
  }
  if (!isBillingCycle(cycle)) {
    return Response.json({ error: "Choose a billing cycle." }, { status: 400 });
  }

  const amount = amountInSen(planId, cycle);
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + BILL_DUE_DAYS);
  try {
    const bill = await createBill({
      email: ctx.user.email,
      name: ctx.user.name || ctx.user.email,
      amount,
      description: `${planName(planId)} plan (${cycle}) for ${ctx.activeOrganizationName ?? "workspace"}`,
      callbackUrl: `${appUrl()}/api/billing/webhook`,
      // Billplz appends billplz_id + billplz_paid; the page re-verifies the
      // bill server-side instead of trusting the query params.
      redirectUrl: `${appUrl()}/app/billing?billplz=return`,
      dueAt,
    });
    await db.insert(payments).values({
      organizationId,
      userId: ctx.user.id,
      billId: bill.id,
      planId,
      cycle,
      amount,
      status: "due",
      billUrl: bill.url,
    });
    // Only one payable bill at a time: the newest wins, older due bills are
    // marked canceled so the invoice list never shows competing pay links.
    await supersedeOtherDueBills(organizationId, bill.id);
    return Response.json({ url: bill.url });
  } catch (e) {
    console.error("Billplz subscribe failed:", e);
    return Response.json(
      { error: "Could not start the payment. Try again." },
      { status: 502 }
    );
  }
}
