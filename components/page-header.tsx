import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

/**
 * Page chrome: sidebar toggle and the single-word page title. The sidebar
 * carries the hierarchy, so pages show one word instead of breadcrumb
 * chains.
 */
export function PageHeader({ title }: { title: string }) {
  return (
    // h-12 on mobile keeps the row flush with the rail's 48px glyph cell;
    // desktop grows to h-16 (h-12 when the sidebar is collapsed).
    // Hidden on mobile: the icon rail carries the menu toggle, so no title
    // bar is needed there.
    <header className="flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear max-md:hidden md:h-16 md:group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1 max-md:size-9" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-5 data-vertical:self-auto md:data-vertical:h-4"
        />
        <span className="text-base font-medium text-muted-foreground md:text-sm">
          {title}
        </span>
      </div>
    </header>
  );
}
