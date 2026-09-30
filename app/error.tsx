"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
        Something went wrong
      </span>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
        This page hit an unexpected error
      </h1>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        The error has been logged. Try again — if it keeps happening, head
        back to your workspace.
        {error.digest ? (
          <>
            {" "}
            Reference: <code className="text-xs">{error.digest}</code>
          </>
        ) : null}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <Button onClick={() => retry()} className="rounded-full">
          Try again
        </Button>
        <Button
          variant="outline"
          render={<Link href="/app" />}
          nativeButton={false}
          className="rounded-full"
        >
          Back to workspace
        </Button>
      </div>
    </div>
  );
}
