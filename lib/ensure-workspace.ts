import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";

import { db } from "@/db";
import { member } from "@/db/auth-schema";
import { auth } from "@/lib/auth";

/**
 * Google sign-ins never run the signup form's client-side workspace
 * creation, so a Google-first (or pre-existing org-less) account would land
 * with no workspace and no owner role. Called from the app layout: the
 * first visit heals the account by creating their personal workspace via
 * the organization plugin (owner membership + default team + active org),
 * then reloads once so the tree renders with the new workspace.
 */
export async function ensurePersonalWorkspace(): Promise<void> {
  const reqHeaders = await headers();
  const session = await auth.api
    .getSession({ headers: reqHeaders })
    .catch(() => null);
  if (!session?.user) return;

  const [row] = await db
    .select({ value: count() })
    .from(member)
    .where(eq(member.userId, session.user.id));
  if (Number(row?.value ?? 0) > 0) return;

  const displayName =
    session.user.name?.trim() ||
    session.user.email.split("@")[0] ||
    "My";
  const slugBase = (
    session.user.email.split("@")[0] ?? "workspace"
  )
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const slug = `${slugBase || "workspace"}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  const created = await auth.api
    .createOrganization({
      body: { name: `${displayName}'s Workspace`, slug },
      headers: reqHeaders,
    })
    .catch((e) => {
      console.error("ensurePersonalWorkspace failed:", e);
      return null;
    });
  // The plugin set the new org active on the session; one reload lets the
  // whole tree (sidebar, guards, children) render with it.
  if (created) redirect("/app");
}
