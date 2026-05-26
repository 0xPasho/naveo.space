import { getLocale, getTranslations } from "next-intl/server"

import type { CSSProperties } from "react"

import { currentUser } from "@/server/auth"
import type { ContentLocale } from "@/modules/content/types"
import { HEARTS_MAX_DEFAULT } from "@/modules/economy/data"
import { getWallet } from "@/modules/economy/service"
import {
  getStreakWeek,
  getXpSnapshot,
  type StreakWeekDay,
} from "@/modules/gamification/service"
import { getOrCreateUser, getUserStats } from "@/modules/users/service"

import { CrewCard } from "./crew-card"
import { DASHBOARD_CREW } from "../data"

// Bridge / Mission control dashboard (Variant B). Telemetry-heavy: bridge
// banner with status + telemetry strip, full crew grid, then weekly chart +
// streak grid + practice rail. Mirrors Dashboard2 from the design package
// (main-screens/project/components/Dashboards.jsx, lines 104-222).
//
// The (site) layout already renders <Hud>, so we don't repeat it here. The
// outer .crew-dashboard wrapper scopes the design's CSS (see styles.css).

const TELEMETRY_STAT_VAL_STYLE: CSSProperties = {
  fontWeight: 700,
  fontSize: 18,
  fontFeatureSettings: '"tnum"',
}

const TELEMETRY_LABEL_STYLE: CSSProperties = {
  fontSize: 9.5,
  letterSpacing: ".18em",
  color: "var(--fg-dim)",
}

// 7-bar histogram. Saturday (index 5) is the highlighted day in the design.
const WEEKLY_BARS: readonly number[] = [20, 30, 55, 40, 70, 85, 60]
const HIGHLIGHT_BAR_INDEX = 5

// Mon-to-Sun labels matching the design.
const STREAK_LABELS: readonly string[] = ["M", "T", "W", "T", "F", "S", "S"]

type StreakWeekProps = {
  days: readonly StreakWeekDay[]
}

function StreakWeek({ days }: StreakWeekProps) {
  return (
    <div className="streak-grid">
      {STREAK_LABELS.map((d, i) => {
        const state = days[i] ?? "future"
        const cls =
          "streak-day" +
          (state === "done" ? " done" : "") +
          (state === "today" ? " today" : "")
        return (
          <div key={i} className={cls}>
            <span className="lab">{d}</span>
          </div>
        )
      })}
    </div>
  )
}

export async function BridgeDashboard() {
  const t = await getTranslations("dashboardBridge")
  const tWeekly = await getTranslations("dashboardBridge.weekly")
  // tWeekly.raw("days") returns the array literally from the messages file.
  const days = tWeekly.raw("days") as string[]

  const clerkUser = await currentUser()
  let xp = 0
  let streakDays = 0
  let streakWeek: { days: StreakWeekDay[]; todayIdx: number } = {
    days: ["future", "future", "future", "future", "future", "future", "future"],
    todayIdx: 0,
  }
  let gems = 0
  let hearts = HEARTS_MAX_DEFAULT
  let heartsMax = HEARTS_MAX_DEFAULT
  if (clerkUser) {
    const locale = (await getLocale()) as ContentLocale
    const user = await getOrCreateUser(clerkUser.id)
    const [stats, snap, week, wallet] = await Promise.all([
      getUserStats(user.id, locale),
      getXpSnapshot(user.id),
      getStreakWeek(user.id),
      getWallet(user.id),
    ])
    xp = stats.xp
    streakDays = snap.dailyStreak
    streakWeek = week
    gems = wallet.gems
    hearts = wallet.hearts
    heartsMax = wallet.heartsMax
  }

  const telemetry: Array<{ label: string; value: string; color: string }> = [
    { label: t("telemetry.xp"), value: xp.toLocaleString(), color: "var(--xp-gold)" },
    { label: t("telemetry.streak"), value: `${streakDays}d`, color: "var(--forge-orange)" },
    { label: t("telemetry.gems"), value: gems.toLocaleString(), color: "var(--plasma-violet)" },
    {
      label: t("telemetry.hearts"),
      value: `${hearts} / ${heartsMax}`,
      color: "var(--hazard-red)",
    },
    {
      label: t("telemetry.rank"),
      value: t("telemetry.rankValue"),
      color: "var(--brand-cyan)",
    },
    {
      label: t("telemetry.nextLv"),
      value: t("telemetry.nextLvValue"),
      color: "var(--crew-green)",
    },
  ]

  const practice: Array<{
    kind: string
    label: string
    color: string
    xp: string
  }> = [
    {
      kind: t("practice.drill"),
      label: t("practice.drillLabel"),
      color: "var(--signal-cyan)",
      xp: "+40 XP",
    },
    {
      kind: t("practice.build"),
      label: t("practice.buildLabel"),
      color: "var(--brand-gold)",
      xp: "+60 XP",
    },
    {
      kind: t("practice.chat"),
      label: t("practice.chatLabel"),
      color: "var(--crew-green)",
      xp: "+50 XP",
    },
    {
      kind: t("practice.tool"),
      label: t("practice.toolLabel"),
      color: "var(--mission-magenta)",
      xp: "+80 XP",
    },
  ]

  return (
    <div className="crew-dashboard">
      <main
        style={{
          padding: "20px 32px 24px",
          display: "grid",
          gridTemplateRows: "auto auto 1fr",
          gap: 14,
        }}
      >
        {/* Bridge banner */}
        <div
          className="card"
          style={{
            padding: 0,
            overflow: "hidden",
            background:
              "linear-gradient(135deg, oklch(0.20 0.05 240), oklch(0.13 0.03 240))",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 18,
              padding: 22,
              alignItems: "center",
            }}
          >
            <div>
              <div className="eyebrow">{t("banner.eyebrow")}</div>
              <h1
                style={{
                  fontSize: 28,
                  margin: "6px 0 4px",
                  letterSpacing: "-.03em",
                }}
              >
                {t.rich("banner.title", {
                  mentor: () => (
                    <span style={{ color: "var(--brand-gold)" }}>
                      {t("banner.mentorName")}
                    </span>
                  ),
                })}
              </h1>
              <p
                style={{
                  color: "var(--fg-muted)",
                  margin: 0,
                  fontSize: 14,
                }}
              >
                {t.rich("banner.statusBody", {
                  online: () => (
                    <span style={{ color: "var(--crew-green)" }}>
                      {t("banner.statusOnline")}
                    </span>
                  ),
                })}
              </p>
            </div>
            <div className="row gap-2">
              <button className="btn btn-cta">{t("banner.ctaResume")}</button>
              <button className="btn btn-ghost btn-sm">
                {t("banner.ctaBrief")}
              </button>
            </div>
          </div>

          {/* Telemetry strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              borderTop: "1px solid var(--border)",
            }}
          >
            {telemetry.map((cell, i) => (
              <div
                key={cell.label}
                style={{
                  padding: "12px 16px",
                  borderLeft: i ? "1px solid var(--border)" : "0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div className="hud" style={TELEMETRY_LABEL_STYLE}>
                  {cell.label}
                </div>
                <div style={{ ...TELEMETRY_STAT_VAL_STYLE, color: cell.color }}>
                  {cell.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crew grid */}
        <div className="card" style={{ padding: 18 }}>
          <div className="card-h">
            <h3 className="title">
              {t("crew.title")} ·{" "}
              <span className="accent">{t("crew.subtitle")}</span>
            </h3>
            <button className="more">{t("crew.openDossiers")}</button>
          </div>
          <div className="crew-grid">
            {DASHBOARD_CREW.map((member) => (
              <CrewCard key={member.slug} member={member} />
            ))}
          </div>
        </div>

        {/* Lower row: weekly chart · streak block · practice rail */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 1fr 1fr",
            gap: 14,
            minHeight: 0,
          }}
        >
          {/* Weekly bar chart */}
          <div className="card">
            <div className="card-h">
              <h3 className="title">{t("weekly.title")}</h3>
              <button className="more">{t("weekly.range")}</button>
            </div>
            <svg
              viewBox="0 0 320 100"
              style={{ width: "100%", height: 100, overflow: "visible" }}
            >
              <defs>
                <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="oklch(0.82 0.17 85 / 0.5)"
                  />
                  <stop
                    offset="100%"
                    stopColor="oklch(0.82 0.17 85 / 0)"
                  />
                </linearGradient>
              </defs>
              {WEEKLY_BARS.map((v, i) => {
                const isHighlight = i === HIGHLIGHT_BAR_INDEX
                return (
                  <rect
                    key={i}
                    x={i * 44 + 8}
                    y={100 - v}
                    width="32"
                    height={v}
                    rx="6"
                    fill={
                      isHighlight
                        ? "var(--xp-gold)"
                        : "oklch(.82 .17 85 / .35)"
                    }
                    stroke={isHighlight ? "var(--xp-gold-deep)" : "none"}
                    strokeWidth="1"
                  />
                )
              })}
            </svg>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                marginTop: 4,
              }}
            >
              {days.map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    letterSpacing: ".14em",
                    color: "var(--fg-dim)",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>

          {/* 12-day streak grid */}
          <div className="card">
            <div className="card-h">
              <h3 className="title">{t("streakBlock.title")}</h3>
              <button className="more">{t("streakBlock.freeze")}</button>
            </div>
            <StreakWeek days={streakWeek.days} />
            <div
              style={{
                marginTop: 14,
                padding: 12,
                background: "var(--card-sunk)",
                borderRadius: 12,
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <img
                src="/icons/streak-flame.svg"
                alt=""
                style={{ width: 28, height: 28 }}
              />
              <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                <div
                  style={{
                    fontWeight: 700,
                    color: "var(--forge-orange)",
                    fontSize: 14,
                  }}
                >
                  {t("streakBlock.noBreak")}
                </div>
                {t.rich("streakBlock.noBreakBody", {
                  time: () => (
                    <b style={{ color: "var(--fg)" }}>4h 22m</b>
                  ),
                })}
              </div>
            </div>
          </div>

          {/* Practice rail */}
          <div className="card">
            <div className="card-h">
              <h3 className="title">{t("practice.title")}</h3>
              <button className="more">{t("practice.shuffle")}</button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {practice.map((row) => (
                <div
                  key={row.kind}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 10,
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "var(--card-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 9.5,
                      letterSpacing: ".15em",
                      padding: "3px 7px",
                      borderRadius: 6,
                      color: row.color,
                      border: `1px solid ${row.color}`,
                      background: "var(--card-sunk)",
                    }}
                  >
                    {row.kind}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {row.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10.5,
                      color: "var(--xp-gold)",
                    }}
                  >
                    {row.xp}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

