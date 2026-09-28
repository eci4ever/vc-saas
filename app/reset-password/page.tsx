"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("newPassword"));
    if (newPassword !== String(form.get("confirmPassword"))) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    const { error: resetError } = await authClient.resetPassword({
      newPassword,
      token: token ?? "",
    });
    setPending(false);
    if (resetError) {
      setError(
        resetError.message ?? "This reset link is invalid or has expired."
      );
      return;
    }
    // All sessions were revoked server-side; sign in fresh with the new
    // password. The login page picks up ?reset=1 for its confirmation.
    router.push("/login?reset=1");
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        Choose a new password
      </h1>
      {token ? (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Pick something at least 8 characters long.
        </p>
      ) : (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          This reset link is invalid or has expired.
        </p>
      )}
      <div className="mt-6">
        {token ? (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {error ? (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </p>
            ) : null}
            <label className="flex flex-col gap-1 text-sm font-medium">
              New password
              <input
                type="password"
                name="newPassword"
                required
                minLength={8}
                placeholder="8+ characters"
                className="h-11 rounded-xl border border-zinc-200 bg-transparent px-3 font-normal outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Confirm new password
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={8}
                placeholder="8+ characters"
                className="h-11 rounded-xl border border-zinc-200 bg-transparent px-3 font-normal outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="mt-2 flex h-11 items-center justify-center rounded-full bg-zinc-950 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {pending ? "Updating…" : "Reset password"}
            </button>
          </form>
        ) : (
          <Link
            href="/forgot-password"
            className="flex h-11 items-center justify-center rounded-full bg-zinc-950 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Request a new link
          </Link>
        )}
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-zinc-950 antialiased dark:bg-black dark:text-zinc-50">
      <header className="border-b border-zinc-200/70 dark:border-white/10">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-6">
          <BrandMark />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 p-8 dark:border-white/10">
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
