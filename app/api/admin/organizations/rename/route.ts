import { eq } from "drizzle-orm";

import { db } from "@/db";
import { organization } from "@/db/auth-schema";
import {
  getRequestAdmin,
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
  let body: { organizationId?: unknown; name?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { organizationId, name } = body;
  if (typeof organizationId !== "string" || !organizationId) {
    return Response.json({ error: "Organization is required." }, { status: 400 });
  }
  if (typeof name !== "string" || !name.trim()) {
    return Response.json({ error: "Name is required." }, { status: 400 });
  }
  const [target] = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);
  if (!target) {
    return Response.json({ error: "Organization not found." }, { status: 404 });
  }
  try {
    await db
      .update(organization)
      .set({ name: name.trim() })
      .where(eq(organization.id, target.id));
    await logAdminAction({
      actorUserId: adminUser.id,
      actorEmail: adminUser.email,
      action: "org-rename",
      targetUserId: target.id,
      targetEmail: `${target.name} (${target.slug})`,
      reason: `Renamed to "${name.trim()}"`,
    });
  } catch (e) {
    return Response.json({ error: errorMessage(e) }, { status: 400 });
  }
  return Response.json({ ok: true });
}
