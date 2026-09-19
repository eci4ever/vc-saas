import { headers } from "next/headers"

import { AppSidebar } from "@/components/app-sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { auth } from "@/lib/auth"

type MemberRow = {
  id: string
  role: string
  user: { id: string; name: string; email: string }
}

type TeamRow = {
  id: string
  name: string
}

function initials(name: string, email: string) {
  const fromName = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  if (fromName) return fromName
  return email.slice(0, 2).toUpperCase()
}

export default async function Page() {
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })
  const user = session?.user

  const organizations =
    (await auth.api
      .listOrganizations({ headers: reqHeaders })
      .catch(() => null)) ?? []

  const activeOrgId =
    (
      session?.session as
        | { activeOrganizationId?: string | null }
        | undefined
    )?.activeOrganizationId ??
    organizations[0]?.id ??
    null

  const activeOrg = organizations.find((org) => org.id === activeOrgId) ?? null

  const fullOrg = activeOrgId
    ? await auth.api
        .getFullOrganization({
          headers: reqHeaders,
          query: { organizationId: activeOrgId },
        })
        .catch(() => null)
    : null

  const fullOrgMembers = (fullOrg as { members?: MemberRow[] } | null)
    ?.members
  const members = Array.isArray(fullOrgMembers) ? fullOrgMembers : []

  const teams = activeOrgId
    ? ((await auth.api
        .listOrganizationTeams({
          headers: reqHeaders,
          query: { organizationId: activeOrgId },
        })
        .catch(() => null)) as TeamRow[] | null) ?? []
    : []

  const myRole =
    members.find((member) => member.user.id === user?.id)?.role ?? "—"

  const stats = [
    {
      title: "Team members",
      value: String(members.length),
      description: activeOrg ? `in ${activeOrg.name}` : "No workspace yet",
    },
    {
      title: "Teams",
      value: String(teams.length),
      description:
        teams.length > 0
          ? teams
              .slice(0, 2)
              .map((team) => team.name)
              .join(", ")
          : "No teams yet",
    },
    {
      title: "Your role",
      value: myRole,
      description: user?.email ?? "",
    },
  ]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
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
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeOrg
                ? `Here's what's happening in ${activeOrg.name}.`
                : "Create a workspace to get started."}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader>
                  <CardDescription>{stat.title}</CardDescription>
                  <CardTitle className="text-3xl capitalize">
                    {stat.value}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="truncate text-sm text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Members</CardTitle>
                <CardDescription>
                  Everyone in {activeOrg?.name ?? "this workspace"}.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No members yet.
                  </p>
                ) : (
                  members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3"
                    >
                      <Avatar>
                        <AvatarFallback>
                          {initials(member.user.name, member.user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {member.user.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {member.user.email}
                        </span>
                      </div>
                      <span className="text-xs capitalize text-muted-foreground">
                        {member.role}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Teams</CardTitle>
                <CardDescription>
                  Teams inside {activeOrg?.name ?? "this workspace"}.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {teams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No teams yet.
                  </p>
                ) : (
                  teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{team.name}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
