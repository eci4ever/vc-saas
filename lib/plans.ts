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

/**
 * Per-workspace limits a plan enforces. `null` means unlimited. These are
 * enforced server-side on invite/accept (seats) and team create (teams).
 */
export type PlanLimits = {
  /** Max members in the workspace, the owner included. */
  seats: number | null;
  /** Max teams inside the workspace. */
  teams: number | null;
};

export type Plan = {
  id: PlanId;
  name: string;
  description: string;
  /** Base price per month, MYR sen. Free is 0. */
  monthlySen: number;
  limits: PlanLimits;
  /**
   * Gated capability flags checked via hasFeature(). The starter ships with
   * none — add your own (e.g. "custom-domain") and gate UI/API on it.
   */
  features: readonly string[];
};

export const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Everything in the starter, for one workspace.",
    monthlySen: 0,
    limits: { seats: 3, teams: 1 },
    features: [],
  },
  {
    id: "starter",
    name: "Starter",
    description: "For small teams getting serious.",
    monthlySen: 2900,
    limits: { seats: 10, teams: 5 },
    features: [],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For workspaces that need it all.",
    monthlySen: 7900,
    limits: { seats: null, teams: null },
    features: [],
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

export function planLimits(planId: string): PlanLimits {
  return (
    PLANS.find((p) => p.id === planId)?.limits ?? { seats: null, teams: null }
  );
}

/** "3 seats" / "Unlimited seats" for UI copy. */
export function limitLabel(value: number | null, noun: string): string {
  return value === null
    ? `Unlimited ${noun}s`
    : `${value} ${noun}${value === 1 ? "" : "s"}`;
}

/** True when the given plan unlocks the capability flag. */
export function hasFeature(planId: string, feature: string): boolean {
  return (
    PLANS.find((p) => p.id === planId)?.features.includes(feature) ?? false
  );
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
