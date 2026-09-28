"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
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

type SessionRow = {
  token: string;
  createdAt: string | Date;
  expiresAt: string | Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

function deviceLabel(userAgent?: string | null): string {
  if (!userAgent) return "Unknown device";
  if (/iphone|android|mobile/i.test(userAgent)) return "Mobile browser";
  if (/mac/i.test(userAgent)) return "Mac browser";
  if (/windows/i.test(userAgent)) return "Windows browser";
  if (/linux/i.test(userAgent)) return "Linux browser";
  return "Browser";
}

export default function AccountPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  // Session refetches (e.g. after change-email) flip isPending and would
  // unmount the cards, losing in-flight form feedback. Keep the last known
  // user so the page only shows its loading state before the very first
  // session arrives.
  // Deliberately no isPending here: session refetches (change-email etc.)
  // keep the last user, and unmounting the cards would drop in-flight
  // form feedback.
  const user = session?.user ?? null;
  const currentToken = session?.session?.token ?? null;

  // profile
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profilePending, setProfilePending] = useState(false);

  // email
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailPending, setEmailPending] = useState(false);

  // password
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwPending, setPwPending] = useState(false);

  // sessions
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  // two-factor
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [twoFactorMsg, setTwoFactorMsg] = useState<string | null>(null);
  const [setupPassword, setSetupPassword] = useState("");
  const [setupUri, setSetupUri] = useState<string | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [tfPending, setTfPending] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [backupPasswordOpen, setBackupPasswordOpen] = useState(false);
  const [backupPassword, setBackupPassword] = useState("");

  const twoFactorEnabled = !!(
    user as { twoFactorEnabled?: boolean } | undefined
  )?.twoFactorEnabled;

  const loadSessions = useCallback(async () => {
    const { data, error } = await authClient.listSessions();
    if (error) {
      setSessionsError(error.message ?? "Failed to load sessions.");
      return;
    }
    setSessionsError(null);
    setSessions((data as unknown as SessionRow[] | null) ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessions();
  }, [loadSessions]);

  async function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileError(null);
    setProfileMsg(null);
    setProfilePending(true);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name")).trim();
    const image = String(form.get("image")).trim();
    const { error } = await authClient.updateUser({
      ...(name ? { name } : {}),
      image: image || null,
    });
    setProfilePending(false);
    if (error) {
      setProfileError(error.message ?? "Failed to update profile.");
      return;
    }
    setProfileMsg("Profile updated.");
    router.refresh();
  }

  async function handleResendVerification() {
    if (!user?.email) return;
    setEmailError(null);
    setEmailMsg(null);
    setEmailPending(true);
    const { error } = await authClient.sendVerificationEmail({
      email: user.email,
      callbackURL: "/dashboard/account",
    });
    setEmailPending(false);
    if (error) {
      setEmailError(error.message ?? "Failed to send verification email.");
      return;
    }
    setEmailMsg(`Verification email sent to ${user.email}.`);
  }

  async function handleChangeEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailError(null);
    setEmailMsg(null);
    setEmailPending(true);
    const form = new FormData(e.currentTarget);
    // Capture the element before awaiting — currentTarget is nulled after
    // the synchronous handler returns.
    const formEl = e.currentTarget as HTMLFormElement;
    const { error } = await authClient.changeEmail({
      newEmail: String(form.get("newEmail")),
      callbackURL: "/dashboard/account",
    });
    setEmailPending(false);
    if (error) {
      setEmailError(error.message ?? "Failed to request email change.");
      return;
    }
    formEl.reset();
    setEmailMsg(
      "Confirmation sent to your new email — click the link to finish the change."
    );
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError(null);
    setPwMsg(null);
    const form = new FormData(e.currentTarget);
    const formEl = e.currentTarget;
    const newPassword = String(form.get("newPassword"));
    if (newPassword !== String(form.get("confirmPassword"))) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwPending(true);
    const { error } = await authClient.changePassword({
      currentPassword: String(form.get("currentPassword")),
      newPassword,
      revokeOtherSessions: false,
    });
    setPwPending(false);
    if (error) {
      setPwError(error.message ?? "Failed to change password.");
      return;
    }
    formEl.reset();
    setPwMsg("Password changed.");
  }

  async function revokeSession(row: SessionRow) {
    setSessionsError(null);
    setRevoking(row.token);
    const { error } = await authClient.revokeSession({ token: row.token });
    setRevoking(null);
    if (error) {
      setSessionsError(error.message ?? "Failed to revoke session.");
      return;
    }
    loadSessions();
  }

  async function revokeOthers() {
    setSessionsError(null);
    const { error } = await authClient.revokeOtherSessions();
    if (error) {
      setSessionsError(error.message ?? "Failed to revoke sessions.");
      return;
    }
    loadSessions();
  }

  async function handleStartTwoFactor() {
    setTwoFactorError(null);
    setTwoFactorMsg(null);
    if (!setupPassword) {
      setTwoFactorError("Enter your password to enable two-factor.");
      return;
    }
    setTfPending(true);
    const { data, error } = await authClient.twoFactor.enable({
      password: setupPassword,
      method: "totp",
    });
    setTfPending(false);
    if (error || !data || data.method !== "totp") {
      setTwoFactorError(error?.message ?? "Failed to start two-factor setup.");
      return;
    }
    setSetupUri(data.totpURI);
  }

  async function handleVerifyFirstCode() {
    setTwoFactorError(null);
    setTfPending(true);
    const { error } = await authClient.twoFactor.verifyTotp({
      code: setupCode.trim(),
    });
    setTfPending(false);
    if (error) {
      setTwoFactorError(error?.message ?? "That code did not match.");
      return;
    }
    setSetupUri(null);
    setSetupCode("");
    setTwoFactorMsg("Two-factor enabled. Generate backup codes next.");
    router.refresh();
  }

  async function handleGenerateBackupCodes() {
    setTwoFactorError(null);
    setTfPending(true);
    const { data, error } = await authClient.twoFactor.generateBackupCodes({
      password: backupPassword,
    });
    setTfPending(false);
    setBackupPasswordOpen(false);
    setBackupPassword("");
    if (error || !data) {
      setTwoFactorError(error?.message ?? "Failed to generate backup codes.");
      return;
    }
    setBackupCodes(data.backupCodes);
  }

  async function handleDisableTwoFactor() {
    setTwoFactorError(null);
    setTfPending(true);
    const { error } = await authClient.twoFactor.disable({
      password: disablePassword,
    });
    setTfPending(false);
    if (error) {
      setTwoFactorError(error?.message ?? "Failed to disable two-factor.");
      setDisableOpen(false);
      return;
    }
    setDisableOpen(false);
    setDisablePassword("");
    setTwoFactorMsg("Two-factor disabled.");
    router.refresh();
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-2xl p-4 pt-8">
        <p className="text-sm text-muted-foreground">Loading account…</p>
      </div>
    );
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Account</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
            <p className="text-sm text-muted-foreground">
              Manage your personal account — it follows you across workspaces.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>How you appear across the app.</CardDescription>
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
                    defaultValue={user.name}
                    key={`name-${user.name}`}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium">
                  Avatar URL
                  <input
                    name="image"
                    type="url"
                    placeholder="https://example.com/avatar.png"
                    defaultValue={user.image ?? ""}
                    key={`image-${user.image ?? ""}`}
                    className={inputClass}
                  />
                </label>
                <button
                  type="submit"
                  disabled={profilePending}
                  className="flex h-11 w-fit items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  {profilePending ? "Saving…" : "Save changes"}
                </button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email</CardTitle>
              <CardDescription>
                {user.email}{" "}
                {user.emailVerified ? (
                  <span className="ml-1 inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                    verified
                  </span>
                ) : (
                  <span className="ml-1 inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400">
                    not verified
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {emailError ? (
                <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {emailError}
                </p>
              ) : null}
              {emailMsg ? (
                <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                  {emailMsg}
                </p>
              ) : null}
              {!user.emailVerified ? (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={emailPending}
                  className="flex h-11 w-fit items-center rounded-full border border-zinc-200 px-5 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10"
                >
                  {emailPending ? "Sending…" : "Resend verification email"}
                </button>
              ) : null}
              <form className="flex flex-col gap-4" onSubmit={handleChangeEmail}>
                <label className="flex flex-col gap-1 text-sm font-medium">
                  Change email
                  <input
                    type="email"
                    name="newEmail"
                    required
                    placeholder="new@company.com"
                    className={inputClass}
                  />
                </label>
                <button
                  type="submit"
                  disabled={emailPending}
                  className="flex h-11 w-fit items-center justify-center rounded-full border border-zinc-200 px-5 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10"
                >
                  {emailPending ? "Requesting…" : "Request email change"}
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
                  className="flex h-11 w-fit items-center justify-center rounded-full border border-zinc-200 px-5 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10"
                >
                  {pwPending ? "Changing…" : "Change password"}
                </button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>
                Devices currently signed in to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {sessionsError ? (
                <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {sessionsError}
                </p>
              ) : null}
              {sessions === null ? (
                <p className="text-sm text-muted-foreground">Loading sessions…</p>
              ) : (
                <>
                  {sessions.map((row) => {
                    const current = row.token === currentToken;
                    return (
                      <div
                        key={row.token}
                        className="flex flex-col gap-2 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center"
                      >
                        <div className="grid flex-1 leading-tight">
                          <span className="font-medium">
                            {deviceLabel(row.userAgent)}
                            {current ? (
                              <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                                this device
                              </span>
                            ) : null}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {row.ipAddress || "unknown ip"} · started{" "}
                            {new Date(row.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {!current ? (
                          <button
                            type="button"
                            disabled={revoking === row.token}
                            onClick={() => revokeSession(row)}
                            className="flex h-9 items-center rounded-lg border border-red-500/30 px-3 text-sm text-red-700 transition-colors hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
                          >
                            {revoking === row.token ? "Revoking…" : "Revoke"}
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                  {sessions.length > 1 ? (
                    <button
                      type="button"
                      onClick={revokeOthers}
                      className="flex h-11 w-fit items-center rounded-full border border-red-500/40 px-5 text-sm font-medium text-red-700 transition-colors hover:bg-red-500/10 dark:text-red-400"
                    >
                      Sign out other devices
                    </button>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-factor authentication</CardTitle>
              <CardDescription>
                {twoFactorEnabled
                  ? "Enabled — a TOTP code from your authenticator app is required at sign-in."
                  : "Add a second factor with any TOTP authenticator app."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {twoFactorError ? (
                <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {twoFactorError}
                </p>
              ) : null}
              {twoFactorMsg ? (
                <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                  {twoFactorMsg}
                </p>
              ) : null}

              {!twoFactorEnabled && !setupUri ? (
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col gap-1 text-sm font-medium">
                    Password
                    <input
                      type="password"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleStartTwoFactor}
                    disabled={tfPending}
                    className="flex h-11 w-fit items-center rounded-full bg-zinc-950 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  >
                    {tfPending ? "Starting…" : "Enable two-factor"}
                  </button>
                </div>
              ) : null}

              {setupUri ? (
                <div className="flex flex-col gap-3 text-sm">
                  <p className="font-medium">1. Add this secret to your authenticator app</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg border px-3 py-2 font-mono text-xs">
                      {setupUri}
                    </code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(setupUri)}
                      className="flex h-9 items-center rounded-lg border border-zinc-200 px-3 text-xs transition-colors hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-white/10"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-muted-foreground">
                    Paste the URI into your authenticator app (or extract the
                    secret and add it manually), then enter the current code.
                  </p>
                  <p className="font-medium">2. Enter the 6-digit code</p>
                  <div className="flex gap-2">
                    <input
                      value={setupCode}
                      onChange={(e) => setSetupCode(e.target.value)}
                      inputMode="numeric"
                      placeholder="123456"
                      className={`${inputClass} w-32 font-mono`}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyFirstCode}
                      disabled={tfPending || setupCode.trim().length < 6}
                      className="flex h-11 items-center rounded-full bg-zinc-950 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              ) : null}

              {twoFactorEnabled ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setBackupPasswordOpen(true)}
                    disabled={tfPending}
                    className="flex h-11 w-fit items-center rounded-full border border-zinc-200 px-5 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10"
                  >
                    Regenerate backup codes
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisableOpen(true)}
                    disabled={tfPending}
                    className="flex h-11 w-fit items-center rounded-full border border-red-500/40 px-5 text-sm font-medium text-red-700 transition-colors hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
                  >
                    Disable two-factor
                  </button>
                </div>
              ) : null}

              {backupCodes ? (
                <div className="rounded-xl border p-3 text-sm">
                  <p className="font-medium">Save these backup codes now</p>
                  <p className="text-xs text-muted-foreground">
                    Each works once at sign-in. They are shown only this once.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs sm:grid-cols-3">
                    {backupCodes.map((code) => (
                      <span key={code}>{code}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setBackupCodes(null)}
                    className="mt-3 flex h-9 items-center rounded-full border border-zinc-200 px-4 text-xs font-medium transition-colors hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-white/10"
                  >
                    I saved them
                  </button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={disableOpen} onOpenChange={setDisableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable two-factor?</AlertDialogTitle>
            <AlertDialogDescription>
              Sign-in will only require your password. Confirm with your
              password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            placeholder="Current password"
            className={inputClass}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={tfPending}>Keep it on</AlertDialogCancel>
            <AlertDialogAction
              disabled={tfPending || !disablePassword}
              onClick={(e) => {
                e.preventDefault();
                handleDisableTwoFactor();
              }}
            >
              {tfPending ? "Disabling…" : "Disable two-factor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={backupPasswordOpen} onOpenChange={setBackupPasswordOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate backup codes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your existing backup codes stop working. Confirm with your
              password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            type="password"
            value={backupPassword}
            onChange={(e) => setBackupPassword(e.target.value)}
            placeholder="Current password"
            className={inputClass}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={tfPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={tfPending || !backupPassword}
              onClick={(e) => {
                e.preventDefault();
                handleGenerateBackupCodes();
              }}
            >
              {tfPending ? "Generating…" : "Generate codes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
