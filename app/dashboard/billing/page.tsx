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
import { getAccessContext } from "@/lib/guards";
import { isOrgOwner } from "@/lib/access";
import { getSubscription, listPayments } from "@/lib/billing";
import { formatRm, planName } from "@/lib/plans";

import { BillingActions } from "./billing-actions";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  expired: "Expired",
  canceled: "Canceled",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ billplz?: string; billplz_id?: string }>;
}) {
  const { billplz, billplz_id: billplzId } = await searchParams;
  const ctx = await getAccessContext();
  if (!ctx) return null;
  const organizationId = ctx.activeOrganizationId;
  const owner = isOrgOwner(ctx.orgRole);

  const subscription = organizationId
    ? await getSubscription(organizationId)
    : null;
  const invoices = organizationId ? await listPayments(organizationId) : [];

  const effectivePlan = subscription?.planId ?? "free";
  const effectiveStatus =
    subscription?.status ?? "active";

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
            Subscriptions are per workspace and paid through Billplz (FPX).
          </p>
        </div>

        {!organizationId ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              You have no active workspace. Create one from the workspace
              switcher to manage billing.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Current plan
                  <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {planName(effectivePlan)}
                  </span>
                  {subscription ? (
                    <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {STATUS_LABELS[effectiveStatus]}
                    </span>
                  ) : null}
                </CardTitle>
                <CardDescription>
                  {subscription
                    ? `${subscription.cycle} billing · period ${subscription.periodStart.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })} – ${subscription.periodEnd.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}`
                    : "You are on the Free plan — no subscription yet."}
                </CardDescription>
              </CardHeader>
            </Card>

            <BillingActions
              isOwner={owner}
              hasSubscription={!!subscription}
              returningFromBillplz={
                billplz === "return" && !!billplzId ? billplzId : null
              }
            />

            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>
                  Every Billplz bill raised for this workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No invoices yet.
                  </p>
                ) : (
                  invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center"
                    >
                      <span className="flex-1 font-medium">
                        {planName(invoice.planId)} · {invoice.cycle}
                      </span>
                      <span className="text-muted-foreground">
                        {invoice.createdAt.toLocaleDateString("en-MY", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="font-medium">
                        {formatRm(invoice.amount)}
                      </span>
                      {invoice.status === "paid" ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                          Paid
                        </span>
                      ) : invoice.status === "due" ? (
                        <a
                          href={invoice.billUrl}
                          className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs font-medium text-zinc-700 underline dark:text-zinc-300"
                        >
                          Pay now
                        </a>
                      ) : (
                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-700 dark:text-red-400">
                          Failed
                        </span>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
