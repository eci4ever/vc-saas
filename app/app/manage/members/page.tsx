"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

import { useOrgData, type FullMember } from "../use-org";
import { usePlanLimits, usageLine } from "../use-limits";

const inputClass =
  "h-11 rounded-xl border border-zinc-200 bg-transparent px-3 text-sm font-normal outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white";

export default function ManageMembersPage() {
  const router = useRouter();
  const { activeOrg, loading, members, teams, myRole, iAmOwner, refresh } =
    useOrgData();
  const { data: session } = authClient.useSession();
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [invitePending, setInvitePending] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<FullMember | null>(null);
  const [removePending, setRemovePending] = useState(false);

  // Bumped after membership changes so the seat badge tracks reality.
  const [limitsToken, setLimitsToken] = useState(0);
  const limits = usePlanLimits(activeOrg?.id, limitsToken);

  const myUserId = session?.user?.id ?? null;
  const ownerCount = members.filter((m) =>
    m.role.split(",").includes("owner")
  ).length;

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeOrg?.id) return;
    setInviteError(null);
    setInviteMsg(null);
    setInvitePending(true);
    const form = new FormData(e.currentTarget);
    const formEl = e.currentTarget;
    const teamId = String(form.get("team") || "");
    const { error } = await authClient.organization.inviteMember({
      email: String(form.get("email")),
      role: String(form.get("role")) as "member" | "admin",
      organizationId: activeOrg.id,
      ...(teamId ? { teamId } : {}),
    });
    setInvitePending(false);
    if (error) {
      setInviteError(error.message ?? "Failed to send invitation.");
      return;
    }
    formEl.reset();
    setInviteMsg(
      teamId
        ? "Invitation sent — they will join the selected team on accept."
        : "Invitation sent by email."
    );
    setLimitsToken((n) => n + 1);
    router.refresh();
  }

  async function handleRole(member: FullMember, role: string) {
    if (!activeOrg?.id) return;
    setRowError(null);
    const { error } = await authClient.organization.updateMemberRole({
      memberId: member.id,
      role,
      organizationId: activeOrg.id,
    });
    if (error) {
      setRowError(error.message ?? "Failed to update role.");
      return;
    }
    refresh();
    router.refresh();
  }

  async function handleRemoveConfirm() {
    if (!removing || !activeOrg?.id) return;
    setRowError(null);
    setRemovePending(true);
    const { error } = await authClient.organization.removeMember({
      memberIdOrEmail: removing.id,
      organizationId: activeOrg.id,
    });
    setRemovePending(false);
    if (error) {
      setRemoving(null);
      setRowError(error.message ?? "Failed to remove member.");
      return;
    }
    setRemoving(null);
    refresh();
    setLimitsToken((n) => n + 1);
    router.refresh();
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
              <label className="flex flex-col gap-1 text-sm font-medium sm:w-44">
                Team (optional)
                <select name="team" defaultValue="" className={inputClass}>
                  <option value="">No team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
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

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {loading
              ? "Loading members…"
              : `${members.length} member${members.length === 1 ? "" : "s"} in ${activeOrg.name}.`}
            {usageLine(limits, "seats")
              ? ` ${usageLine(limits, "seats")}`
              : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {rowError ? (
            <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {rowError}
            </p>
          ) : null}
          {members.map((member) => {
            const roles = member.role.split(",").map((r) => r.trim());
            const isSelf = member.userId === myUserId;
            const isLastOwnerRow =
              roles.includes("owner") && ownerCount <= 1;
            const roleLocked = isSelf || isLastOwnerRow;
            return (
              <div
                key={member.id}
                className="flex flex-col gap-2 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center"
              >
                <div className="grid flex-1 leading-tight">
                  <span className="truncate font-medium">
                    {member.user?.name ?? member.userId}
                    {isSelf ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (you)
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {member.user?.email ?? ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={roles[0] ?? "member"}
                    disabled={roleLocked}
                    title={
                      isSelf
                        ? "You cannot change your own role."
                        : isLastOwnerRow
                          ? "The last owner cannot be demoted."
                          : undefined
                    }
                    onChange={(e) => handleRole(member, e.target.value)}
                    className="h-9 rounded-lg border border-zinc-200 bg-transparent px-2 text-sm outline-none disabled:opacity-60 dark:border-white/15"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    {iAmOwner ? <option value="owner">Owner</option> : null}
                  </select>
                  {!isSelf ? (
                    <button
                      type="button"
                      disabled={isLastOwnerRow}
                      title={
                        isLastOwnerRow
                          ? "The last owner cannot be removed."
                          : undefined
                      }
                      onClick={() => setRemoving(member)}
                      className="flex h-9 items-center rounded-lg border border-red-500/30 px-3 text-sm text-red-700 transition-colors hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
          {!loading && myRole ? (
            <p className="text-xs text-muted-foreground">
              Your role: <span className="capitalize">{myRole}</span>. Only owners
              can assign the owner role.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {removing?.user?.name ?? "this member"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They lose access to {activeOrg?.name ?? "this workspace"}{" "}
              immediately. Any pending invitations and team assignments go with
              them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removePending}>Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={removePending}
              onClick={(e) => {
                e.preventDefault();
                handleRemoveConfirm();
              }}
              className="text-red-600 dark:text-red-400"
            >
              {removePending ? "Removing…" : "Remove member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
