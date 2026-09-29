import { and, desc, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { payments, subscriptions } from "@/db/billing-schema";
import {
  cycleMonths,
  type BillingCycle,
  type PlanId,
} from "@/lib/plans";

export type SubscriptionStatus = "active" | "expired" | "canceled";

export type SubscriptionView = {
  planId: string;
  cycle: string;
  /** Expiry is derived at read time — a passed period_end is Expired even
   * before any request touches the row. */
  status: SubscriptionStatus;
  periodStart: Date;
  periodEnd: Date;
};

export async function getSubscription(
  organizationId: string
): Promise<SubscriptionView | null> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, organizationId))
    .limit(1);
  if (!row) return null;
  let status: SubscriptionStatus = "active";
  if (row.status === "canceled") status = "canceled";
  else if (row.periodEnd.getTime() < Date.now()) status = "expired";
  return {
    planId: row.planId,
    cycle: row.cycle,
    status,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
  };
}

export async function listPayments(organizationId: string, limit = 20) {
  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.organizationId, organizationId))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
  // Derive the "lapsed" flag server-side: a due bill past its 7-day window
  // is no longer payable (Billplz already cut it off at due_at).
  return rows.map((row) => ({
    ...row,
    lapsed:
      row.status === "due" &&
      Date.now() - row.createdAt.getTime() > BILL_DUE_DAYS * 24 * 60 * 60 * 1000,
  }));
}

export type PaymentRow = Awaited<ReturnType<typeof listPayments>>[number];

/**
 * A due bill's payment window: Billplz stops accepting payment at due_at,
 * and anything still due past the window is shown as expired.
 */
export const BILL_DUE_DAYS = 7;

/**
 * Mark every other "due" bill of this organization as canceled — only one
 * payable bill exists at a time (newest wins).
 */
export async function supersedeOtherDueBills(
  organizationId: string,
  keepBillId: string
) {
  await db
    .update(payments)
    .set({ status: "canceled", canceledAt: new Date() })
    .where(
      and(
        eq(payments.organizationId, organizationId),
        eq(payments.status, "due"),
        ne(payments.billId, keepBillId)
      )
    );
}

/**
 * Anchor semantics for starting a period:
 * - "auto" (online payments): renew from period_end only when paying the
 *   SAME plan+cycle while still active; everything else restarts now.
 * - "now" / "period_end": the platform admin's explicit choice for offline
 *   assignments.
 */
export type PaymentAnchor = "auto" | "now" | "period_end";

/**
 * Mark a bill paid and start (or extend) the subscription.
 * Idempotent: the update only claims rows still in "due", so a webhook
 * plus a redirect-return verification can both fire safely.
 */
export async function activateFromPayment(input: {
  billId: string;
  organizationId: string;
  planId: PlanId;
  cycle: BillingCycle;
  paidAt: Date;
  anchor?: PaymentAnchor;
}): Promise<boolean> {
  const claimed = await db
    .update(payments)
    .set({ status: "paid", paidAt: input.paidAt })
    .where(
      and(eq(payments.billId, input.billId), eq(payments.status, "due"))
    )
    .returning({ id: payments.id });
  if (claimed.length === 0) return false;
  await supersedeOtherDueBills(input.organizationId, input.billId);

  const [current] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, input.organizationId))
    .limit(1);

  const anchor = input.anchor ?? "auto";
  const currentlyActive =
    current &&
    current.status === "active" &&
    current.periodEnd.getTime() > input.paidAt.getTime();

  const periodStart =
    anchor === "now"
      ? input.paidAt
      : anchor === "period_end"
        ? currentlyActive
          ? current.periodEnd
          : input.paidAt
        : currentlyActive &&
            current.planId === input.planId &&
            current.cycle === input.cycle
          ? current.periodEnd
          : input.paidAt;
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + cycleMonths(input.cycle));

  await db
    .insert(subscriptions)
    .values({
      organizationId: input.organizationId,
      planId: input.planId,
      cycle: input.cycle,
      status: "active",
      periodStart,
      periodEnd,
    })
    .onConflictDoUpdate({
      target: subscriptions.organizationId,
      set: {
        planId: input.planId,
        cycle: input.cycle,
        status: "active",
        periodStart,
        periodEnd,
        canceledAt: null,
        // A new period clears both notification flags.
        reminderSentAt: null,
        expiredNotifiedAt: null,
      },
    });
  return true;
}

export async function cancelSubscription(organizationId: string) {
  await db
    .update(subscriptions)
    .set({ status: "canceled", canceledAt: new Date() })
    .where(eq(subscriptions.organizationId, organizationId));
}

/**
 * Record an offline payment (bank transfer etc.) recorded by the platform
 * admin: a paid invoice row plus the same activation/renewal logic as an
 * online payment.
 */
export async function recordOfflinePayment(input: {
  organizationId: string;
  userId: string;
  planId: PlanId;
  cycle: BillingCycle;
  amount: number;
  note: string;
  anchor: PaymentAnchor;
}): Promise<void> {
  const billId = `offline-${crypto.randomUUID()}`;
  await db.insert(payments).values({
    organizationId: input.organizationId,
    userId: input.userId,
    billId,
    planId: input.planId,
    cycle: input.cycle,
    amount: input.amount,
    status: "due",
    method: "offline",
    billUrl: "",
  });
  // Activates through the same idempotent path as an online payment: marks
  // the invoice paid, supersedes other due bills, starts/extends the period.
  await activateFromPayment({
    billId,
    organizationId: input.organizationId,
    planId: input.planId,
    cycle: input.cycle,
    paidAt: new Date(),
    anchor: input.anchor,
  });
  void input.note; // surfaced via the admin audit log reason, not the invoice
}
