/**
 * The plan catalog is hardcoded (grilled decision): Free, Starter, Pro with
 * monthly, quarterly (-10%) and yearly (-20%) cycles. Billplz bills MYR
 * only, so every amount is MYR sen.
 */
export type PlanId = "free" | "starter" | "pro";
export type BillingCycle = "monthly" | "quarterly" | "yearly";

export const PLAN_IDS: readonly PlanId[] = ["free", "starter", "pro"];
export const BILLING_CYCLES: readonly BillingCycle[] = [
  "monthly",
  "quarterly",
  "yearly",
];

export type Plan = {
  id: PlanId;
  name: string;
  description: string;
  /** Base price per month, MYR sen. Free is 0. */
  monthlySen: number;
};

export const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Everything in the starter, for one workspace.",
    monthlySen: 0,
  },
  {
    id: "starter",
    name: "Starter",
    description: "For small teams getting serious.",
    monthlySen: 2900,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For workspaces that need it all.",
    monthlySen: 7900,
  },
];

const CYCLE_DISCOUNT: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 0.9,
  yearly: 0.8,
};

const CYCLE_MONTHS: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

export const CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "monthly",
  quarterly: "quarterly (−10%)",
  yearly: "yearly (−20%)",
};

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && PLAN_IDS.includes(value as PlanId);
}

export function isBillingCycle(value: unknown): value is BillingCycle {
  return (
    typeof value === "string" &&
    BILLING_CYCLES.includes(value as BillingCycle)
  );
}

export function cycleMonths(cycle: BillingCycle): number {
  return CYCLE_MONTHS[cycle];
}

export function planName(planId: string): string {
  return PLANS.find((p) => p.id === planId)?.name ?? planId;
}

/** Total bill amount for a plan and cycle, MYR sen. */
export function amountInSen(planId: PlanId, cycle: BillingCycle): number {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan || plan.monthlySen === 0) return 0;
  const total = plan.monthlySen * CYCLE_MONTHS[cycle] * CYCLE_DISCOUNT[cycle];
  return Math.round(total);
}

/** RM display string from MYR sen. */
export function formatRm(sen: number): string {
  return `RM${(sen / 100).toFixed(2)}`;
}
