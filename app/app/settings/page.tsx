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
import { PageHeader } from "@/components/page-header";
import { isOrgOwner } from "@/lib/access";
import { authClient } from "@/lib/auth-client";
import { isDefaultMetadata } from "@/lib/workspace";

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
        logo: String(form.get("logo")).trim() || null,
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
    router.push("/app");
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
    <>
      <PageHeader title="Settings" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Workspace name, slug, logo, and teams for {activeOrg.name}.
          </p>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>
            The slug must stay unique. Renaming does not break existing links.
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
            <div className="flex items-end gap-3">
              <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
                Logo URL
                <input
                  name="logo"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  defaultValue={activeOrg.logo ?? ""}
                  key={activeOrg.id + (activeOrg.logo ?? "")}
                  className={inputClass}
                />
              </label>
              {activeOrg.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeOrg.logo}
                  alt={`${activeOrg.name} logo`}
                  className="size-11 rounded-xl border border-zinc-200 object-cover dark:border-white/15"
                />
              ) : null}
            </div>
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
        isDefaultMetadata(
          (activeOrg as { metadata?: string | null }).metadata
        ) ? (
          <Card>
            <CardHeader>
              <CardTitle>Default workspace</CardTitle>
              <CardDescription>
                This is your Default Workspace — it stays with your account and
                cannot be deleted. Workspaces you create from the switcher can
                be deleted from their own settings page.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card className="border-red-500/30 dark:border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-400">Danger zone</CardTitle>
              <CardDescription>
                Deleting this workspace removes its members, teams, invitations,
                and billing history for everyone. This cannot be undone. Your
                Default Workspace stays and becomes active again.
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
        )
      ) : null}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{activeOrg.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Every member, team, pending invitation, and billing history in
              this workspace will be removed. This action cannot be undone.
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
    </>
  );
}
