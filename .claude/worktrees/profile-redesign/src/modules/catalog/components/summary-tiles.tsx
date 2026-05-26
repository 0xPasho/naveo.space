import { getTranslations } from "next-intl/server"

import type { CatalogSummary } from "../types"

type Props = {
  summary: CatalogSummary
}

// 3 summary tiles in the catalog header (progress · XP · capstones).
// Mirrors the design's `<div class="catalog-summary">` block.
export async function SummaryTiles({ summary }: Props) {
  const t = await getTranslations("tracks.list.summary")
  const remainingCapstones = Math.max(
    0,
    summary.capstonesTotal - summary.capstonesDone,
  )
  return (
    <div className="catalog-summary">
      <div className="summary-tile">
        <span className="lab">{t("progressLabel")}</span>
        <span className="val">
          {t("progressValue", {
            done: summary.progressDone,
            total: summary.progressTotal,
          })}
        </span>
        <div className="progress thin">
          <b style={{ width: `${summary.progressPct}%` }} />
        </div>
      </div>
      <div className="summary-tile">
        <span className="lab">{t("xpLabel")}</span>
        <span className="val gold">{summary.xpBanked}</span>
        <span className="delta">{t("xpDelta", { delta: summary.xpDelta })}</span>
      </div>
      <div className="summary-tile">
        <span className="lab">{t("capstonesLabel")}</span>
        <span className="val mag">
          {t("capstonesValue", {
            done: summary.capstonesDone,
            total: summary.capstonesTotal,
          })}
        </span>
        <span className="delta dim">
          {t("capstonesDelta", { remaining: remainingCapstones })}
        </span>
      </div>
    </div>
  )
}
