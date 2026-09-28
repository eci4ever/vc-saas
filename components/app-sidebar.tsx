"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
import {
  NAV_GROUP_LABELS,
  NAV_ITEMS,
  isPlatformAdmin,
  type NavGroup,
} from "@/lib/access"
import { authClient } from "@/lib/auth-client"

const GROUP_ORDER: NavGroup[] = ["workspace", "manage", "administration"]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const { data: organizations } = authClient.useListOrganizations()
  const { data: activeOrganization } = authClient.useActiveOrganization()
  const { data: activeMember } = authClient.useActiveMember()

  const platformAdmin = isPlatformAdmin(
    (session?.user as { role?: string } | undefined)?.role
  )
  const orgRole =
    (activeMember as { role?: string | null } | undefined)?.role ?? null

  const teams =
    organizations && organizations.length > 0
      ? organizations.map((org) => ({
          id: org.id,
          name: org.name,
          role: org.id === activeOrganization?.id ? orgRole : null,
          logo: (org as { logo?: string | null }).logo ?? null,
        }))
      : [{ id: "", name: "Personal", role: null, logo: null }]

  async function handleSelect(id: string) {
    if (!id) return
    await authClient.organization.setActive({ organizationId: id })
    router.refresh()
  }

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.visible({ isPlatformAdmin: platformAdmin, orgRole })
  )

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
        {GROUP_ORDER.map((group) => {
          const items = visibleItems.filter((item) => item.group === group)
          if (items.length === 0) return null
          return (
            <SidebarGroup key={group}>
              <SidebarGroupLabel>{NAV_GROUP_LABELS[group]}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const active =
                      item.href === "/app"
                        ? pathname === "/app"
                        : pathname.startsWith(item.href)
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={active}
                          render={<Link href={item.href} />}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
