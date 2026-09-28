import { eq } from "drizzle-orm";

import { db } from "@/db";
import { payments } from "@/db/billing-schema";
import { activateFromPayment } from "@/lib/billing";
import { verifyXSignature } from "@/lib/billplz";
import { isBillingCycle, isPlanId } from "@/lib/plans";

async function read(req: Request): Promise<Record<string, string> | null> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const body = (await req.json()) as Record<string, unknown>;
      return Object.fromEntries(
        Object.entries(body).map(([k, v]) => [k, String(v)])
      );
    } catch {
      return null;
    }
  }
  const form = await req.formData();
  return Object.fromEntries(
    [...form.entries()].map(([k, v]) => [k, String(v)])
  );
}

export async function POST(req: Request) {
  const params = await read(req);
  if (!params) {
    return Response.json({ error: "Invalid callback." }, { status: 400 });
  }
  // Billplz sends x_signature as a body field; accept a header too.
  const signature =
    params.x_signature ?? req.headers.get("x-signature");
  if (!verifyXSignature(signature, params)) {
    return Response.json({ error: "Invalid signature." }, { status: 403 });
  }

  const billId = params.id;
  if (!billId) {
    return Response.json({ error: "Missing bill id." }, { status: 400 });
  }
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.billId, billId))
    .limit(1);
  // Unknown bills get a 200 so Billplz stops retrying; there is nothing to
  // act on for a bill this workspace never created.
  if (!payment) return Response.json({ ok: true });

  const transactionStatus = (
    params.transaction_status ?? ""
  ).toLowerCase();
  const paid =
    params.paid === "true" ||
    params.paid === "1" ||
    transactionStatus === "completed";
  if (!paid) {
    // Not a payment event (e.g. created/failed callback) — acknowledge only.
    return Response.json({ ok: true });
  }
  if (!isPlanId(payment.planId) || !isBillingCycle(payment.cycle)) {
    return Response.json({ ok: true });
  }

  const paidAt = params.paid_at
    ? new Date(Number(params.paid_at) * 1000)
    : new Date();
  if (Number.isNaN(paidAt.getTime())) {
    return Response.json({ ok: true });
  }

  await activateFromPayment({
    billId,
    organizationId: payment.organizationId,
    planId: payment.planId,
    cycle: payment.cycle,
    paidAt,
  });
  return Response.json({ ok: true });
}
