"use client";

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
import { PageHeader } from "@/components/page-header";

import { useOrgData } from "../use-org";

function roleLabel(invitation: { role: string | null; teamId?: string | null }) {
  const parts = [invitation.role ?? "member"];
  if (invitation.teamId) parts.push("team invite");
  return parts.join(" · ");
}

export default function ManageInvitationsPage() {
  const { activeOrg, loading, invitations, refresh } = useOrgData();
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  async function handleCancel() {
    if (!cancelTarget) return;
    setError(null);
    setMsg(null);
    setPendingId(cancelTarget);
    const { error: cancelError } = await authClient.organization.cancelInvitation({
      invitationId: cancelTarget,
    });
    setPendingId(null);
    setCancelTarget(null);
    if (cancelError) {
      setError(cancelError.message ?? "Failed to cancel invitation.");
      return;
    }
    setMsg("Invitation cancelled.");
    refresh();
  }

  if (!activeOrg) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            No active workspace. Create one to manage invitations.
          </p>
        </CardContent>
      </Card>
    );
  }

  const pending = invitations.filter(
    (invitation) =>
      invitation.status === "pending" &&
      // eslint-disable-next-line react-hooks/purity
      new Date(invitation.expiresAt).getTime() > Date.now()
  );

  return (
    <>
      <PageHeader title="Invitations" />
      <Card>
      <CardHeader>
        <CardTitle>Invitations</CardTitle>
        <CardDescription>
          {loading
            ? "Loading invitations…"
            : `${pending.length} pending invitation${pending.length === 1 ? "" : "s"}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
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
        {!loading && pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending invitations. Invite someone from the Members tab.
          </p>
        ) : null}
        {pending.map((invitation) => (
          <div
            key={invitation.id}
            className="flex flex-col gap-2 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center"
          >
            <div className="grid flex-1 leading-tight">
              <span className="truncate font-medium">{invitation.email}</span>
              <span className="truncate text-xs capitalize text-muted-foreground">
                {roleLabel(invitation)} · expires{" "}
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                title="Copy invite link"
                onClick={() => {
                  const url = `${window.location.origin}/accept-invitation/${invitation.id}`;
                  navigator.clipboard?.writeText(url);
                  setMsg(`Invite link copied for ${invitation.email}.`);
                }}
                className="flex h-9 items-center rounded-lg border border-zinc-200 px-3 text-sm transition-colors hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-white/10"
              >
                Copy link
              </button>
              <button
                type="button"
                disabled={pendingId === invitation.id}
                onClick={() => setCancelTarget(invitation.id)}
                className="flex h-9 items-center rounded-lg border border-red-500/30 px-3 text-sm text-red-700 transition-colors hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
              >
                {pendingId === invitation.id ? "Cancelling…" : "Cancel"}
              </button>
            </div>
          </div>
        ))}

        <AlertDialog
          open={cancelTarget !== null}
          onOpenChange={(open) => !open && setCancelTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this invitation?</AlertDialogTitle>
              <AlertDialogDescription>
                The link will stop working and the person will not be able to
                join {activeOrg.name}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel}>
                Cancel invitation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
    </>
  );
}
