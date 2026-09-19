import Link from "next/link";
import { sql } from "drizzle-orm";

import { db } from "@/db";

export const dynamic = "force-dynamic";

async function getDbStatus(): Promise<{ online: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    await db.execute(sql`select 1`);
    return { online: true, latencyMs: Date.now() - start };
  } catch {
    return { online: false, latencyMs: Date.now() - start };
  }
}

export default async function Home() {
  const dbStatus = await getDbStatus();
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-zinc-950 antialiased dark:bg-black dark:text-zinc-50">
      <header className="border-b border-zinc-200/70 dark:border-white/10">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-sm text-white dark:bg-white dark:text-black">
              V
            </span>
            Acme SaaS
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-950 sm:block dark:text-zinc-400 dark:hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <section className="mx-auto w-full max-w-6xl px-6 py-20 text-center sm:py-28">
          <p
            className={`mx-auto mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
              dbStatus.online
                ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                : "border-red-500/30 text-red-700 dark:text-red-400"
            }`}
          >
            <span className="relative flex size-2">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                  dbStatus.online ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              <span
                className={`relative inline-flex size-2 rounded-full ${
                  dbStatus.online ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
            </span>
            {dbStatus.online ? `DB connected · ${dbStatus.latencyMs}ms` : "DB offline"}
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            Ship your SaaS faster with a simple starter
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Auth, billing, dashboard, and deploys — wired up with Next.js and
            Tailwind. Clone it, brand it, charge for it.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="flex h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-6 text-base font-medium text-white transition-colors hover:bg-zinc-800 sm:w-auto dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Start building free
            </Link>
            <Link
              href="/login"
              className="flex h-12 w-full items-center justify-center rounded-full border border-zinc-200 px-6 text-base font-medium transition-colors hover:bg-zinc-100 sm:w-auto dark:border-white/15 dark:hover:bg-white/10"
            >
              View demo
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
