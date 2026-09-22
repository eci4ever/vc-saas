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

const MOCK_KEYS = [
  {
    name: "Production",
    prefix: "sk_live_…4f2a",
    created: "Aug 12, 2026",
    lastUsed: "10 minutes ago",
  },
  {
    name: "Development",
    prefix: "sk_test_…9b1c",
    created: "Jul 30, 2026",
    lastUsed: "2 days ago",
  },
];

export default function ApiKeysPage() {
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
                <BreadcrumbPage>API Keys</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
            <p className="text-sm text-muted-foreground">
              Mock UI — never expose real secrets in the browser.
            </p>
          </div>
          <button
            type="button"
            disabled
            title="Mock only"
            className="flex h-9 items-center rounded-full bg-zinc-950 px-4 text-sm font-medium text-white opacity-60 dark:bg-white dark:text-black"
          >
            Create key
          </button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Keys</CardTitle>
            <CardDescription>
              Prefixes only — full secrets are never shown again after
              creation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {MOCK_KEYS.map((key) => (
              <div
                key={key.name}
                className="flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center"
              >
                <div className="grid flex-1 leading-tight">
                  <span className="truncate font-medium">{key.name}</span>
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {key.prefix} · created {key.created}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Last used {key.lastUsed}
                </span>
                <button
                  type="button"
                  disabled
                  title="Mock only"
                  className="flex h-9 items-center rounded-lg border border-red-500/30 px-3 text-sm text-red-700 opacity-60 dark:text-red-400"
                >
                  Revoke
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
