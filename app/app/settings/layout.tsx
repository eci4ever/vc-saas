import { requireOrgManager } from "@/lib/guards";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Settings is workspace-only; personal settings live on /app/account.
  await requireOrgManager();
  return children;
}
