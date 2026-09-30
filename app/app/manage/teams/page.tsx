"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

type RosterMember = { id: string; userId: string; name: string; email: string };

type ApiTeam = {
  id: string;
  name: string;
  members: RosterMember[];
};

export default function ManageTeamsPage() {
  const router = useRouter();
  const { activeOrg, loading, members, refresh } = useOrgData();
  const [apiTeams, setApiTeams] = useState<ApiTeam[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ApiTeam | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ApiTeam | null>(null);

  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const orgId = activeOrg?.id;
    async function load() {
      if (!orgId) {
        setApiTeams([]);
        return;
      }
      const res = await fetch(`/api/manage/teams?organizationId=${orgId}`, {
        cache: "no-store",
      });
      if (cancelled || !res.ok) return;
      const data = (await res.json()) as { teams: ApiTeam[] };
      setApiTeams(data.teams ?? []);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [activeOrg?.id, reloadToken]);

  const loadTeams = useCallback(() => setReloadToken((t) => t + 1), []);

  // reloadToken doubles as the limits refresh: every successful team action
  // bumps it, so the usage line tracks the roster.
  const limits = usePlanLimits(activeOrg?.id, reloadToken);

  function note(nextMsg: string | null, nextError: string | null = null) {
    setMsg(nextMsg);
    setError(nextError);
  }

  async function run(
    fn: () => Promise<{ error?: { message?: string } | null }>,
    done: string
  ) {
    setError(null);
    setMsg(null);
    setPending(true);
    const { error: e } = await fn();
    setPending(false);
    if (e) {
      setError(e.message ?? "Action failed.");
      return;
    }
    note(done);
    await loadTeams();
    refresh();
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name")).trim();
    if (!name || !activeOrg?.id) return;
    const formEl = e.currentTarget;
    await run(
      () =>
        authClient.$fetch("/organization/create-team", {
          method: "POST",
          body: { name, organizationId: activeOrg.id },
        }),
      `Team "${name}" created.`
    );
    formEl.reset();
  }

  async function handleRenameConfirm() {
    if (!renameTarget || !renameName.trim()) return;
    const target = renameTarget;
    setRenameTarget(null);
    await run(
      () =>
        authClient.$fetch("/organization/update-team", {
          method: "POST",
          body: { teamId: target.id, data: { name: renameName.trim() } },
        }),
      "Team renamed."
    );
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    await run(
      () =>
        authClient.$fetch("/organization/remove-team", {
          method: "POST",
          body: { teamId: target.id },
        }),
      "Team deleted."
    );
  }

  async function handleAddMember(teamId: string, userId: string) {
    if (!userId) return;
    await run(
      () =>
        authClient.$fetch("/organization/add-team-member", {
          method: "POST",
          body: { teamId, userId },
        }),
      "Member added to team."
    );
  }

  async function handleRemoveMember(teamId: string, memberId: string) {
    await run(
      () =>
        authClient.$fetch("/organization/remove-team-member", {
          method: "POST",
          body: { teamId, memberId },
        }),
      "Member removed from team."
    );
  }

  if (!activeOrg) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            No active workspace. Create one to manage teams.
          </p>
        </CardContent>
      </Card>
    );
  }

  const addableMembers: FullMember[] = members;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Create team</CardTitle>
          <CardDescription>
            Teams group members inside {activeOrg.name}.
            {usageLine(limits, "teams") ? ` ${usageLine(limits, "teams")}` : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2" onSubmit={handleCreate}>
            <input
              name="name"
              required
              placeholder="Team name"
              className={`${inputClass} flex-1`}
            />
            <button
              type="submit"
              disabled={pending}
              className="flex h-11 items-center rounded-full bg-zinc-950 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Create
            </button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
      {msg ? (
        <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          {msg}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>
            {loading ? "Loading teams…" : `${apiTeams.length} team${apiTeams.length === 1 ? "" : "s"}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!loading && apiTeams.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No teams yet. Create one above, or invite people straight into a team.
            </p>
          ) : null}
          {apiTeams.map((team) => {
            const memberIds = new Set(team.members.map((m) => m.userId));
            const candidates = addableMembers.filter((m) => !memberIds.has(m.userId));
            return (
              <div key={team.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="grid leading-tight">
                    <span className="font-medium">{team.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {team.members.length} member{team.members.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRenameTarget(team);
                        setRenameName(team.name);
                      }}
                      className="flex h-9 items-center rounded-lg border border-zinc-200 px-3 text-sm transition-colors hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-white/10"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(team)}
                      className="flex h-9 items-center rounded-lg border border-red-500/30 px-3 text-sm text-red-700 transition-colors hover:bg-red-500/10 dark:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  {team.members.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No members in this team yet.</p>
                  ) : (
                    team.members.map((teamMember) => (
                      <div
                        key={teamMember.id}
                        className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm"
                      >
                        <span className="flex-1 truncate">
                          {teamMember.name}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {teamMember.email}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(team.id, teamMember.id)}
                          className="flex h-8 items-center rounded-lg border border-red-500/30 px-2 text-xs text-red-700 transition-colors hover:bg-red-500/10 dark:text-red-400"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                  {candidates.length > 0 ? (
                    <select
                      value=""
                      onChange={(e) => handleAddMember(team.id, e.target.value)}
                      className="h-9 rounded-lg border border-zinc-200 bg-transparent px-2 text-sm outline-none dark:border-white/15"
                    >
                      <option value="">Add member…</option>
                      {candidates.map((candidate) => (
                        <option key={candidate.id} value={candidate.userId}>
                          {candidate.user?.name ?? candidate.user?.email ?? candidate.userId}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <AlertDialog
        open={renameTarget !== null}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename team</AlertDialogTitle>
          </AlertDialogHeader>
          <input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            className={inputClass}
            placeholder="Team name"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={!renameName.trim()} onClick={handleRenameConfirm}>
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Members stay in {activeOrg.name} but lose this team membership.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep team</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete team</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
