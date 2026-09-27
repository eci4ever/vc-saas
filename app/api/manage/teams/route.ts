import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { member, team, teamMember, user as userTable } from "@/db/auth-schema";
import { isOrgManager } from "@/lib/access";
import { auth } from "@/lib/auth";

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Action failed.";
}

/**
 * Team rosters for the Manage → Teams page. better-auth's own
 * /organization/list-team-members only answers to members of the team
 * itself, so managers read the roster here instead (same direct-DB pattern
 * as the admin organization routes, scoped to org managers).
 */
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const organizationId = new URL(req.url).searchParams.get("organizationId");
  if (!organizationId) {
    return Response.json({ error: "Organization is required." }, { status: 400 });
  }

  const [mine] = await db
    .select({ role: member.role })
    .from(member)
    .where(
      and(
        eq(member.organizationId, organizationId),
        eq(member.userId, session.user.id)
      )
    )
    .limit(1);
  if (!isOrgManager(mine?.role ?? null)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const teams = await db
      .select({ id: team.id, name: team.name })
      .from(team)
      .where(eq(team.organizationId, organizationId));

    const rosters = await db
      .select({
        teamId: teamMember.teamId,
        id: teamMember.id,
        userId: teamMember.userId,
        name: userTable.name,
        email: userTable.email,
      })
      .from(teamMember)
      .innerJoin(userTable, eq(userTable.id, teamMember.userId))
      .innerJoin(team, eq(team.id, teamMember.teamId))
      .where(eq(team.organizationId, organizationId));

    return Response.json({
      teams: teams.map((t) => ({
        ...t,
        members: rosters
          .filter((r) => r.teamId === t.id)
          .map(({ id, userId, name, email }) => ({ id, userId, name, email })),
      })),
    });
  } catch (e) {
    return Response.json({ error: errorMessage(e) }, { status: 400 });
  }
}
