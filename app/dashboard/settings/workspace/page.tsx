"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
import { isOrgOwner } from "@/lib/access";
import { authClient } from "@/lib/auth-client";

const inputClass =
  "h-11 rounded-xl border border-zinc-200 bg-transparent px-3 text-sm font-normal outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white";

type TeamRow = { id: string; name: string };

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const { data: activeMember } = authClient.useActiveMember();
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  useEffect(() => {
    if (!activeOrg?.id) return;
    authClient.organization
      .getFullOrganization({ query: { organizationId: activeOrg.id } })
      .then(({ data }) => {
        const orgTeams = (data as { teams?: TeamRow[] } | null)?.teams;
        if (Array.isArray(orgTeams)) setTeams(orgTeams);
      });
  }, [activeOrg?.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeOrg?.id) return;
    setError(null);
    setMsg(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const { error } = await authClient.organization.update({
      organizationId: activeOrg.id,
      data: {
        name: String(form.get("name")),
        slug: String(form.get("slug")),
      },
    });
    setPending(false);
    if (error) {
      setError(error.message ?? "Failed to update workspace.");
      return;
    }
    setMsg("Workspace updated.");
    router.refresh();
  }

  async function handleDeleteOrg() {
    if (!activeOrg?.id) return;
    setDeletePending(true);
    const { error } = await authClient.organization.delete({
      organizationId: activeOrg.id,
    });
    setDeletePending(false);
    if (error) {
      setError(error.message ?? "Failed to delete workspace.");
      setDeleteOpen(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (!activeOrg) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            No active workspace. Create one to manage settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  const owner = isOrgOwner(
    (activeMember as { role?: string | null } | undefined)?.role ?? null
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>
            Settings for {activeOrg.name}. Slug must be unique.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
            <label className="flex flex-col gap-1 text-sm font-medium">
              Name
              <input
                name="name"
                required
                defaultValue={activeOrg.name}
                key={activeOrg.id + activeOrg.name}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Slug
              <input
                name="slug"
                required
                defaultValue={activeOrg.slug}
                key={activeOrg.id + activeOrg.slug}
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="flex h-11 items-center justify-center rounded-full bg-zinc-950 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>Teams inside this workspace.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {teams.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teams yet.</p>
          ) : (
            teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span className="font-medium">{team.name}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {owner ? (
        <Card className="border-red-500/30 dark:border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400">Danger zone</CardTitle>
            <CardDescription>
              Deleting this workspace removes its members, teams, and invitations
              for everyone. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="flex h-11 items-center rounded-full border border-red-500/40 px-5 text-sm font-medium text-red-700 transition-colors hover:bg-red-500/10 dark:text-red-400"
            >
              Delete workspace
            </button>
          </CardContent>
        </Card>
      ) : null}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{activeOrg.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Every member, team, and pending invitation in this workspace will
              be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Keep workspace</AlertDialogCancel>
            <AlertDialogAction disabled={deletePending} onClick={handleDeleteOrg}>
              {deletePending ? "Deleting…" : "Delete forever"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
