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

async function postAction(
  path: "/ban" | "/unban" | "/role",
  body: Record<string, string>
): Promise<string | null> {
  const res = await fetch(`/api/admin/users${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) return null;
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? "Action failed.";
  } catch {
    return "Action failed.";
  }
}

export function UserRowActions({
  userId,
  userName,
  userEmail,
  role,
  banned,
  isSelf,
}: {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  banned: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banOpen, setBanOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function handleRole(nextRole: string) {
    setError(null);
    setPending(true);
    const message = await postAction("/role", { userId, role: nextRole });
    setPending(false);
    if (message) {
      setError(message);
      return;
    }
    router.refresh();
  }

  async function handleUnban() {
    setError(null);
    setPending(true);
    const message = await postAction("/unban", { userId });
    setPending(false);
    if (message) {
      setError(message);
      return;
    }
    router.refresh();
  }

  async function handleBanConfirm() {
    if (!reason.trim()) return;
    setError(null);
    setPending(true);
    const message = await postAction("/ban", {
      userId,
      reason: reason.trim(),
    });
    setPending(false);
    if (message) {
      setError(message);
      return;
    }
    setBanOpen(false);
    setReason("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <select
          value={role}
          disabled={pending || isSelf}
          title={isSelf ? "You cannot change your own role." : undefined}
          onChange={(e) => handleRole(e.target.value)}
          className="h-9 rounded-lg border border-zinc-200 bg-transparent px-2 text-sm outline-none disabled:opacity-60 dark:border-white/15"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        {banned ? (
          <button
            type="button"
            disabled={pending}
            onClick={handleUnban}
            className="flex h-9 items-center rounded-lg border border-emerald-500/30 px-3 text-sm text-emerald-700 transition-colors hover:bg-emerald-500/10 disabled:opacity-60 dark:text-emerald-400"
          >
            Unban
          </button>
        ) : (
          <button
            type="button"
            disabled={pending || isSelf}
            title={isSelf ? "You cannot ban yourself." : undefined}
            onClick={() => setBanOpen(true)}
            className="flex h-9 items-center rounded-lg border border-red-500/30 px-3 text-sm text-red-700 transition-colors hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
          >
            Ban
          </button>
        )}
      </div>
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <AlertDialog open={banOpen} onOpenChange={setBanOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban {userName}?</AlertDialogTitle>
            <AlertDialogDescription>
              {userEmail} will be signed out immediately and will no longer be
              able to sign in. This action is recorded in the admin audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Reason (required)
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Spamming other workspaces"
              className="h-10 rounded-xl border border-zinc-200 bg-transparent px-3 text-sm font-normal outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white"
            />
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending || !reason.trim()}
              onClick={(e) => {
                e.preventDefault();
                handleBanConfirm();
              }}
            >
              {pending ? "Banning…" : "Confirm ban"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
