import { headers } from "next/headers";
import { and, count, eq, ilike } from "drizzle-orm";

import { db } from "@/db";
import { member, organization, user as userTable } from "@/db/auth-schema";
import { logAdminAction } from "@/lib/admin";
import { auth } from "@/lib/auth";

/**
 * Self-service account deletion. The user's owned workspaces go with the
 * account (members, teams, invitations, and billing rows all cascade from
 * the organization), then the user row cascades their sessions, accounts,
 * memberships, and invitations. This bypasses better-auth's organization
 * hooks on purpose — the user asked for it, including the Default
 * Workspace, which the normal org-delete path protects.
 */
export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const userId = session.user.id;

  // An impersonating admin must not delete the impersonated user's account
  // from here; the admin panel has its own audited delete-user flow.
  if ((session.session as { impersonatedBy?: string | null }).impersonatedBy) {
    return Response.json(
      { error: "You are impersonating another user. Stop impersonating first." },
      { status: 403 }
    );
  }

  // Never leave a deployment without a platform admin.
  if (session.user.role === "admin") {
    const [row] = await db
      .select({ value: count() })
      .from(userTable)
      .where(eq(userTable.role, "admin"));
    if (Number(row?.value ?? 0) <= 1) {
      return Response.json(
        {
          error:
            "You are the only platform admin. Promote another admin in the admin panel before deleting your account.",
        },
        { status: 400 }
      );
    }
  }

  try {
    // Workspaces this user owns (role is a comma-separated list; every org
    // has exactly one owner). Deleting each cascades everything under it.
    const owned = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(
        and(eq(member.userId, userId), ilike(member.role, "%owner%"))
      );
    for (const row of owned) {
      await db
        .delete(organization)
        .where(eq(organization.id, row.organizationId));
    }

    // Audit before the delete: the actor row is about to be gone.
    await logAdminAction({
      actorUserId: userId,
      actorEmail: session.user.email,
      action: "delete-user",
      targetUserId: userId,
      targetEmail: session.user.email,
      reason: "self-service account deletion",
    });

    // Cascades: session, account, twoFactor, member, invitation, teamMember.
    await db.delete(userTable).where(eq(userTable.id, userId));
  } catch (e) {
    console.error("Account deletion failed:", e);
    return Response.json(
      { error: "Account deletion failed. Try again or contact support." },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}
