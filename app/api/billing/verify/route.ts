import { eq } from "drizzle-orm";

import { db } from "@/db";
import { payments } from "@/db/billing-schema";
import { activateFromPayment } from "@/lib/billing";
import { getBill } from "@/lib/billplz";
import { getAccessContext } from "@/lib/guards";
import { isOrgOwner } from "@/lib/access";
import { isBillingCycle, isPlanId } from "@/lib/plans";

/**
 * The payer's browser is back from Billplz. The query params are untrusted,
 * so the bill's paid status is re-read from the Billplz API server-side —
 * this also activates payments on machines that never receive the webhook
 * (local dev), while remaining the belt to the webhook's braces in prod.
 */
export async function POST(req: Request) {
  const ctx = await getAccessContext();
  if (!ctx || !isOrgOwner(ctx.orgRole)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }
  let body: { billId?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  const billId = typeof body.billId === "string" ? body.billId : "";
  if (!billId) {
    return Response.json({ error: "Missing bill id." }, { status: 400 });
  }

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.billId, billId))
    .limit(1);
  if (!payment || payment.organizationId !== ctx.activeOrganizationId) {
    return Response.json({ error: "Unknown bill." }, { status: 404 });
  }

  let paid: boolean;
  try {
    paid = (await getBill(billId)).paid;
  } catch (e) {
    console.error("Billplz verify failed:", e);
    return Response.json(
      { error: "Could not verify the payment yet." },
      { status: 502 }
    );
  }
  if (!paid) {
    return Response.json({ status: "due" });
  }
  if (!isPlanId(payment.planId) || !isBillingCycle(payment.cycle)) {
    return Response.json({ error: "Unknown plan on bill." }, { status: 400 });
  }
  await activateFromPayment({
    billId,
    organizationId: payment.organizationId,
    planId: payment.planId,
    cycle: payment.cycle,
    paidAt: new Date(),
  });
  return Response.json({ status: "paid" });
}
