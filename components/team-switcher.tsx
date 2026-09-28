"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronsUpDownIcon, GalleryVerticalEndIcon, PlusIcon } from "lucide-react"
import { parseOrgRoles } from "@/lib/access"
import { authClient } from "@/lib/auth-client"

export type Workspace = {
  id: string
  name: string
  /** Viewer's role in this workspace; null when unknown or inactive. */
  role: string | null
  /** Organization logo URL, when the workspace has one. */
  logo?: string | null
}

function WorkspaceGlyph({
  logo,
  name,
  className = "size-8 shrink-0",
}: {
  logo?: string | null
  name: string
  className?: string
}) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={`${name} logo`}
        className={`${className} rounded-lg border border-sidebar-border object-cover`}
      />
    )
  }
  return (
    <div
      className={`${className} flex items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground`}
    >
      <GalleryVerticalEndIcon className="size-4" />
    </div>
  )
}

function slugify(value: string) {
  const base =
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "workspace"
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

export function TeamSwitcher({
  teams,
  activeId,
  onSelect,
}: {
  teams: Workspace[]
  activeId?: string
  onSelect?: (id: string) => void
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeTeam = teams.find((team) => team.id === activeId) ?? teams[0]
  if (!activeTeam) {
    return null
  }

  const activeRoles = parseOrgRoles(activeTeam.role)
  const activeRoleLabel = activeRoles[0] ?? "Personal"

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const form = new FormData(e.currentTarget)
    const name = String(form.get("name")).trim()
    if (!name) {
      setPending(false)
      return
    }
    const { data: org, error: createError } = await authClient.organization.create({
      name,
      slug: slugify(name),
    })
    if (createError || !org) {
      setPending(false)
      setError(createError?.message ?? "Failed to create workspace.")
      return
    }
    await authClient.organization.setActive({ organizationId: org.id })
    setPending(false)
    setCreateOpen(false)
    router.refresh()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              />
            }
          >
            <WorkspaceGlyph logo={activeTeam.logo} name={activeTeam.name} />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeTeam.name}</span>
              <span className="truncate text-xs capitalize">{activeRoleLabel}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Workspaces
              </DropdownMenuLabel>
              {teams.map((team, index) => {
                const roles = parseOrgRoles(team.role)
                return (
                  <DropdownMenuItem
                    key={team.id || team.name}
                    onClick={() => onSelect?.(team.id)}
                    className="gap-2 p-2"
                  >
                    <WorkspaceGlyph
                      logo={team.logo}
                      name={team.name}
                      className="size-6"
                    />
                    {team.name}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {roles.length > 0
                        ? roles.join(", ")
                        : `⌘${index + 1}`}
                    </span>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setCreateOpen(true)} className="gap-2 p-2">
              <PlusIcon />
              New workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={createOpen} onOpenChange={setCreateOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create a workspace</AlertDialogTitle>
              <AlertDialogDescription>
                You will be the owner of this workspace.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {error ? (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </p>
            ) : null}
            <form className="flex flex-col gap-4" onSubmit={handleCreate}>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Name
                <input
                  name="name"
                  required
                  placeholder="Acme Corp"
                  className="h-10 rounded-xl border border-zinc-200 bg-transparent px-3 text-sm font-normal outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white"
                />
              </label>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                <AlertDialogAction type="submit" disabled={pending}>
                  {pending ? "Creating…" : "Create workspace"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
