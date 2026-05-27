import {
  ArrowDownRight,
  ArrowUpRight,
  Bolt,
  Flame,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { getTranslations } from "next-intl/server"

import { cn } from "@/common/lib/utils"

import type { Dashboard } from "../types"

type Props = {
  dashboard: Dashboard
}

type Tone = "xp" | "streak" | "primary" | "agents"

type Cell = {
  tone: Tone
  label: string
  value: string
  delta: { kind: "up" | "down" | "flat"; text: string } | null
  icon: React.ReactNode
}

const TONE_TEXT: Record<Tone, string> = {
  xp: "text-stat-xp",
  streak: "text-stat-streak",
  primary: "text-primary",
  agents: "text-track-agents",
}

const TONE_BORDER: Record<Tone, string> = {
  xp: "border-stat-xp/40",
  streak: "border-stat-streak/40",
  primary: "border-primary/40",
  agents: "border-track-agents/40",
}

const formatSigned = (n: number) => (n > 0 ? `+${n}` : String(n))

export async function StatsStrip({ dashboard }: Props) {
  const t = await getTranslations("bridge.statsStrip")
  const { stats, continueAt } = dashboard

  const xpDeltaKind: "up" | "down" | "flat" =
    stats.xpDelta > 0 ? "up" : stats.xpDelta < 0 ? "down" : "flat"
  const xpWeekDeltaKind: "up" | "down" | "flat" =
    stats.xpWeekDelta > 0 ? "up" : stats.xpWeekDelta < 0 ? "down" : "flat"

  const cells: Cell[] = [
    {
      tone: "xp",
      label: t("xpToday"),
      value: stats.xpToday.toLocaleString(),
      delta:
        xpDeltaKind === "flat"
          ? { kind: "flat", text: t("flatVsYesterday") }
          : {
              kind: xpDeltaKind,
              text: t("vsYesterday", { delta: formatSigned(stats.xpDelta) }),
            },
      icon: <Bolt className="size-4" strokeWidth={2.5} />,
    },
    {
      tone: "streak",
      label: t("streak"),
      value: t("streakValue", { days: stats.streakDays }),
      delta: {
        kind: "flat",
        text: t("streakBest", { best: stats.bestStreak }),
      },
      icon: <Flame className="size-4" strokeWidth={2.5} />,
    },
    {
      tone: "primary",
      label: t("xpThisWeek"),
      value: stats.xpThisWeek.toLocaleString(),
      delta:
        xpWeekDeltaKind === "flat"
          ? { kind: "flat", text: t("flatVsLastWeek") }
          : {
              kind: xpWeekDeltaKind,
              text: t("vsLastWeek", {
                delta: formatSigned(stats.xpWeekDelta),
              }),
            },
      icon: <TrendingUp className="size-4" strokeWidth={2.5} />,
    },
    {
      tone: "agents",
      label: t("nextStep"),
      value: continueAt
        ? `${continueAt.stepNumber}/${continueAt.totalSteps}`
        : t("nextStepEmpty"),
      delta: continueAt
        ? {
            kind: "flat",
            text: t("nextStepProgress", { pct: continueAt.pct }),
          }
        : null,
      icon: <Sparkles className="size-4" strokeWidth={2.5} />,
    },
  ]

  return (
    <section
      aria-label={t("ariaLabel")}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cells.map((cell, i) => (
        <StatCell key={i} cell={cell} />
      ))}
    </section>
  )
}

function StatCell({ cell }: { cell: Cell }) {
  const DeltaIcon =
    cell.delta?.kind === "up"
      ? ArrowUpRight
      : cell.delta?.kind === "down"
        ? ArrowDownRight
        : null

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border-2 bg-bg-surface px-4 py-3.5 shadow-elev-2",
        TONE_BORDER[cell.tone],
      )}
    >
      <div className="relative flex items-center justify-between">
        <span
          className={cn(
            "font-display text-[11px] font-bold uppercase tracking-[0.14em]",
            TONE_TEXT[cell.tone],
          )}
        >
          {cell.label}
        </span>
        <span
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-md bg-bg-raised",
            TONE_TEXT[cell.tone],
          )}
        >
          {cell.icon}
        </span>
      </div>
      <div className="relative mt-2 font-display text-3xl font-bold leading-none tracking-tight tabular-nums text-ink-1">
        {cell.value}
      </div>
      {cell.delta ? (
        <div
          className={cn(
            "relative mt-1.5 flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em]",
            cell.delta.kind === "up"
              ? "text-success"
              : cell.delta.kind === "down"
                ? "text-danger"
                : "text-ink-3",
          )}
        >
          {DeltaIcon ? <DeltaIcon className="size-3.5" strokeWidth={2.5} /> : null}
          <span>{cell.delta.text}</span>
        </div>
      ) : null}
    </div>
  )
}
