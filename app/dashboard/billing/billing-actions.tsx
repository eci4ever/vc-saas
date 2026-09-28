"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import {
  amountInSen,
  CYCLE_LABELS,
  formatRm,
  PLANS,
  type BillingCycle,
  type PlanId,
} from "@/lib/plans";

const CYCLES: BillingCycle[] = ["monthly", "quarterly", "yearly"];

export function BillingActions({
  isOwner,
  hasSubscription,
  returningFromBillplz,
}: {
  isOwner: boolean;
  hasSubscription: boolean;
  returningFromBillplz: string | null;
}) {
  const router = useRouter();
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const verifiedRef = useRef<string | null>(null);

  // Return from Billplz: the query params are untrusted, so ask the server
  // to verify the bill against the Billplz API, then refresh the page data.
  useEffect(() => {
    if (!returningFromBillplz) return;
    if (verifiedRef.current === returningFromBillplz) return;
    verifiedRef.current = returningFromBillplz;
    let cancelled = false;
    (async () => {
      try {
        const res = await authClient.$fetch("/billing/verify", {
          method: "POST",
          body: { billId: returningFromBillplz },
        });
        if (cancelled) return;
        if (res.error) {
          setError("Could not verify the payment yet. Refresh in a moment.");
          return;
        }
        setNotice("Payment confirmed. Your plan is active.");
        router.refresh();
      } catch {
        if (!cancelled) {
          setError("Could not verify the payment yet. Refresh in a moment.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [returningFromBillplz, router]);

  async function subscribe(planId: PlanId, cycle: BillingCycle) {
    setError(null);
    setNotice(null);
    setPendingPlan(`${planId}:${cycle}`);
    try {
      const res = await authClient.$fetch<{ url?: string }>("/billing/subscribe", {
        method: "POST",
        body: { planId, cycle },
      });
      if (res.error || !res.data?.url) {
        setError(res.error?.message ?? "Could not start the payment.");
        setPendingPlan(null);
        return;
      }
      window.location.assign(res.data.url);
    } catch {
      setError("Could not start the payment.");
      setPendingPlan(null);
    }
  }

  async function cancel() {
    setError(null);
    setNotice(null);
    setPendingPlan("cancel");
    const res = await authClient.$fetch("/billing/cancel", {
      method: "POST",
    });
    setPendingPlan(null);
    if (res.error) {
      setError(res.error.message ?? "Could not cancel.");
      return;
    }
    router.refresh();
  }

  if (!isOwner) {
    return (
      <p className="text-sm text-muted-foreground">
        Only the workspace owner can change the plan. Ask them to subscribe or
        renew from this page.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{hasSubscription ? "Change or renew" : "Upgrade"}</CardTitle>
        <CardDescription>
          Paying a plan starts a new period immediately, paid via Billplz FPX.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
            {notice}
          </p>
        ) : null}
        {PLANS.filter((plan) => plan.monthlySen > 0).map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col gap-3 rounded-xl border p-4"
          >
            <div>
              <p className="font-medium">{plan.name}</p>
              <p className="text-sm text-muted-foreground">
                {plan.description}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {CYCLES.map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  disabled={pendingPlan !== null}
                  onClick={() => subscribe(plan.id as PlanId, cycle)}
                  className="flex h-9 flex-1 min-w-36 items-center justify-between rounded-full border border-zinc-200 px-4 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10"
                >
                  <span>{CYCLE_LABELS[cycle]}</span>
                  <span className="text-muted-foreground">
                    {pendingPlan === `${plan.id}:${cycle}`
                      ? "Redirecting…"
                      : formatRm(amountInSen(plan.id as PlanId, cycle))}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {hasSubscription ? (
          <button
            type="button"
            disabled={pendingPlan !== null}
            onClick={cancel}
            className="h-9 w-fit rounded-lg border border-red-500/30 px-3 text-sm text-red-700 transition-colors hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
          >
            {pendingPlan === "cancel"
              ? "Cancelling…"
              : "Cancel subscription (back to Free)"}
          </button>
        ) : null}
      </CardContent>
    </Card>
  );
}
