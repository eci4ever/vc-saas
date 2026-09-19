"use client";

import { useEffect, useState } from "react";

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

type TeamRow = { id: string; name: string };

export default function WorkspaceSettingsPage() {
  const { data: activeOrg } = authClient.useActiveOrganization();
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!activeOrg?.id) return;
    authClient.organization
      .getFullOrganization({ query: { organizationId: activeOrg.id } })
      .then(({ data }) => {
        const teams = (data as { teams?: TeamRow[] } | null)?.teams;
        if (Array.isArray(teams)) setTeams(teams);
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
    </div>
  );
}
