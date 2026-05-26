import { setRequestLocale } from "next-intl/server"

import "@/modules/dashboard/styles.css"

import type { ContentLocale } from "@/modules/content/types"
import { BridgeDashboard } from "@/modules/dashboard/components/bridge-dashboard"

type Props = {
  params: Promise<{ locale: ContentLocale }>
}

// Bridge / Mission control dashboard (Variant B). Telemetry-heavy variant —
// ported from the design's Dashboard2 (main-screens/project/components/
// Dashboards.jsx, lines 104-222). The (site) layout already renders the Hud,
// so the page only renders the body.
export default async function BridgePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return <BridgeDashboard />
}
