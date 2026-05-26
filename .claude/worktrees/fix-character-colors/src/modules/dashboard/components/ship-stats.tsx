import { getTranslations } from "next-intl/server"

import type { DashboardStats } from "../types"

type Props = {
  stats: DashboardStats
}

// "Ship stats" — 2 stat tiles in the right aside (XP today + streak).
// Mirrors the design's <StatTile/> usage at the bottom of the Dashboard 3
// aside.
export async function ShipStats({ stats }: Props) {
  const t = await getTranslations("bridge.stats")
  return (
    <>
      <div className="section-title" style={{ marginTop: 8 }}>
        {t("title").toUpperCase()}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <div className="stat-tile xp">
          <img className="icon" src="/icons/xp-bolt.svg" alt="" />
          <div className="lab">{t("xpTodayLabel")}</div>
          <div className="val numeral">{stats.xpToday}</div>
          <div className="delta up">▲ {t("xpTodayDelta", { delta: stats.xpDelta })}</div>
        </div>
        <div className="stat-tile streak">
          <img className="icon" src="/icons/streak-flame.svg" alt="" />
          <div className="lab">{t("streakLabel")}</div>
          <div className="val numeral">
            {t("streakValue", { days: stats.streakDays })}
          </div>
          <div className="delta up">
            ▲ {t("streakDelta", { best: stats.bestStreak })}
          </div>
        </div>
      </div>
    </>
  )
}
