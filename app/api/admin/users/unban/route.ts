import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
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
  let body: { userId?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { userId } = body;
  if (typeof userId !== "string" || !userId) {
    return Response.json({ error: "User is required." }, { status: 400 });
  }
  const target = await getTargetUser(userId);
  if (!target) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }
  try {
    await auth.api.unbanUser({
      body: { userId },
      headers: await headers(),
    });
    await logAdminAction({
      actorUserId: adminUser.id,
      actorEmail: adminUser.email,
      action: "unban",
      targetUserId: target.id,
      targetEmail: target.email,
    });
  } catch (e) {
    return Response.json({ error: errorMessage(e) }, { status: 400 });
  }
  return Response.json({ ok: true });
}
