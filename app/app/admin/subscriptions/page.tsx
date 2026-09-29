import { eq, ilike, or, sql } from "drizzle-orm";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { organization } from "@/db/auth-schema";
import { subscriptions } from "@/db/billing-schema";
import { requireAdmin } from "@/lib/admin";
import { formatRm, PLANS } from "@/lib/plans";

import { SubRowActions } from "./sub-row-actions";

type SubRow = typeof subscriptions.$inferSelect;

function effectiveStatus(sub: SubRow | null): string {
  if (!sub) return "free";
  if (sub.status === "canceled") return "canceled";
  if (sub.periodEnd.getTime() < Date.now()) return "expired";
  return "active";
}

function statusClass(status: string) {
  if (status === "active")
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  if (status === "expired")
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400";
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string }>;
}) {
  await requireAdmin();
  const { q, plan } = await searchParams;
  const query = q?.trim() ? q.trim() : undefined;
  // "free" means no subscription row; anything else filters the plan id.
  const planFilter = plan === "free" || PLANS.some((p) => p.id === plan) ? plan : undefined;

  const rows = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      sub: subscriptions,
      ownerName: sql<
        string | null
      >`(select u.name from member m join "user" u on u.id = m.user_id where m.organization_id = organization.id order by m.created_at limit 1)`,
      ownerEmail: sql<
        string | null
      >`(select u.email from member m join "user" u on u.id = m.user_id where m.organization_id = organization.id order by m.created_at limit 1)`,
    })
    .from(organization)
    .leftJoin(subscriptions, eq(subscriptions.organizationId, organization.id))
    .where(
      query
        ? or(
            ilike(organization.name, `%${query}%`),
            ilike(organization.slug, `%${query}%`),
            sql`exists (select 1 from member m join "user" u on u.id = m.user_id where m.organization_id = organization.id and u.email ilike ${`%${query}%`})`
          )
        : undefined
    )
    .orderBy(organization.name);

  // Plan filtering happens in JS so "free" (no subscription row) and
  // plan-specific rows share one code path.
  const filteredRows = rows.filter((r) => {
    if (!planFilter) return true;
    if (planFilter === "free") return !r.sub;
    return r.sub?.planId === planFilter;
  });

  const activeRows = filteredRows.filter(
    (r) => effectiveStatus(r.sub) === "active"
  );
  const expiredCount = filteredRows.filter(
    (r) => effectiveStatus(r.sub) === "expired"
  ).length;
  const monthlyEquivalent = activeRows.reduce((sum, r) => {
    const plan = PLANS.find((p) => p.id === r.sub?.planId);
    return sum + (plan?.monthlySen ?? 0);
  }, 0);

  return (
    <>
      <PageHeader title="Subscriptions" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Subscriptions
            </h1>
            <p className="text-sm text-muted-foreground">
              Every workspace subscription across the platform.
            </p>
          </div>
          <form action="/app/admin/subscriptions" className="flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search by name or owner email…"
              className="h-9 w-56 rounded-full border border-zinc-200 bg-transparent px-4 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white"
            />
            <select
              name="plan"
              defaultValue={planFilter ?? ""}
              className="h-9 rounded-full border border-zinc-200 bg-transparent px-3 text-sm outline-none focus:border-zinc-950 dark:border-white/15 dark:focus:border-white"
            >
              <option value="">All plans</option>
              <option value="free">Free</option>
              {PLANS.filter((p) => p.monthlySen > 0).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="flex h-9 items-center rounded-full border border-zinc-200 px-4 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-white/10"
            >
              Filter
            </button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Workspaces</CardDescription>
              <CardTitle className="text-3xl">{filteredRows.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Active paid subscriptions</CardDescription>
              <CardTitle className="text-3xl">{activeRows.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Expired</CardDescription>
              <CardTitle className="text-3xl">{expiredCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Monthly equivalent</CardDescription>
              <CardTitle className="text-3xl">
                {formatRm(monthlyEquivalent)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>By workspace</CardTitle>
            <CardDescription>
              Assign a plan for offline payments (bank transfer), renew, or
              cancel — every action is recorded in the audit log.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {filteredRows.map((row) => {
              const status = effectiveStatus(row.sub);
              return (
                <div
                  key={row.id}
                  className="flex flex-col gap-2 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center"
                >
                  <div className="grid flex-1 leading-tight">
                    <span className="truncate font-medium">
                      {row.name}
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-xs ${statusClass(status)}`}
                      >
                        {status === "free" ? "Free" : status}
                      </span>
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {row.ownerEmail
                        ? `${row.ownerName} · ${row.ownerEmail} · `
                        : ""}
                      {row.sub && status === "active"
                        ? `${row.sub.planId} · ${row.sub.cycle} · period ends ${row.sub.periodEnd.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })} · ${row.slug}`
                        : row.sub
                          ? `last: ${row.sub.planId} · ended ${row.sub.periodEnd.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })} · ${row.slug}`
                          : row.slug}
                    </span>
                  </div>
                  <SubRowActions
                    organizationId={row.id}
                    orgName={row.name}
                    hasCurrent={!!row.sub}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
