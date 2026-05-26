import { Sidebar } from "@/common/layout/sidebar"

type Props = {
  children: React.ReactNode
  // Class for the scrollable main column. "catalog-main" is the default
  // (catalog / workbench / coming-soon). The course-detail page uses
  // "detail-main" for slightly different padding/gap rules.
  mainClass?: "catalog-main" | "detail-main"
}

// SidebarShell — shared scaffolding for (site) pages that opt into the left
// sidebar. Wraps `Sidebar` plus a scrollable main column under the standard
// `.crew-catalog .catalog-shell` grid. Use this instead of repeating the
// shell markup in every page.
export function SidebarShell({ children, mainClass = "catalog-main" }: Props) {
  return (
    <div className="crew-catalog">
      <div className="catalog-shell">
        <Sidebar compact />
        <div className={mainClass}>{children}</div>
      </div>
    </div>
  )
}
