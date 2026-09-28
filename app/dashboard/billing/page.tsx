import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAccessContext } from "@/lib/guards";
import { isOrgManager, isOrgOwner } from "@/lib/access";
import { redirect } from "next/navigation";
import { getSubscription, listPayments } from "@/lib/billing";
import { formatRm, planName } from "@/lib/plans";

import { PlanPicker } from "./billing-actions";

function statusBadge(status: string) {
  if (status === "active")
    return <Badge>Active</Badge>;
  if (status === "expired")
    return <Badge variant="outline">Expired</Badge>;
  if (status === "canceled")
    return <Badge variant="outline">Canceled</Badge>;
  return <Badge variant="secondary">Free</Badge>;
}

const DATE_FMT = { day: "numeric", month: "short", year: "numeric" } as const;

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ billplz?: string; billplz_id?: string }>;
}) {
  const { billplz, billplz_id: billplzId } = await searchParams;
  const ctx = await getAccessContext();
  if (!ctx) return null;
  // Billing is a management page now: the sidebar hides it from plain
  // members and this guard keeps the URL from drifting out of sync.
  if (!isOrgManager(ctx.orgRole)) redirect("/dashboard");
  const organizationId = ctx.activeOrganizationId;
  const owner = isOrgOwner(ctx.orgRole);

  const subscription = organizationId
    ? await getSubscription(organizationId)
    : null;
  const invoices = organizationId ? await listPayments(organizationId) : [];

  const effectivePlan = subscription?.planId ?? "free";
  const effectiveStatus = subscription?.status ?? "active";

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
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
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
                <CardTitle className="flex items-center gap-3">
                  Current plan
                  <span className="text-xl font-semibold">
                    {planName(effectivePlan)}
                  </span>
                  {statusBadge(effectiveStatus)}
                </CardTitle>
                <CardDescription>
                  {subscription
                    ? `${subscription.cycle} billing · period ${subscription.periodStart.toLocaleDateString("en-MY", DATE_FMT)} – ${subscription.periodEnd.toLocaleDateString("en-MY", DATE_FMT)}`
                    : "You are on the Free plan — no subscription yet."}
                </CardDescription>
              </CardHeader>
            </Card>

            {owner ? (
              <PlanPicker
                hasSubscription={!!subscription}
                activePlan={subscription?.status === "active"}
                // Only an ACTIVE subscription counts as "Current" in the
                // picker; canceled/expired keeps the header badge but makes
                // every plan switchable again.
                currentPlanId={
                  subscription?.status === "active" ? effectivePlan : null
                }
                currentCycle={
                  subscription?.status === "active"
                    ? subscription.cycle
                    : null
                }
                returningFromBillplz={
                  billplz === "return" && !!billplzId ? billplzId : null
                }
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Only the workspace owner can change the plan. Ask them to
                subscribe or renew from this page.
              </p>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>
                  Every Billplz bill raised for this workspace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No invoices yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            {invoice.createdAt.toLocaleDateString(
                              "en-MY",
                              DATE_FMT
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {planName(invoice.planId)}
                            <span className="text-muted-foreground">
                              {" "}
                              · {invoice.cycle}
                            </span>
                          </TableCell>
                          <TableCell>{formatRm(invoice.amount)}</TableCell>
                          <TableCell className="text-right">
                            {invoice.status === "paid" ? (
                              <Badge variant="secondary">Paid</Badge>
                            ) : invoice.status === "due" ? (
                              <a
                                href={invoice.billUrl}
                                className="text-sm font-medium underline underline-offset-4"
                              >
                                Pay now
                              </a>
                            ) : (
                              <Badge variant="destructive">Failed</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
