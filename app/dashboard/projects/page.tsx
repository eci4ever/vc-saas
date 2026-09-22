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

const MOCK_PROJECTS = [
  { name: "Marketing site", status: "Active", updated: "2 hours ago" },
  { name: "Mobile app", status: "Active", updated: "1 day ago" },
  { name: "Internal tools", status: "Archived", updated: "3 weeks ago" },
];

export default function ProjectsPage() {
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
                <BreadcrumbPage>Projects</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground">
              Mock UI — connect a real project store later.
            </p>
          </div>
          <button
            type="button"
            disabled
            title="Mock only"
            className="flex h-9 items-center rounded-full bg-zinc-950 px-4 text-sm font-medium text-white opacity-60 dark:bg-white dark:text-black"
          >
            New project
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {MOCK_PROJECTS.map((project) => (
            <Card key={project.name}>
              <CardHeader>
                <CardTitle className="text-base">{project.name}</CardTitle>
                <CardDescription>Updated {project.updated}</CardDescription>
              </CardHeader>
              <CardContent>
                <span
                  className={
                    project.status === "Active"
                      ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400"
                      : "rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-400"
                  }
                >
                  {project.status}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
