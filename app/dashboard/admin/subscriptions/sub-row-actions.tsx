"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";

import {
  amountInSen,
  BILLING_CYCLES,
  CYCLE_LABELS,
  formatRm,
  PLANS,
} from "@/lib/plans";

const PAID_PLANS = PLANS.filter((p) => p.monthlySen > 0);

async function postAction(
  path: "/assign" | "/cancel",
  body: Record<string, string | boolean>
): Promise<string | null> {
  const res = await fetch(`/api/admin/billing${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) return null;
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? "Action failed.";
  } catch {
    return "Action failed.";
  }
}

export function SubRowActions({
  organizationId,
  orgName,
  hasCurrent,
}: {
  organizationId: string;
  orgName: string;
  hasCurrent: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [planId, setPlanId] = useState<string>(PAID_PLANS[0]?.id ?? "starter");
  const [cycle, setCycle] = useState<string>("monthly");
  const [renewFromEnd, setRenewFromEnd] = useState(false);
  const [note, setNote] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);

  async function handleAssign() {
    setError(null);
    setPending(true);
    const message = await postAction("/assign", {
      organizationId,
      planId,
      cycle,
      anchor: renewFromEnd ? "period_end" : "now",
      note,
    });
    setPending(false);
    if (message) {
      setError(message);
      return;
    }
    setAssignOpen(false);
    setNote("");
    router.refresh();
  }

  async function handleCancel() {
    setError(null);
    setPending(true);
    const message = await postAction("/cancel", { organizationId });
    setPending(false);
    if (message) {
      setError(message);
      return;
    }
    setCancelOpen(false);
    router.refresh();
  }

  const selectedAmount = PAID_PLANS.find((p) => p.id === planId)
    ? formatRm(
        amountInSen(
          planId as (typeof PLANS)[number]["id"],
          cycle as "monthly"
        )
      )
    : "";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => setAssignOpen(true)}
          className="flex h-9 items-center rounded-lg border border-zinc-200 px-3 text-sm transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10"
        >
          Assign / Renew
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                disabled={pending}
                title="More actions"
                className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-white/15 dark:text-zinc-400 dark:hover:bg-white/10"
              />
            }
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4}>
            <DropdownMenuItem
              onClick={() => setCancelOpen(true)}
              disabled={pending || !hasCurrent}
              className="text-red-600 dark:text-red-400"
            >
              Cancel subscription
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <AlertDialog open={assignOpen} onOpenChange={setAssignOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign plan — {orgName}</AlertDialogTitle>
            <AlertDialogDescription>
              For offline payments and corrections. Nothing is charged; the
              action is recorded in the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 text-sm">
            <label className="flex flex-col gap-1 font-medium">
              Plan
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="h-10 rounded-xl border border-zinc-200 bg-transparent px-3 font-normal outline-none dark:border-white/15"
              >
                {PAID_PLANS.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 font-medium">
              Cycle
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
                className="h-10 rounded-xl border border-zinc-200 bg-transparent px-3 font-normal outline-none dark:border-white/15"
              >
                {BILLING_CYCLES.map((c) => (
                  <option key={c} value={c}>
                    {CYCLE_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 font-normal">
              <input
                type="checkbox"
                checked={renewFromEnd}
                onChange={(e) => setRenewFromEnd(e.target.checked)}
              />
              Renew from current period end (offline renewal)
            </label>
            <label className="flex flex-col gap-1 font-medium">
              Note (optional)
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. bank transfer ref 8812"
                className="h-10 rounded-xl border border-zinc-200 bg-transparent px-3 font-normal outline-none focus:border-zinc-950 dark:border-white/15 dark:focus:border-white"
              />
            </label>
            <p className="text-xs text-muted-foreground">
              Amount received offline should match {selectedAmount}.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                handleAssign();
              }}
            >
              {pending ? "Saving…" : "Assign"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel “{orgName}” subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              The workspace returns to Free immediately. History is kept and
              the action is recorded in the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
            >
              {pending ? "Cancelling…" : "Cancel subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
