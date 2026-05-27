import { Flame } from "lucide-react"
import { getTranslations } from "next-intl/server"

import {
  Card,
  Chip,
  Eyebrow,
  StreakGrid,
  type StreakIntensity,
  XpChart,
} from "@/common/components/ui"
import { cn } from "@/common/lib/utils"

import type { Dashboard } from "../types"

type Props = {
  dashboard: Dashboard
}

export async function WeeklyInsights({ dashboard }: Props) {
  const t = await getTranslations("bridge.insights")
  const dayLabels = t.raw("days") as string[]

  const xpDays = dashboard.week.xpByDay.map((value, i) => ({
    label: dayLabels[i] ?? "",
    value,
    isToday: i === dashboard.week.todayIdx,
  }))

  const heatmap: StreakIntensity[] = dashboard.week.streak.map((day) => {
    if (day === "done") return 3
    if (day === "today") return 1
    return 0
  })

  const weekTotal = dashboard.week.xpByDay.reduce((a, b) => a + b, 0)
  const activeDays = dashboard.week.streak.filter((d) => d === "done").length

  return (
    <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <Eyebrow className="text-stat-xp">{t("xp.eyebrow")}</Eyebrow>
            <div className="mt-1.5 font-display text-3xl font-bold leading-none tracking-tight tabular-nums text-ink-1">
              {weekTotal.toLocaleString()}
              <span className="ml-2 text-base font-bold text-ink-3">
                {t("xp.unit")}
              </span>
            </div>
          </div>
          <Chip tone="xp">{t("xp.range")}</Chip>
        </div>
        <XpChart days={xpDays} height={130} />
      </Card>

      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <Eyebrow className="text-stat-streak">
              {t("streak.eyebrow")}
            </Eyebrow>
            <div className="mt-1.5 flex items-center gap-2 font-display text-3xl font-bold leading-none tracking-tight tabular-nums text-ink-1">
              {dashboard.stats.streakDays}
              <Flame
                className="size-6 text-stat-streak"
                strokeWidth={2.5}
              />
            </div>
          </div>
          <Chip tone="streak">
            {t("streak.activeDays", { count: activeDays })}
          </Chip>
        </div>
        <div className="flex flex-col gap-2">
          <StreakGrid cellSize={28} weeks={[heatmap]} />
          <div className="grid grid-cols-7 gap-1.5">
            {dayLabels.map((label, i) => (
              <span
                key={i}
                className={cn(
                  "text-center font-display text-[10px] font-bold uppercase tracking-wide",
                  i === dashboard.week.todayIdx
                    ? "text-stat-streak"
                    : "text-ink-3",
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-auto font-sans text-xs font-semibold leading-relaxed text-ink-3">
          {t("streak.foot", { best: dashboard.stats.bestStreak })}
        </p>
      </Card>
    </section>
  )
}
