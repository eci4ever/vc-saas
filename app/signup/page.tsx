"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

function slugify(value: string) {
  const base =
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "workspace";
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

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
      callbackURL: "/dashboard",
    });
    if (error) {
      setPending(false);
      setError(error.message ?? "Sign up failed. Try a different email.");
      return;
    }
    // Provision a personal workspace (a default team is auto-created server-side
    // by the organization plugin) so the sidebar has real data.
    try {
      const orgName = `${name}'s Workspace`;
      const { data: org } = await authClient.organization.create({
        name: orgName,
        slug: slugify(email.split("@")[0] ?? "workspace"),
      });
      if (org) {
        await authClient.organization.setActive({ organizationId: org.id });
      }
    } catch {
      // Non-fatal: user is created, workspace can be added later.
    }
    setPending(false);
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-zinc-950 antialiased dark:bg-black dark:text-zinc-50">
      <header className="border-b border-zinc-200/70 dark:border-white/10">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-sm text-white dark:bg-white dark:text-black">
              V
            </span>
            Acme SaaS
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 p-8 dark:border-white/10">
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Start free. No credit card required.
          </p>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
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
