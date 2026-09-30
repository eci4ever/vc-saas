import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

/**
 * Shared chrome for the legal pages (Terms, Privacy, Refunds): minimal
 * monochrome document layout with a link home and cross-links between the
 * documents. Replace the placeholder copy before going live.
 */
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-background font-sans text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="transition-opacity hover:opacity-70">
            <BrandMark />
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Last updated {updated}
        </p>
        <div className="mt-8 flex flex-col gap-8 text-[15px] leading-7 [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:text-[13px] [&_h2]:mt-2 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_li]:ml-5 [&_li]:list-disc">
          {children}
        </div>
        <div className="mt-12 flex flex-wrap gap-4 border-t border-border/60 pt-6 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="/refund" className="hover:text-foreground">
            Refund Policy
          </Link>
        </div>
      </main>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
