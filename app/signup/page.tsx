"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import { GoogleButton } from "@/components/google-button";
import { authClient } from "@/lib/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name"));
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: "/app",
    });
    if (error) {
      setPending(false);
      setError(error.message ?? "Sign up failed. Try a different email.");
      return;
    }
    // No workspace creation here: the app layout's ensure step creates the
    // flagged "Default Workspace" on the first /app visit — the same server
    // path Google sign-ins use.
    setPending(false);
    router.push("/app");
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
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Start free. No credit card required.
          </p>

          <div className="mt-6">
            <GoogleButton label="Sign up with Google" />
            <div className="my-4 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
              or sign up with email
              <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
            </div>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {error ? (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </p>
            ) : null}
            <label className="flex flex-col gap-1 text-sm font-medium">
              Name
              <input
                type="text"
                name="name"
                required
                placeholder="Ada Lovelace"
                className="h-11 rounded-xl border border-zinc-200 bg-transparent px-3 font-normal outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white"
              />
            </label>
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
              {pending ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Have an account?{" "}
            <Link href="/login" className="font-medium text-zinc-950 underline dark:text-white">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
