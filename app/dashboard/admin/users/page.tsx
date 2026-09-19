import { headers } from "next/headers";

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
import { auth } from "@/lib/auth";

import { UserRowActions } from "./user-row-actions";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
  createdAt: Date | string;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ? q.trim() : undefined;

  const result = await auth.api.listUsers({
    headers: await headers(),
    query: {
      searchValue: query,
      searchField: "email",
      limit: 100,
    },
  });

  const users = (result?.users ?? []) as AdminUser[];

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
                <BreadcrumbPage>Admin · Users</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
            <p className="text-sm text-muted-foreground">
              {result?.total ?? users.length} registered users. Manage roles
              and bans.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>All users</CardTitle>
              <CardDescription>Search by email.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <form method="get" className="flex gap-2">
                <input
                  name="q"
                  defaultValue={query ?? ""}
                  placeholder="Search email…"
                  className="h-10 flex-1 rounded-xl border border-zinc-200 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-white/15 dark:focus:border-white"
                />
                <button
                  type="submit"
                  className="flex h-10 items-center rounded-full border border-zinc-200 px-4 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-white/10"
                >
                  Search
                </button>
              </form>
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users found.</p>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-2 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center"
                  >
                    <div className="grid flex-1 leading-tight">
                      <span className="truncate font-medium">
                        {user.name}
                        {user.banned ? (
                          <span className="ml-2 rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-700 dark:text-red-400">
                            banned
                          </span>
                        ) : null}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email} · {user.role ?? "user"}
                      </span>
                    </div>
                    <UserRowActions
                      userId={user.id}
                      role={user.role ?? "user"}
                      banned={!!user.banned}
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
