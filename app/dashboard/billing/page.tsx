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

const MOCK_INVOICES = [
  { id: "INV-003", date: "Sep 1, 2026", amount: "$29.00", status: "Paid" },
  { id: "INV-002", date: "Aug 1, 2026", amount: "$29.00", status: "Paid" },
  { id: "INV-001", date: "Jul 1, 2026", amount: "$29.00", status: "Paid" },
];

export default function BillingPage() {
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
                <BreadcrumbPage>Billing</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Mock UI — connect a payment provider later.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>
              You are on the Free plan. Mock data only.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                Free
              </span>
              <span className="text-sm text-muted-foreground">
                $0 / month · renews never
              </span>
            </div>
            <button
              type="button"
              disabled
              title="Mock only"
              className="flex h-9 items-center justify-center rounded-full bg-zinc-950 px-4 text-sm font-medium text-white opacity-60 dark:bg-white dark:text-black"
            >
              Upgrade to Pro
            </button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Recent invoices for this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {MOCK_INVOICES.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span className="font-medium">{invoice.id}</span>
                <span className="text-muted-foreground">{invoice.date}</span>
                <span className="font-medium">{invoice.amount}</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                  {invoice.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
