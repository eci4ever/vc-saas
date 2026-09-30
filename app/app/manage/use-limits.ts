"use client";

import { useEffect, useState } from "react";

import { planName, type PlanLimits } from "@/lib/plans";

export type PlanLimitsData = {
  planId: string;
  limits: PlanLimits;
  usage: { seats: number; teams: number };
};

/**
 * Plan + usage for the active workspace, from /api/manage/limits (plain
 * fetch — authClient.$fetch prefixes /api/auth and would 404 here).
 * Refresh by bumping reloadToken after membership changes. Returns null
 * while loading or when there is no active workspace.
 */
export function usePlanLimits(organizationId?: string, reloadToken = 0) {
  const [data, setData] = useState<PlanLimitsData | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/manage/limits?organizationId=${organizationId}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const json = (await res.json()) as PlanLimitsData;
        if (!cancelled) setData(json);
      } catch {
        // Limits are informational; the page works without them.
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [organizationId, reloadToken]);

  return organizationId ? data : null;
}

/** "2 / 3 seats" — falls back to plain count when limits are unavailable. */
export function seatsLabel(data: PlanLimitsData | null, used: number): string {
  if (!data) return `${used}`;
  const max = data.limits.seats;
  return max === null ? `${used}` : `${used} / ${max}`;
}

/** "Free plan · 2 of 3 seats used" / "Pro plan · Unlimited seats". */
export function usageLine(
  data: PlanLimitsData | null,
  noun: "seats" | "teams"
): string | null {
  if (!data) return null;
  const used = noun === "seats" ? data.usage.seats : data.usage.teams;
  const max = noun === "seats" ? data.limits.seats : data.limits.teams;
  const detail =
    max === null
      ? `unlimited ${noun}`
      : `${used} of ${max} ${noun} used`;
  return `${planName(data.planId)} plan · ${detail}`;
}
