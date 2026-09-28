import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
  isOrgManager,
  isOrgOwner,
  isPlatformAdmin,
  type OrgRole,
} from "@/lib/access";

export type AccessContext = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string | null;
  };
  activeOrganizationId: string | null;
  activeOrganizationName: string | null;
  /** Caller's role in the active organization; null when alone or none. */
  orgRole: string | null;
};

/**
 * Session + active-org membership in one read. Pages use this to decide what
 * to render; guards below turn it into redirects.
 */
export async function getAccessContext(): Promise<AccessContext | null> {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session?.user) return null;

  const orgId = session.session.activeOrganizationId ?? null;
  let orgRole: string | null = null;
  let orgName: string | null = null;

  if (orgId) {
    const fullOrg = await auth.api
      .getFullOrganization({
        headers: reqHeaders,
        query: { organizationId: orgId },
      })
      .catch(() => null);
    if (fullOrg) {
      orgName = fullOrg.name;
      const me = (
        fullOrg as unknown as {
          members?: { userId: string; role: string | null }[];
        }
      ).members?.find((m) => m.userId === session.user.id);
      orgRole = me?.role ?? null;
    }
  }

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: (session.user as { role?: string | null }).role ?? null,
    },
    activeOrganizationId: orgId,
    activeOrganizationName: orgName,
    orgRole,
  };
}

export async function requireUser(): Promise<AccessContext> {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  return ctx;
}

export async function requirePlatformAdmin(): Promise<AccessContext> {
  const ctx = await requireUser();
  if (!isPlatformAdmin(ctx.user.role)) redirect("/app");
  return ctx;
}

export async function requireOrgManager(): Promise<AccessContext> {
  const ctx = await requireUser();
  if (!isOrgManager(ctx.orgRole)) redirect("/app");
  return ctx;
}

export async function requireOrgOwner(): Promise<AccessContext> {
  const ctx = await requireUser();
  if (!isOrgOwner(ctx.orgRole)) redirect("/app");
  return ctx;
}

export type { OrgRole };
