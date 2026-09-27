import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { adminAuditLog } from "@/db/admin-schema";
import { auth } from "@/lib/auth";

/**
 * Throws (redirects) unless the current user is an admin.
 * Returns the admin's user record for convenience.
 */
export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }
  return session.user;
}

export type TargetUser = {
  id: string;
  email: string;
  role: string | null;
};

/** Session admin for API routes (null when unauthorized, no redirects). */
export async function getRequestAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = session?.user;
  if (!user) return null;
  if ((user as { role?: string }).role !== "admin") return null;
  return user;
}

export async function getTargetUser(userId: string): Promise<TargetUser | null> {
  const [row] = await db
    .select({ id: user.id, email: user.email, role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return row ?? null;
}

export async function countAdmins(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(user).where(eq(user.role, "admin"));
  return Number(row?.value ?? 0);
}

/**
 * Throws when the action is not allowed:
 * - nobody may ban/demote themselves
 * - nobody may demote/ban the last remaining admin
 */
export async function assertCanModerate(
  adminId: string,
  target: TargetUser
): Promise<void> {
  if (target.id === adminId) {
    throw new Error("You cannot change your own admin access.");
  }
  if (target.role === "admin") {
    const remaining = await countAdmins();
    if (remaining <= 1) {
      throw new Error("Cannot remove the last admin.");
    }
  }
}

/** For actions that simply never apply to the caller's own account. */
export function assertNotSelf(adminId: string, target: TargetUser): void {
  if (target.id === adminId) {
    throw new Error("You cannot do this to your own account.");
  }
}

export type AdminAction =
  | "ban"
  | "unban"
  | "set-role"
  | "delete-user"
  | "set-password"
  | "revoke-sessions"
  | "impersonate"
  | "org-rename"
  | "org-delete";

export async function logAdminAction(entry: {
  actorUserId: string;
  actorEmail: string;
  action: AdminAction;
  targetUserId: string;
  targetEmail: string;
  oldRole?: string | null;
  newRole?: string | null;
  reason?: string | null;
}): Promise<void> {
  await db.insert(adminAuditLog).values(entry);
}

export async function getRecentAdminActivity(limit = 20) {
  return db
    .select()
    .from(adminAuditLog)
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(limit);
}

type AuditEntry = {
  action: string;
  oldRole?: string | null;
  newRole?: string | null;
};

/** Human sentence fragment between actor and target, e.g. "Ada banned". */
export function describeAdminAction(entry: AuditEntry): string {
  switch (entry.action) {
    case "ban":
      return "banned";
    case "unban":
      return "unbanned";
    case "set-role":
      return `changed role${
        entry.oldRole || entry.newRole
          ? ` (${entry.oldRole ?? "?"} → ${entry.newRole ?? "?"})`
          : ""
      }`;
    case "delete-user":
      return "deleted user";
    case "set-password":
      return "set password for";
    case "revoke-sessions":
      return "revoked sessions of";
    case "impersonate":
      return "started impersonating";
    case "org-rename":
      return "renamed organization";
    case "org-delete":
      return "deleted organization";
    default:
      return entry.action;
  }
}
