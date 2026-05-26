import "@/common/layout/styles.css"

import { Hud } from "@/common/layout/hud"

type Props = Readonly<{
  children: React.ReactNode
}>

// (site) layout — design's global chrome. Hud (64px) sits on top; pages fill
// the remaining row. Pages opt in to the left Sidebar themselves (catalog,
// course detail) since not every (site) screen has it (e.g. dashboard does
// not). The lesson player lives in the (player) group and skips this chrome.
export default function SiteLayout({ children }: Props) {
  return (
    <div className="crew-shell">
      <Hud />
      <main>{children}</main>
    </div>
  )
}
