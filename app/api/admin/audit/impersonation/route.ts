import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user as userTable } from "@/db/auth-schema";
import { logAdminAction } from "@/lib/admin";

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Action failed.";
}

/**
 * Records the impersonation that just started. The client calls this right
 * after authClient.admin.impersonateUser succeeds — at that point the caller's
 * session IS the impersonated session, carrying impersonatedBy = admin id, so
 * the real actor is resolved from the database instead of the session.
 */
export async function POST() {
  const reqHeaders = await headers();
  const current = await auth.api.getSession({ headers: reqHeaders });
  const impersonatedBy = (
    current?.session as { impersonatedBy?: string | null } | undefined
  )?.impersonatedBy;
  if (!current?.user || !impersonatedBy) {
    return Response.json(
      { error: "No active impersonation to record." },
      { status: 400 }
    );
  }
  const [actor] = await db
    .select({ id: userTable.id, email: userTable.email, role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, impersonatedBy))
    .limit(1);
  if (!actor || actor.role !== "admin") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }
  try {
    await logAdminAction({
      actorUserId: actor.id,
      actorEmail: actor.email,
      action: "impersonate",
      targetUserId: current.user.id,
      targetEmail: current.user.email,
      reason: "Impersonation session started",
    });
  } catch (e) {
    return Response.json({ error: errorMessage(e) }, { status: 400 });
  }
  return Response.json({ ok: true });
}
