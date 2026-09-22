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

const MOCK_ORGANIZATIONS = [
  {
    name: "Acme Corp",
    slug: "acme-corp",
    members: 12,
    plan: "Pro",
    created: "Jun 3, 2026",
  },
  {
    name: "Beta Studio",
    slug: "beta-studio",
    members: 4,
    plan: "Free",
    created: "Aug 19, 2026",
  },
  {
    name: "Gamma Labs",
    slug: "gamma-labs",
    members: 27,
    plan: "Enterprise",
    created: "Mar 11, 2026",
  },
];

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";
  const organizations = query
    ? MOCK_ORGANIZATIONS.filter(
        (org) =>
          org.name.toLowerCase().includes(query) ||
          org.slug.includes(query)
      )
    : MOCK_ORGANIZATIONS;

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
                <BreadcrumbPage>Admin · Organizations</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Organizations
          </h1>
          <p className="text-sm text-muted-foreground">
            Mock UI — {MOCK_ORGANIZATIONS.length} example workspaces.
          </p>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>All organizations</CardTitle>
              <CardDescription>Search by name or slug.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <form method="get" className="flex gap-2">
                <input
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="Search name or slug…"
                  className="h-10 flex-1 rounded-xl border border-zinc-200 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white"
                />
                <button
                  type="submit"
                  className="flex h-10 items-center rounded-full border border-zinc-200 px-4 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-white/10"
                >
                  Search
                </button>
              </form>
              {organizations.map((org) => (
                <div
                  key={org.slug}
                  className="flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center"
                >
                  <div className="grid flex-1 leading-tight">
                    <span className="truncate font-medium">
                      {org.name}
                      <span className="ml-2 rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                        {org.plan}
                      </span>
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {org.slug} · {org.members} members · created {org.created}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled
                    title="Mock only"
                    className="flex h-9 items-center rounded-lg border border-zinc-200 px-3 text-sm opacity-60 dark:border-white/15"
                  >
                    View
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
