"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  amountInSen,
  BILLING_CYCLES,
  formatRm,
  PLANS,
  type BillingCycle,
  type PlanId,
} from "@/lib/plans";

// Plain fetch, NOT authClient.$fetch — the latter prefixes /api/auth and
// would miss these app routes entirely.
async function postBilling<T>(
  path: "/subscribe" | "/cancel" | "/verify",
  body?: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  const res = await fetch(`/api/billing${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // Non-JSON error body.
  }
  if (!res.ok) {
    const message =
      (payload as { error?: string } | null)?.error ?? "Action failed.";
    return { data: null, error: message };
  }
  return { data: (payload ?? null) as T | null, error: null };
}

const PERIOD_SUFFIX: Record<BillingCycle, string> = {
  monthly: "/month",
  quarterly: "/quarter",
  yearly: "/year",
};

export function PlanPicker({
  hasSubscription,
  activePlan,
  currentPlanId,
  currentCycle,
  returningFromBillplz,
}: {
  hasSubscription: boolean;
  activePlan: boolean;
  currentPlanId: string | null;
  currentCycle: string | null;
  returningFromBillplz: string | null;
}) {
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const verifiedRef = useRef<string | null>(null);

  // Return from Billplz: the query params are untrusted, so ask the server
  // to verify the bill against the Billplz API, then refresh the page data.
  useEffect(() => {
    if (!returningFromBillplz) return;
    if (verifiedRef.current === returningFromBillplz) return;
    verifiedRef.current = returningFromBillplz;
    let cancelled = false;
    (async () => {
      const { error: verifyError } = await postBilling("/verify", {
        billId: returningFromBillplz,
      });
      if (cancelled) return;
      if (verifyError) {
        toast.error("Could not verify the payment yet. Refresh in a moment.");
        return;
      }
      toast.success("Payment confirmed — your plan is active.");
      router.refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [returningFromBillplz, router]);

  async function subscribe(planId: PlanId, selected: BillingCycle) {
    setPendingPlan(`${planId}:${selected}`);
    const { data, error: subscribeError } = await postBilling<{ url: string }>(
      "/subscribe",
      { planId, cycle: selected }
    );
    if (subscribeError || !data?.url) {
      setPendingPlan(null);
      toast.error(subscribeError ?? "Could not start the payment.");
      return;
    }
    window.location.assign(data.url);
  }

  async function cancel() {
    setPendingPlan("cancel");
    const { error: cancelError } = await postBilling("/cancel");
    setPendingPlan(null);
    if (cancelError) {
      toast.error(cancelError);
      return;
    }
    setCancelOpen(false);
    toast.success("Subscription canceled — back to Free.");
    router.refresh();
  }

  const isCurrent = (planId: string) =>
    hasSubscription &&
    currentPlanId === planId &&
    (currentPlanId === "free" || currentCycle === cycle);

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        value={cycle}
        onValueChange={(value) => setCycle(value as BillingCycle)}
        className="w-fit"
      >
        <TabsList>
          {BILLING_CYCLES.map((option) => (
            <TabsTrigger key={option} value={option}>
              {option === "monthly"
                ? "Monthly"
                : option === "quarterly"
                  ? "Quarterly −10%"
                  : "Yearly −20%"}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const current = isCurrent(plan.id);
          const price = formatRm(amountInSen(plan.id as PlanId, cycle));
          return (
            <Card
              key={plan.id}
              className={cn(
                current &&
                  "border-zinc-950 dark:border-white"
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {current ? <Badge>Current</Badge> : null}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <p className="text-3xl font-semibold tracking-tight">
                  {price}
                  <span className="text-sm font-normal text-muted-foreground">
                    {plan.monthlySen === 0
                      ? " forever"
                      : PERIOD_SUFFIX[cycle]}
                  </span>
                </p>
                {plan.monthlySen === 0 ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={activePlan}
                  >
                    {activePlan
                      ? "Cancel your plan to return to Free"
                      : "Default plan"}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={
                      (currentPlanId !== null && current) ||
                      pendingPlan !== null
                    }
                    onClick={() => subscribe(plan.id as PlanId, cycle)}
                  >
                    {pendingPlan === `${plan.id}:${cycle}`
                      ? "Redirecting…"
                      : currentPlanId !== null && current
                        ? "Current plan"
                        : hasSubscription
                          ? `Switch to ${plan.name}`
                          : `Choose ${plan.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {activePlan ? (
        <>
          <button
            type="button"
            disabled={pendingPlan !== null}
            onClick={() => setCancelOpen(true)}
            className="h-9 w-fit rounded-lg border border-red-500/30 px-3 text-sm text-red-700 transition-colors hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
          >
            Cancel subscription (back to Free)
          </button>
          <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
                <AlertDialogDescription>
                  The workspace returns to Free immediately. Any paid period
                  still showing is kept as history. You can subscribe again at
                  any time.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pendingPlan !== null}>
                  Keep plan
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={pendingPlan !== null}
                  onClick={(e) => {
                    e.preventDefault();
                    cancel();
                  }}
                  className="text-red-600 dark:text-red-400"
                >
                  {pendingPlan === "cancel"
                    ? "Cancelling…"
                    : "Cancel subscription"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </div>
  );
}
