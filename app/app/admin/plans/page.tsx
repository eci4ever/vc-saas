import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/admin";
import {
  amountInSen,
  BILLING_CYCLES,
  CYCLE_LABELS,
  formatRm,
  PLANS,
} from "@/lib/plans";

export default async function AdminPlansPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader title="Plans" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plans</h1>
          <p className="text-sm text-muted-foreground">
            The catalog is defined in code (lib/plans.ts) — changes ship with a
            deploy.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <p className="text-2xl font-semibold">
                  {formatRm(plan.monthlySen)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {plan.monthlySen === 0 ? " forever" : " / month"}
                  </span>
                </p>
                {BILLING_CYCLES.map((cycle) => (
                  <div
                    key={cycle}
                    className="flex justify-between text-muted-foreground"
                  >
                    <span>{CYCLE_LABELS[cycle]}</span>
                    <span className="font-medium text-foreground">
                      {formatRm(amountInSen(plan.id, cycle))}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
