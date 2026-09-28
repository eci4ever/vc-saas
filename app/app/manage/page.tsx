import Link from "next/link";
import { and, count, eq } from "drizzle-orm";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { invitation, member, team } from "@/db/auth-schema";
import { requireOrgManager } from "@/lib/guards";

export default async function ManageOverviewPage() {
  const ctx = await requireOrgManager();
  const orgId = ctx.activeOrganizationId!;

  const [members] = await db
    .select({ value: count() })
    .from(member)
    .where(eq(member.organizationId, orgId));
  const [teams] = await db
    .select({ value: count() })
    .from(team)
    .where(eq(team.organizationId, orgId));
  const [pending] = await db
    .select({ value: count() })
    .from(invitation)
    .where(
      and(
        eq(invitation.organizationId, orgId),
        eq(invitation.status, "pending")
      )
    );

  const stats = [
    {
      title: "Members",
      value: members.value,
      description: "People with access to this workspace.",
      href: "/app/manage/members",
    },
    {
      title: "Teams",
      value: teams.value,
      description: "Groups that organize members.",
      href: "/app/manage/teams",
    },
    {
      title: "Pending invitations",
      value: pending.value,
      description: "Waiting for a response.",
      href: "/app/manage/invitations",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Overview" />
      <p className="text-sm text-muted-foreground">
        A quick look at {ctx.activeOrganizationName} — you manage it as{" "}
        {ctx.orgRole?.split(",")[0]}.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader>
              <CardDescription>{stat.title}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {stat.description}
              </p>
              <Link
                href={stat.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Manage →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
