"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"
import {
  Building2Icon,
  CreditCardIcon,
  FolderKanbanIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  PackageIcon,
  RepeatIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldIcon,
} from "lucide-react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { data: session } = authClient.useSession()
  const isAdmin =
    (session?.user as { role?: string } | undefined)?.role === "admin"
  const { data: organizations } = authClient.useListOrganizations()
  const { data: activeOrganization } = authClient.useActiveOrganization()

  const teams =
    organizations && organizations.length > 0
      ? organizations.map((org) => ({
          id: org.id,
          name: org.name,
          plan: "Free",
        }))
      : [{ id: "", name: "Personal", plan: "Free" }]

  async function handleSelect(id: string) {
    if (!id) return
    await authClient.organization.setActive({ organizationId: id })
  }

  const workspaceItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboardIcon,
      isActive: pathname === "/dashboard",
    },
    {
      title: "Projects",
      href: "/dashboard/projects",
      icon: FolderKanbanIcon,
      isActive: pathname.startsWith("/dashboard/projects"),
    },
    {
      title: "Billing",
      href: "/dashboard/billing",
      icon: CreditCardIcon,
      isActive: pathname.startsWith("/dashboard/billing"),
    },
    {
      title: "API Keys",
      href: "/dashboard/api-keys",
      icon: KeyRoundIcon,
      isActive: pathname.startsWith("/dashboard/api-keys"),
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: SettingsIcon,
      isActive: pathname.startsWith("/dashboard/settings"),
    },
  ]

  const adminItems = [
    {
      title: "Users",
      href: "/dashboard/admin/users",
      icon: ShieldIcon,
      isActive:
        pathname === "/dashboard/admin/users" ||
        pathname === "/dashboard/admin",
    },
    {
      title: "Organizations",
      href: "/dashboard/admin/organizations",
      icon: Building2Icon,
      isActive: pathname.startsWith("/dashboard/admin/organizations"),
    },
    {
      title: "Plans",
      href: "/dashboard/admin/plans",
      icon: PackageIcon,
      isActive: pathname.startsWith("/dashboard/admin/plans"),
    },
    {
      title: "Subscriptions",
      href: "/dashboard/admin/subscriptions",
      icon: RepeatIcon,
      isActive: pathname.startsWith("/dashboard/admin/subscriptions"),
    },
    {
      title: "Audit Log",
      href: "/dashboard/admin/audit-log",
      icon: ScrollTextIcon,
      isActive: pathname.startsWith("/dashboard/admin/audit-log"),
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          teams={teams}
          activeId={activeOrganization?.id ?? teams[0]?.id}
          onSelect={handleSelect}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={item.isActive}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={item.isActive}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
