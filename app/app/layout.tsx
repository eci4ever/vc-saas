import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ImpersonationBanner } from "@/components/impersonation-banner";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { ensurePersonalWorkspace } from "@/lib/ensure-workspace";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/login");
  }
  // Google-first accounts skip the signup form's workspace creation; heal
  // them on their first /app visit.
  await ensurePersonalWorkspace();
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <ImpersonationBanner />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
