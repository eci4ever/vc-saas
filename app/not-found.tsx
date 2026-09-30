import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col bg-background font-sans text-foreground">
      <header className="flex items-center px-6 py-5">
        <Link href="/" className="transition-opacity hover:opacity-70">
          <BrandMark />
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-24 text-center">
        <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          404
        </span>
        <h1 className="font-heading text-4xl font-semibold tracking-tighter text-balance sm:text-5xl">
          This page doesn&apos;t exist
        </h1>
        <p className="max-w-md text-balance text-muted-foreground">
          The link may be broken, or the page may have been moved or deleted.
        </p>
        <div className="mt-2 flex items-center gap-4 text-sm font-medium">
          <Link
            href="/"
            className="rounded-full bg-zinc-950 px-5 py-2.5 text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Back home
          </Link>
          <Link
            href="/app"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Go to workspace
          </Link>
        </div>
      </main>
    </div>
  );
}
