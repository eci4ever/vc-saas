"use client";

import { useCallback, useEffect, useState } from "react";

import { parseOrgRoles } from "@/lib/access";
import { authClient } from "@/lib/auth-client";

export type FullMember = {
  id: string;
  role: string;
  userId: string;
  user?: { id?: string; name: string; email: string } | null;
};

export type FullInvitation = {
  id: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: string | Date;
  teamId?: string | null;
  inviter?: { user?: { name?: string; email?: string } } | null;
};

export type FullTeam = {
  id: string;
  name: string;
};

type FullOrg = {
  name: string;
  members?: FullMember[];
  invitations?: FullInvitation[];
  teams?: FullTeam[];
};

/**
 * Active organization + its members/invitations/teams + the viewer's own
 * role, refreshed as one unit after any mutation.
 */
export function useOrgData() {
  const { data: activeOrg, isPending } = authClient.useActiveOrganization();
  const { data: activeMember } = authClient.useActiveMember();
  const [fullOrg, setFullOrg] = useState<FullOrg | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const orgId = activeOrg?.id;
    async function load() {
      setLoading(true);
      if (!orgId) {
        setFullOrg(null);
        setLoading(false);
        return;
      }
      const { data } = await authClient.organization.getFullOrganization({
        query: { organizationId: orgId },
      });
      if (cancelled) return;
      setFullOrg((data as unknown as FullOrg) ?? null);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [activeOrg?.id, reloadToken]);

  const refresh = useCallback(() => setReloadToken((t) => t + 1), []);

  const myRoles = parseOrgRoles(
    (activeMember as { role?: string | null } | undefined)?.role ?? null
  );
  const myRole = myRoles[0] ?? null;
  const iAmOwner = myRoles.includes("owner");

  return {
    activeOrg,
    loading: loading || isPending,
    members: fullOrg?.members ?? [],
    invitations: fullOrg?.invitations ?? [],
    teams: fullOrg?.teams ?? [],
    myRole,
    iAmOwner,
    refresh,
  };
}
