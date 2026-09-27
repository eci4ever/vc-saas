import Link from "next/link";

import { BRAND_INITIAL, BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80",
        className
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-900 to-zinc-600 text-sm text-white shadow-sm dark:from-white dark:to-zinc-400 dark:text-black">
        {BRAND_INITIAL}
      </span>
      {BRAND_NAME}
    </Link>
  );
}
