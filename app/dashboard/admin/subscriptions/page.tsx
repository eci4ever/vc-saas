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

const MOCK_SUBSCRIPTIONS = [
  {
    org: "Acme Corp",
    plan: "Pro",
    status: "active",
    mrr: "$29",
    renews: "Oct 1, 2026",
  },
  {
    org: "Beta Studio",
    plan: "Free",
    status: "active",
    mrr: "$0",
    renews: "—",
  },
  {
    org: "Gamma Labs",
    plan: "Enterprise",
    status: "past_due",
    mrr: "$499",
    renews: "Oct 15, 2026",
  },
  {
    org: "Delta Co",
    plan: "Pro",
    status: "canceled",
    mrr: "$0",
    renews: "—",
  },
];

function statusClass(status: string) {
  if (status === "active")
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  if (status === "past_due")
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400";
}

export default function AdminSubscriptionsPage() {
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
                <BreadcrumbPage>Admin · Subscriptions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Subscriptions
          </h1>
          <p className="text-sm text-muted-foreground">
            Mock UI — connect a billing provider later.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Monthly recurring revenue</CardDescription>
              <CardTitle className="text-3xl">$528</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Active subscriptions</CardDescription>
              <CardTitle className="text-3xl">2</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Past due</CardDescription>
              <CardTitle className="text-3xl">1</CardTitle>
            </CardHeader>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All subscriptions</CardTitle>
            <CardDescription>
              Every workspace subscription across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {MOCK_SUBSCRIPTIONS.map((sub) => (
              <div
                key={sub.org}
                className="flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center"
              >
                <div className="grid flex-1 leading-tight">
                  <span className="truncate font-medium">
                    {sub.org}
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs ${statusClass(sub.status)}`}
                    >
                      {sub.status.replace("_", " ")}
                    </span>
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {sub.plan} · {sub.mrr}/mo · renews {sub.renews}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
