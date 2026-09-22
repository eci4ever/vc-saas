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

const MOCK_PLANS = [
  {
    name: "Free",
    price: "$0",
    limits: "3 projects · 5 members · community support",
  },
  {
    name: "Pro",
    price: "$29",
    limits: "Unlimited projects · 25 members · priority support",
  },
  {
    name: "Enterprise",
    price: "Custom",
    limits: "SSO · audit log · dedicated support",
  },
];

export default function AdminPlansPage() {
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
                <BreadcrumbPage>Admin · Plans</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plans</h1>
          <p className="text-sm text-muted-foreground">
            Mock UI — connect a billing provider later.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {MOCK_PLANS.map((plan) => (
            <Card key={plan.name}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  {plan.price}
                  {plan.price.startsWith("$") ? " / month" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">{plan.limits}</p>
                <button
                  type="button"
                  disabled
                  title="Mock only"
                  className="flex h-9 items-center justify-center rounded-full border border-zinc-200 px-4 text-sm font-medium opacity-60 dark:border-white/15"
                >
                  Edit plan
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
