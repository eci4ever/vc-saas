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

const inputClass =
  "h-11 rounded-xl border border-zinc-200 bg-transparent px-3 text-sm font-normal outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leavePending, setLeavePending] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profilePending, setProfilePending] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwPending, setPwPending] = useState(false);

  async function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileError(null);
    setProfileMsg(null);
    setProfilePending(true);
    const form = new FormData(e.currentTarget);
    const { error } = await authClient.updateUser({
      name: String(form.get("name")),
    });
    setProfilePending(false);
    if (error) {
      setProfileError(error.message ?? "Failed to update profile.");
      return;
    }
    setProfileMsg("Profile updated.");
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError(null);
    setPwMsg(null);
    setPwPending(true);
    const form = new FormData(e.currentTarget);
    const formEl = e.currentTarget;
    const newPassword = String(form.get("newPassword"));
    const confirmPassword = String(form.get("confirmPassword"));
    if (newPassword !== confirmPassword) {
      setPwPending(false);
      setPwError("New passwords do not match.");
      return;
    }
    const { error } = await authClient.changePassword({
      currentPassword: String(form.get("currentPassword")),
      newPassword,
      revokeOtherSessions: true,
    });
    setPwPending(false);
    if (error) {
      setPwError(error.message ?? "Failed to change password.");
      return;
    }
    formEl.reset();
    setPwMsg("Password changed. Other sessions were signed out.");
  }

  async function handleLeaveOrg() {
    if (!activeOrg?.id) return;
    setLeavePending(true);
    setLeaveError(null);
    const { error } = await authClient.$fetch("/organization/leave", {
      method: "POST",
      body: { organizationId: activeOrg.id },
    });
    setLeavePending(false);
    if (error) {
      setLeaveError(error.message ?? "Failed to leave the workspace.");
      return;
    }
    setLeaveOpen(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How you appear to your team.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleProfile}>
            {profileError ? (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {profileError}
              </p>
            ) : null}
            {profileMsg ? (
              <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                {profileMsg}
              </p>
            ) : null}
            <label className="flex flex-col gap-1 text-sm font-medium">
              Name
              <input
                name="name"
                required
                defaultValue={name ?? session?.user?.name ?? ""}
                key={session?.user?.name ?? "loading"}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Email
              <input
                value={session?.user?.email ?? ""}
                disabled
                className={`${inputClass} opacity-60`}
              />
            </label>
            <button
              type="submit"
              disabled={profilePending}
              className="flex h-11 items-center justify-center rounded-full bg-zinc-950 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {profilePending ? "Saving…" : "Save changes"}
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your sign-in password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handlePassword}>
            {pwError ? (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {pwError}
              </p>
            ) : null}
            {pwMsg ? (
              <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                {pwMsg}
              </p>
            ) : null}
            <label className="flex flex-col gap-1 text-sm font-medium">
              Current password
              <input
                type="password"
                name="currentPassword"
                required
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              New password
              <input
                type="password"
                name="newPassword"
                required
                minLength={8}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Confirm new password
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={8}
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              disabled={pwPending}
              className="flex h-11 items-center justify-center rounded-full border border-zinc-200 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10"
            >
              {pwPending ? "Changing…" : "Change password"}
            </button>
          </form>
        </CardContent>
      </Card>

      {activeOrg ? (
        <Card>
          <CardHeader>
            <CardTitle>Membership</CardTitle>
            <CardDescription>
              You are currently in {activeOrg.name}. Leaving removes you from
              its members and teams.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {leaveError ? (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {leaveError}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setLeaveOpen(true)}
              className="flex h-11 items-center justify-center rounded-full border border-red-500/40 px-5 text-sm font-medium text-red-700 transition-colors hover:bg-red-500/10 dark:text-red-400"
            >
              Leave workspace
            </button>
          </CardContent>
        </Card>
      ) : null}

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave {activeOrg?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              You will lose access to this workspace until someone invites you
              back. Owners cannot leave if they are the last owner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={leavePending}>Stay</AlertDialogCancel>
            <AlertDialogAction disabled={leavePending} onClick={handleLeaveOrg}>
              {leavePending ? "Leaving…" : "Leave workspace"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
