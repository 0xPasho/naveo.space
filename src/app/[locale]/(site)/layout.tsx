import type { CSSProperties } from "react"

import {
  SidebarInset,
  SidebarProvider,
} from "@/common/components/ui/sidebar"
import { Hud } from "@/common/layout/hud"
import { SidebarServer } from "@/common/layout/sidebar-server"

type Props = Readonly<{
  children: React.ReactNode
}>

// (site) layout — global chrome. SidebarProvider + Sidebar (left rail) +
// SidebarInset wrapping Hud (64px) + scrollable main. Pages render their
// content directly; they no longer embed their own SidebarServer/SidebarShell.
export default function SiteLayout({ children }: Props) {
  return (
    <SidebarProvider
      className="min-h-dvh bg-bg-deep"
      style={
        {
          "--sidebar-width": "240px",
        } as CSSProperties
      }
    >
      <SidebarServer compact />
      <SidebarInset className="flex h-dvh min-w-0 flex-col overflow-hidden bg-bg-deep">
        <Hud showSidebarTrigger />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
