import { and, desc, eq } from "drizzle-orm";

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
  return db
    .select()
    .from(payments)
    .where(eq(payments.organizationId, organizationId))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
}

export type PaymentRow = Awaited<ReturnType<typeof listPayments>>[number];

/**
 * Mark a bill paid and start (or restart) the subscription. Idempotent:
 * a webhook plus a redirect-return verification can both fire — the update
 * only claims rows still in "due", so the second caller sees zero rows and
 * never double-extends the period.
 */
export async function activateFromPayment(input: {
  billId: string;
  organizationId: string;
  planId: PlanId;
  cycle: BillingCycle;
  paidAt: Date;
}): Promise<boolean> {
  const claimed = await db
    .update(payments)
    .set({ status: "paid", paidAt: input.paidAt })
    .where(
      and(eq(payments.billId, input.billId), eq(payments.status, "due"))
    )
    .returning({ id: payments.id });
  if (claimed.length === 0) return false;

  const periodStart = input.paidAt;
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
