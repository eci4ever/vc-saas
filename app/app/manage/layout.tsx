import { requireOrgManager } from "@/lib/guards";
import { PageHeader } from "@/components/page-header";

import { ManageNav } from "./manage-nav";

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireOrgManager();
  return (
    <>
      <PageHeader title="Overview" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex w-full flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {ctx.activeOrganizationName ?? "Workspace"}
            </h1>
            <p className="text-sm capitalize text-muted-foreground">
              Managing as {ctx.orgRole?.split(",")[0]}
            </p>
          </div>
          <ManageNav />
          {children}
        </div>
      </div>
    </>
  );
}
