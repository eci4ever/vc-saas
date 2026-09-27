"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Second step: the server answered with twoFactorRedirect and left a
  // pending two-factor cookie; a TOTP or backup code completes sign-in.
  const [awaitingTwoFactor, setAwaitingTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const { data, error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
    });
    setPending(false);
    if (error) {
      setError(error.message ?? "Sign in failed. Check your details and try again.");
      return;
    }
    if (
      data &&
      (data as { twoFactorRedirect?: boolean }).twoFactorRedirect
    ) {
      setAwaitingTwoFactor(true);
      return;
    }
    router.push("/dashboard");
  }

  async function handleTwoFactor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const code = twoFactorCode.trim();
    // Try the 6-digit TOTP first, then treat the input as a backup code.
    const totp = await authClient.twoFactor.verifyTotp({ code });
    const result = totp.error
      ? await authClient.twoFactor.verifyBackupCode({ code })
      : totp;
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "That code was not accepted.");
      return;
    }
    setTwoFactorCode("");
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-zinc-950 antialiased dark:bg-black dark:text-zinc-50">
      <header className="border-b border-zinc-200/70 dark:border-white/10">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-6">
          <BrandMark />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 p-8 dark:border-white/10">
          <h1 className="text-2xl font-semibold tracking-tight">
            {awaitingTwoFactor ? "Two-factor required" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {awaitingTwoFactor
              ? "Enter the 6-digit code from your authenticator app, or a backup code."
              : "Sign in to your account."}
          </p>

          {awaitingTwoFactor ? (
            <form className="mt-6 flex flex-col gap-4" onSubmit={handleTwoFactor}>
              {error ? (
                <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>
              ) : null}
              <label className="flex flex-col gap-1 text-sm font-medium">
                Authentication code
                <input
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  required
                  autoComplete="one-time-code"
                  placeholder="123456 or backup code"
                  className="h-11 rounded-xl border border-zinc-200 bg-transparent px-3 font-normal outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white"
                />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="mt-2 flex h-11 items-center justify-center rounded-full bg-zinc-950 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {pending ? "Verifying…" : "Verify"}
              </button>
            </form>
          ) : (
            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            {error ? (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </p>
            ) : null}
            <label className="flex flex-col gap-1 text-sm font-medium">
              Email
              <input
                type="email"
                name="email"
                required
                placeholder="you@company.com"
                className="h-11 rounded-xl border border-zinc-200 bg-transparent px-3 font-normal outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Password
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="h-11 rounded-xl border border-zinc-200 bg-transparent px-3 font-normal outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="mt-2 flex h-11 items-center justify-center rounded-full bg-zinc-950 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            No account?{" "}
            <Link href="/signup" className="font-medium text-zinc-950 underline dark:text-white">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
