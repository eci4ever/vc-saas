"use client";

import Link from "next/link";
import { useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  // The request endpoint answers identically whether or not the email
  // exists, so the confirmation must stay generic too.
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    setPending(false);
    setSent(true);
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
            Forgot your password?
          </h1>
          {sent ? (
            <>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                If an account exists for that email, we&apos;ve sent a link to
                reset your password. It expires in one hour.
              </p>
              <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
                Back to{" "}
                <Link
                  href="/login"
                  className="font-medium text-zinc-950 underline dark:text-white"
                >
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
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
                <button
                  type="submit"
                  disabled={pending}
                  className="mt-2 flex h-11 items-center justify-center rounded-full bg-zinc-950 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  {pending ? "Sending…" : "Send reset link"}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
                Back to{" "}
                <Link
                  href="/login"
                  className="font-medium text-zinc-950 underline dark:text-white"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
