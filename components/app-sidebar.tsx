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
import { LayoutDashboardIcon, SettingsIcon, ShieldIcon } from "lucide-react"

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
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Dashboard"
                  isActive={pathname === "/dashboard"}
                  render={<Link href="/dashboard" />}
                >
                  <LayoutDashboardIcon />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Settings"
                  isActive={pathname.startsWith("/dashboard/settings")}
                  render={<Link href="/dashboard/settings" />}
                >
                  <SettingsIcon />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Admin"
                    isActive={pathname.startsWith("/dashboard/admin")}
                    render={<Link href="/dashboard/admin/users" />}
                  >
                    <ShieldIcon />
                    <span>Admin</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
