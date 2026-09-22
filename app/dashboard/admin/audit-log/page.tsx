import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getRecentAdminActivity } from "@/lib/admin";

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";

  const activity = await getRecentAdminActivity(50);
  const entries = query
    ? activity.filter(
        (entry) =>
          entry.actorEmail.toLowerCase().includes(query) ||
          entry.targetEmail.toLowerCase().includes(query) ||
          entry.action.includes(query) ||
          (entry.reason ?? "").toLowerCase().includes(query)
      )
    : activity;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Admin · Audit Log</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
          <p className="text-sm text-muted-foreground">
            Live data — latest 50 admin actions across the platform.
          </p>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>All admin actions</CardTitle>
              <CardDescription>
                Search by actor, target, action, or reason.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <form method="get" className="flex gap-2">
                <input
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="Search audit log…"
                  className="h-10 flex-1 rounded-xl border border-zinc-200 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white"
                />
                <button
                  type="submit"
                  className="flex h-10 items-center rounded-full border border-zinc-200 px-4 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-white/10"
                >
                  Search
                </button>
              </form>
              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No admin actions recorded yet.
                </p>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-x-2">
                      <span className="font-medium">{entry.actorEmail}</span>
                      <span className="text-muted-foreground">
                        {entry.action === "ban" && "banned"}
                        {entry.action === "unban" && "unbanned"}
                        {entry.action === "set-role" &&
                          `changed role${
                            entry.oldRole || entry.newRole
                              ? ` (${entry.oldRole ?? "?"} → ${entry.newRole ?? "?"})`
                              : ""
                          }`}
                      </span>
                      <span className="font-medium">{entry.targetEmail}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span>
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                      {entry.reason ? (
                        <span>Reason: {entry.reason}</span>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
