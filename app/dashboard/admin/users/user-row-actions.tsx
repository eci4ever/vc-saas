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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";

async function postAction(
  path: "/ban" | "/unban" | "/role" | "/sessions" | "/password" | "/delete",
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

/** Ask the server to record the impersonation that just started. */
async function auditImpersonation(): Promise<void> {
  await fetch("/api/admin/audit/impersonation", { method: "POST" }).catch(() => {});
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
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function run(action: () => Promise<string | null>, after?: () => void) {
    setError(null);
    setPending(true);
    const message = await action();
    setPending(false);
    if (message) {
      setError(message);
      return;
    }
    after?.();
    router.refresh();
  }

  async function handleRole(nextRole: string) {
    await run(() => postAction("/role", { userId, role: nextRole }));
  }

  async function handleUnban() {
    await run(() => postAction("/unban", { userId }));
  }

  async function handleRevokeSessions() {
    await run(() => postAction("/sessions", { userId }));
  }

  async function handleSetPassword() {
    await run(
      () => postAction("/password", { userId, newPassword }),
      () => {
        setPasswordOpen(false);
        setNewPassword("");
      }
    );
  }

  async function handleDeleteConfirm() {
    await run(
      () => postAction("/delete", { userId }),
      () => setDeleteOpen(false)
    );
  }

  async function handleImpersonate() {
    setError(null);
    setPending(true);
    const { error: impersonateError } = await authClient.admin.impersonateUser({
      userId,
    });
    if (impersonateError) {
      setPending(false);
      setError(impersonateError.message ?? "Failed to impersonate.");
      return;
    }
    await auditImpersonation();
    setPending(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <select
          value={role}
          disabled={pending || isSelf}
          title={isSelf ? "You cannot change your own role." : undefined}
          onChange={(e) => void handleRole(e.target.value)}
          className="h-9 rounded-lg border border-zinc-200 bg-transparent px-2 text-sm outline-none disabled:opacity-60 dark:border-white/15"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        {banned ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => void handleUnban()}
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
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                disabled={pending}
                title="More actions"
                className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-white/15 dark:text-zinc-400 dark:hover:bg-white/10"
              />
            }
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4}>
            <DropdownMenuItem onClick={() => void handleImpersonate()} disabled={pending}>
              Impersonate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPasswordOpen(true)} disabled={pending}>
              Set password
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => void handleRevokeSessions()}
              disabled={pending}
            >
              Revoke sessions
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              disabled={pending || isSelf}
              className="text-red-600 dark:text-red-400"
            >
              Delete user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                run(
                  () => postAction("/ban", { userId, reason: reason.trim() }),
                  () => {
                    setBanOpen(false);
                    setReason("");
                  }
                );
              }}
            >
              {pending ? "Banning…" : "Confirm ban"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set a new password</AlertDialogTitle>
            <AlertDialogDescription>
              {userEmail} will sign in with this password. Their existing
              sessions stay valid until they are revoked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex flex-col gap-1 text-sm font-medium">
            New password
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              placeholder="At least 8 characters"
              className="h-10 rounded-xl border border-zinc-200 bg-transparent px-3 text-sm font-normal outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white"
            />
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending || newPassword.length < 8}
              onClick={(e) => {
                e.preventDefault();
                handleSetPassword();
              }}
            >
              {pending ? "Saving…" : "Set password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {userName}?</AlertDialogTitle>
            <AlertDialogDescription>
              {userEmail} will be removed along with every membership, session,
              and invitation tied to their account. This action is recorded in
              the admin audit log and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
            >
              {pending ? "Deleting…" : "Delete forever"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
