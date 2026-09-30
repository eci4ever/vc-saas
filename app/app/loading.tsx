import { PageHeader } from "@/components/page-header";

/**
 * Instant skeleton for every nested /app navigation while the segment's
 * server components (auth + DB reads) resolve.
 */
export default function AppLoading() {
  return (
    <>
      <PageHeader title="Loading" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-col gap-1">
          <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </>
  );
}
