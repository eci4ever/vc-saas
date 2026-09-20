import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  assertCanModerate,
  getRequestAdmin,
  getTargetUser,
  logAdminAction,
} from "@/lib/admin";

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Action failed.";
}

export async function POST(req: Request) {
  const adminUser = await getRequestAdmin();
  if (!adminUser) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }
  let body: { userId?: unknown; role?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { userId, role } = body;
  if (typeof userId !== "string" || !userId) {
    return Response.json({ error: "User is required." }, { status: 400 });
  }
  if (role !== "user" && role !== "admin") {
    return Response.json({ error: "Invalid role." }, { status: 400 });
  }
  const target = await getTargetUser(userId);
  if (!target) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }
  try {
    if (role !== "admin") {
      await assertCanModerate(adminUser.id, target);
    } else if (target.id === adminUser.id) {
      throw new Error("You cannot change your own admin access.");
    }
    await auth.api.setRole({
      body: { userId, role },
      headers: await headers(),
    });
    await logAdminAction({
      actorUserId: adminUser.id,
      actorEmail: adminUser.email,
      action: "set-role",
      targetUserId: target.id,
      targetEmail: target.email,
      oldRole: target.role,
      newRole: role,
    });
  } catch (e) {
    return Response.json({ error: errorMessage(e) }, { status: 400 });
  }
  return Response.json({ ok: true });
}
