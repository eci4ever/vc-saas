"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

const inputClass =
  "h-11 rounded-xl border border-zinc-200 bg-transparent px-3 text-sm font-normal outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white";

type MemberRow = {
  id: string;
  role: string;
  userId: string;
  user?: { name: string; email: string } | null;
};

const MANAGER_ROLES = ["owner", "admin"];

export default function MembersSettingsPage() {
  const { data: activeOrg } = authClient.useActiveOrganization();
  const orgId = activeOrg?.id;
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [invitePending, setInvitePending] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const [{ data: memberList }, { data: activeMember }] = await Promise.all([
      authClient.organization.listMembers({ query: { organizationId: orgId } }),
      authClient.organization.getActiveMember(),
    ]);
    if (memberList) setMembers(memberList.members as MemberRow[]);
    setMyRole(activeMember?.role ?? null);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    // Fetch members when the active workspace changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const canManage = myRole != null && MANAGER_ROLES.includes(myRole);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orgId) return;
    setInviteError(null);
    setInviteMsg(null);
    setInvitePending(true);
    const form = new FormData(e.currentTarget);
    const formEl = e.currentTarget;
    const { error } = await authClient.organization.inviteMember({
      email: String(form.get("email")),
      role: String(form.get("role")) as "member" | "admin",
      organizationId: orgId,
    });
    setInvitePending(false);
    if (error) {
      setInviteError(error.message ?? "Failed to send invitation.");
      return;
    }
    formEl.reset();
    setInviteMsg("Invitation sent by email.");
  }

  async function handleRole(memberId: string, role: string) {
    if (!orgId) return;
    setRowError(null);
    const { error } = await authClient.organization.updateMemberRole({
      memberId,
      role,
      organizationId: orgId,
    });
    if (error) {
      setRowError(error.message ?? "Failed to update role.");
      return;
    }
    refresh();
  }

  async function handleRemove(memberId: string) {
    if (!orgId) return;
    setRowError(null);
    const { error } = await authClient.organization.removeMember({
      memberIdOrEmail: memberId,
      organizationId: orgId,
    });
    if (error) {
      setRowError(error.message ?? "Failed to remove member.");
      return;
    }
    refresh();
  }

  if (!activeOrg) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            No active workspace. Create one to manage members.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Invite member</CardTitle>
            <CardDescription>
              They will receive an email invitation to join {activeOrg.name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleInvite}>
              {inviteError ? (
                <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {inviteError}
                </p>
              ) : null}
              {inviteMsg ? (
                <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                  {inviteMsg}
                </p>
              ) : null}
              <div className="flex flex-col gap-4 sm:flex-row">
                <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
                  Email
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="teammate@company.com"
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium sm:w-32">
                  Role
                  <select name="role" defaultValue="member" className={inputClass}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
              </div>
              <button
                type="submit"
                disabled={invitePending}
                className="flex h-11 items-center justify-center rounded-full bg-zinc-950 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {invitePending ? "Sending…" : "Send invitation"}
              </button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {loading
              ? "Loading members…"
              : `${members.length} member${members.length === 1 ? "" : "s"} in ${activeOrg.name}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {rowError ? (
            <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {rowError}
            </p>
          ) : null}
          {!canManage && !loading ? (
            <p className="text-sm text-muted-foreground">
              Only owners and admins can manage members.
            </p>
          ) : null}
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-2 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center"
            >
              <div className="grid flex-1 leading-tight">
                <span className="truncate font-medium">
                  {member.user?.name ?? member.userId}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {member.user?.email ?? ""}
                </span>
              </div>
              {canManage ? (
                <div className="flex items-center gap-2">
                  <select
                    value={member.role}
                    onChange={(e) => handleRole(member.id, e.target.value)}
                    className="h-9 rounded-lg border border-zinc-200 bg-transparent px-2 text-sm outline-none dark:border-white/15"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemove(member.id)}
                    className="flex h-9 items-center rounded-lg border border-red-500/30 px-3 text-sm text-red-700 transition-colors hover:bg-red-500/10 dark:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <span className="text-xs capitalize text-muted-foreground">
                  {member.role}
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
