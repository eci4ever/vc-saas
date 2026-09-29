import { ilike, or, sql } from "drizzle-orm";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { member, organization, team, user } from "@/db/auth-schema";
import { requireAdmin } from "@/lib/admin";

import { OrgRowActions } from "./org-row-actions";

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ? q.trim() : undefined;

  await requireAdmin();

  const rows = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
      memberCount: sql<number>`(select count(*)::int from ${member} where ${member.organizationId} = ${organization.id})`,
      teamCount: sql<number>`(select count(*)::int from ${team} where ${team.organizationId} = ${organization.id})`,
      // First owner (or earliest member) identifies the workspace, which
      // matters now that every default workspace shares the same name. The
      // outer column is written qualified ("organization"."id") because the
      // joined m/u tables make an unqualified "id" ambiguous inside PG.
      ownerName: sql<
        string | null
      >`(select u.name from ${member} m join ${user} u on u.id = m.user_id where m.organization_id = organization.id order by m.created_at limit 1)`,
      ownerEmail: sql<
        string | null
      >`(select u.email from ${member} m join ${user} u on u.id = m.user_id where m.organization_id = organization.id order by m.created_at limit 1)`,
    })
    .from(organization)
    .where(
      query
        ? or(
            ilike(organization.name, `%${query}%`),
            ilike(organization.slug, `%${query}%`),
            // Search by the owner's email too — the fastest way to find a
            // specific user's workspace when names are identical.
            sql`exists (select 1 from ${member} m join ${user} u on u.id = m.user_id where m.organization_id = organization.id and u.email ilike ${`%${query}%`})`
          )
        : undefined
    )
    .orderBy(organization.createdAt);

  // Header counts reflect the whole table, not just the filtered page.
  const [totals] = await db
    .select({
      orgs: sql<number>`(select count(*)::int from ${organization})`,
      members: sql<number>`(select count(*)::int from ${member})`,
      teams: sql<number>`(select count(*)::int from ${team})`,
    })
    .from(sql`(select 1) as _`);

  return (
    <>
      <PageHeader title="Organizations" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex w-full flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
            <p className="text-sm text-muted-foreground">
              {totals?.orgs ?? rows.length} organizations · {totals?.members ?? 0}{" "}
              memberships · {totals?.teams ?? 0} teams. Renames and deletions
              here are written to the audit log.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>All organizations</CardTitle>
              <CardDescription>Search by name, slug, or owner email.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <form method="get" className="flex gap-2">
                <input
                  name="q"
                  defaultValue={query ?? ""}
                  placeholder="Search organizations…"
                  className="h-10 flex-1 rounded-xl border border-zinc-200 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white"
                />
                <button
                  type="submit"
                  className="flex h-10 items-center rounded-full border border-zinc-200 px-4 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-white/10"
                >
                  Search
                </button>
              </form>
              {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No organizations found.</p>
              ) : (
                rows.map((org) => (
                  <div
                    key={org.id}
                    className="flex flex-col gap-2 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center"
                  >
                    <div className="grid flex-1 leading-tight">
                      <span className="truncate font-medium">{org.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {org.ownerEmail
                          ? `${org.ownerName} · ${org.ownerEmail} · `
                          : ""}
                        {org.slug} · {org.memberCount} member
                        {org.memberCount === 1 ? "" : "s"} · {org.teamCount} team
                        {org.teamCount === 1 ? "" : "s"} · created{" "}
                        {new Date(org.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <OrgRowActions organizationId={org.id} orgName={org.name} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
