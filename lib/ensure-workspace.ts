import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { member, organization } from "@/db/auth-schema";
import { auth } from "@/lib/auth";
import {
  DEFAULT_WORKSPACE_NAME,
  isDefaultMetadata,
} from "@/lib/workspace";

/**
 * Two healing jobs, run from the app layout on every navigation:
 *
 * 1. Zero memberships (fresh signup — the signup form no longer creates a
 *    workspace, and Google sign-ins never did) → create their "Default
 *    Workspace" (flagged via metadata, owner membership, default team) and
 *    activate it.
 * 2. Memberships exist but the session's active organization is missing or
 *    stale (they deleted their active workspace) → activate their default
 *    workspace instead of showing an org-less shell.
 *
 * No redirect afterwards: redirect() inside a layout loops the client
 * router when the navigation came from client-side code (the signup form).
 * Everything downstream re-reads the session — server components in the
 * same render and the sidebar's client hooks both see the corrected state.
 */
export async function ensurePersonalWorkspace(): Promise<void> {
  const reqHeaders = await headers();
  const session = await auth.api
    .getSession({ headers: reqHeaders })
    .catch(() => null);
  if (!session?.user) return;
  const userId = session.user.id;

  const memberships = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId));

  const activeId = session.session.activeOrganizationId ?? null;
  const activeStillExists =
    activeId !== null &&
    memberships.some((m) => m.organizationId === activeId);

  if (memberships.length === 0) {
    const created = await auth.api
      .createOrganization({
        body: {
          name: DEFAULT_WORKSPACE_NAME,
          // Globally unique; anchored to the user so reruns after a deleted
          // default never collide with another user's slug.
          slug: `default-${userId.slice(0, 8).toLowerCase()}-${Math.random()
            .toString(36)
            .slice(2, 6)}`,
          metadata: { isDefault: true },
        },
        headers: reqHeaders,
      })
      .catch((e) => {
        console.error("Failed to create default workspace:", e);
        return null;
      });
    if (created) return;
  }

  if (!activeStillExists) {
    // Prefer their flagged default workspace; fall back to the first
    // membership (accounts that predate the flag).
    const orgs = await db
      .select({ id: organization.id, metadata: organization.metadata })
      .from(organization)
      .innerJoin(member, eq(member.organizationId, organization.id))
      .where(eq(member.userId, userId));
    const fallback =
      orgs.find((o) => isDefaultMetadata(o.metadata)) ?? orgs[0] ?? null;
    if (fallback && fallback.id !== activeId) {
      await auth.api
        .setActiveOrganization({
          body: { organizationId: fallback.id },
          headers: reqHeaders,
        })
        .catch((e) => {
          console.error("Failed to reactivate default workspace:", e);
        });
    }
  }
}

