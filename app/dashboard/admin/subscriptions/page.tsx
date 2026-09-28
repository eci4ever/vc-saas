import { eq, ilike } from "drizzle-orm";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const query = q?.trim() ? q.trim() : undefined;

  const rows = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      sub: subscriptions,
    })
    .from(organization)
    .leftJoin(subscriptions, eq(subscriptions.organizationId, organization.id))
    .where(query ? ilike(organization.name, `%${query}%`) : undefined)
    .orderBy(organization.name);

  const activeRows = rows.filter((r) => effectiveStatus(r.sub) === "active");
  const expiredCount = rows.filter(
    (r) => effectiveStatus(r.sub) === "expired"
  ).length;
  const monthlyEquivalent = activeRows.reduce((sum, r) => {
    const plan = PLANS.find((p) => p.id === r.sub?.planId);
    return sum + (plan?.monthlySen ?? 0);
  }, 0);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Admin · Subscriptions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
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
          <form action="/dashboard/admin/subscriptions" className="flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search workspaces…"
              className="h-9 w-56 rounded-full border border-zinc-200 bg-transparent px-4 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white"
            />
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Workspaces</CardDescription>
              <CardTitle className="text-3xl">{rows.length}</CardTitle>
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
            {rows.map((row) => {
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
                      {row.sub && status === "active"
                        ? `${row.sub.planId} · ${row.sub.cycle} · period ends ${row.sub.periodEnd.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}`
                        : row.sub
                          ? `last: ${row.sub.planId} · ended ${row.sub.periodEnd.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}`
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
