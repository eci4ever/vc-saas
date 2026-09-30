import { headers } from "next/headers";
import { and, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { member, team } from "@/db/auth-schema";
import { isOrgManager } from "@/lib/access";
import { auth } from "@/lib/auth";
import { getOrgPlan } from "@/lib/billing";
import { planLimits } from "@/lib/plans";

/**
 * Current plan + usage against plan limits for the active workspace. Drives
 * the "seats used" badges on the Members and Teams pages.
 */
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const organizationId = new URL(req.url).searchParams.get("organizationId");
  if (!organizationId) {
    return Response.json(
      { error: "Organization is required." },
      { status: 400 }
    );
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

  const planId = await getOrgPlan(organizationId);
  const limits = planLimits(planId);
  const [seatsUsed] = await db
    .select({ value: count() })
    .from(member)
    .where(eq(member.organizationId, organizationId));
  const [teamsUsed] = await db
    .select({ value: count() })
    .from(team)
    .where(eq(team.organizationId, organizationId));

  return Response.json({
    planId,
    limits,
    usage: {
      seats: Number(seatsUsed?.value ?? 0),
      teams: Number(teamsUsed?.value ?? 0),
    },
  });
}
