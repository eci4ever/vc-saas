import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

/**
 * Page chrome: sidebar toggle and the single-word page title. The sidebar
 * carries the hierarchy, so pages show one word instead of breadcrumb
 * chains.
 */
export function PageHeader({ title }: { title: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
      </div>
    </header>
  );
}
