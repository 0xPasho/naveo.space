import { getTranslations } from "next-intl/server"

import { Card, ChunkyProgress, Eyebrow } from "@/common/components/ui"

import type { CatalogSummary } from "../types"

type Props = {
  summary: CatalogSummary
}

// 3 summary tiles in the catalog header (progress · XP · capstones).
export async function SummaryTiles({ summary }: Props) {
  const t = await getTranslations("tracks.list.summary")
  const remainingCapstones = Math.max(
    0,
    summary.capstonesTotal - summary.capstonesDone,
  )
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card className="flex flex-col gap-2 p-4">
        <Eyebrow>{t("progressLabel")}</Eyebrow>
        <span className="font-display font-bold text-xl tracking-tight text-ink-1">
          {t("progressValue", {
            done: summary.progressDone,
            total: summary.progressTotal,
          })}
        </span>
        <ChunkyProgress value={summary.progressPct} tone="primary" />
      </Card>
      <Card className="flex flex-col gap-2 p-4">
        <Eyebrow>{t("xpLabel")}</Eyebrow>
        <span className="font-display font-bold text-2xl tracking-tight text-stat-xp tabular-nums">
          {summary.xpBanked}
        </span>
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
          {t("xpDelta", { delta: summary.xpDelta })}
        </span>
      </Card>
      <Card className="flex flex-col gap-2 p-4">
        <Eyebrow>{t("capstonesLabel")}</Eyebrow>
        <span className="font-display font-bold text-xl tracking-tight text-track-agents tabular-nums">
          {t("capstonesValue", {
            done: summary.capstonesDone,
            total: summary.capstonesTotal,
          })}
        </span>
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
          {t("capstonesDelta", { remaining: remainingCapstones })}
        </span>
      </Card>
    </div>
  )
}
