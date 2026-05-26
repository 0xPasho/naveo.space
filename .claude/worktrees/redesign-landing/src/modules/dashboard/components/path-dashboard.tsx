import { getTranslations } from "next-intl/server"

import { Link } from "@/common/i18n/navigation"
import { Sidebar } from "@/common/layout/sidebar"

import type { Dashboard } from "../types"

type Props = {
  dashboard: Dashboard
}

// Dashboard A — Path-forward (Duolingo-flavored). Ported from the design's
// Dashboard1. The (site) layout already renders the Hud, so this component
// only owns the body row: Sidebar | main | aside.
export async function PathDashboard({ dashboard }: Props) {
  const t = await getTranslations("dashboardPath")
  const tLabels = await getTranslations("dashboardPath.pathLabels")
  const continueAt = dashboard.continueAt
  const continueHref = continueAt
    ? `/tracks/${continueAt.next.trackSlug}/${continueAt.next.courseSlug}/${continueAt.next.stepSlug}`
    : "/tracks"

  // Streak comes from real gamification stats wired through the dashboard
  // service. XP-this-week / xpDelta / echo-pass / capstones / mastery rings
  // remain placeholders until their backends land.
  const xpThisWeek = 320
  const xpDelta = 45
  const streakDays = dashboard.stats.streakDays
  const bestStreak = dashboard.stats.bestStreak
  const echoPassPct = 92
  const echoDelta = 4
  const capstonesDone = 3
  const capstonesTotal = 5
  const capstonesRemaining = capstonesTotal - capstonesDone

  const heroPct = continueAt?.pct ?? 44
  const heroDone = continueAt ? continueAt.stepNumber - 1 : 4
  const heroTotal = continueAt?.totalSteps ?? 9

  return (
    <div className="crew-dashboard">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr 320px",
          minHeight: "100%",
        }}
      >
        <Sidebar compact />

        <main
          style={{
            padding: "24px 32px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            overflow: "hidden",
          }}
        >
          {/* Continue hero */}
          <div className="continue-hero">
            <div>
              <div className="eyebrow">{t("continue.eyebrow")}</div>
              <h1>
                {t("continue.title")}
                <em>{t("continue.titleAccent")}</em>
              </h1>
              <p>{t("continue.body")}</p>
              <div className="progress-row">
                <div className="progress">
                  <b style={{ width: `${heroPct}%` }} />
                </div>
                <div className="progress-num">
                  {t("continue.progressFraction", {
                    pct: heroPct,
                    done: heroDone,
                    total: heroTotal,
                  })}
                </div>
              </div>
              <div className="row">
                <Link href={continueHref} className="btn btn-cta">
                  {t("continue.ctaContinue")}
                </Link>
                <Link href="/tracks" className="btn btn-ghost">
                  {t("continue.ctaPath")}
                </Link>
              </div>
            </div>
            <div className="mascot-frame">
              <img src="/cast/vega.svg" alt="Vega" />
            </div>
          </div>

          {/* 4-up stat tiles */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
            }}
          >
            <div className="stat-tile xp">
              <img className="icon" src="/icons/xp-bolt.svg" alt="" />
              <div className="lab">{t("stats.xpThisWeek")}</div>
              <div className="val numeral">{xpThisWeek}</div>
              <div className="delta up">
                {"▲ "}
                {t("stats.xpDelta", { delta: xpDelta })}
              </div>
            </div>
            <div className="stat-tile streak">
              <img className="icon" src="/icons/streak-flame.svg" alt="" />
              <div className="lab">{t("stats.streakLabel")}</div>
              <div className="val numeral">
                {t("stats.streakValue", { days: streakDays })}
              </div>
              <div className="delta up">
                {"▲ "}
                {t("stats.streakBest", { best: bestStreak })}
              </div>
            </div>
            <div className="stat-tile crew">
              <img className="icon" src="/icons/star.svg" alt="" />
              <div className="lab">{t("stats.echoPassRate")}</div>
              <div className="val numeral">{echoPassPct}%</div>
              <div className="delta up">
                {"▲ "}
                {t("stats.echoDelta", { delta: echoDelta })}
              </div>
            </div>
            <div className="stat-tile boss">
              <img className="icon" src="/icons/mission-target.svg" alt="" />
              <div className="lab">{t("stats.capstones")}</div>
              <div className="val numeral">
                {t("stats.capstonesValue", {
                  done: capstonesDone,
                  total: capstonesTotal,
                })}
              </div>
              <div className="delta dn">
                {"▼ "}
                {t("stats.capstonesRemaining", { n: capstonesRemaining })}
              </div>
            </div>
          </div>

          {/* Mission Path + Daily Quests */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 18,
            }}
          >
            <div className="card">
              <div className="card-h">
                <h3 className="title">{t("missionPath.title")}</h3>
                <Link href="/tracks" className="more">
                  {t("missionPath.openMap")}
                </Link>
              </div>
              <div
                className="path-vert"
                style={{ paddingTop: 4, paddingBottom: 4 }}
              >
                <PathNode
                  kind="done"
                  label={tLabels("helloVega")}
                  stars={3}
                />
                <div className="path-conn" />
                <PathNode kind="done" label={tLabels("tokens")} stars={3} />
                <div className="path-conn" />
                <PathNode kind="done" label={tLabels("roles")} stars={2} />
                <div className="path-conn" />
                <PathNode kind="current" label={tLabels("fewShot")} />
                <div className="path-conn" />
                <PathNode kind="locked" label={tLabels("schemas")} />
                <div className="path-conn" />
                <PathNode kind="boss" label={tLabels("boss")} />
              </div>
            </div>

            <div className="col gap-3">
              <div className="card">
                <div className="card-h">
                  <h3 className="title">{t("quests.title")}</h3>
                  <span className="more">
                    {t("quests.remaining", { n: 3 })}
                  </span>
                </div>
                <div className="quest-list">
                  <Quest
                    icon="/icons/xp-bolt.svg"
                    label={t("quests.earnXp")}
                    sub={t("quests.earnXpSub", { done: 25, total: 50 })}
                    reward={20}
                    pct={0.5}
                  />
                  <Quest
                    icon="/icons/star.svg"
                    label={t("quests.passDrills")}
                    sub={t("quests.passDrillsSub", { done: 2, total: 3 })}
                    reward={30}
                    pct={0.66}
                  />
                  <Quest
                    icon="/icons/mission-target.svg"
                    label={t("quests.clearCapstone")}
                    sub={t("quests.clearCapstoneSub", { done: 0, total: 1 })}
                    reward={60}
                    pct={0}
                  />
                  <Quest
                    icon="/icons/streak-flame.svg"
                    label={t("quests.practice")}
                    sub={t("quests.practiceSub")}
                    reward={15}
                    done
                  />
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Field guide aside */}
        <aside
          style={{
            borderLeft: "1px solid var(--border)",
            background: "var(--bg-soft)",
            padding: 22,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            overflow: "hidden",
          }}
        >
          <div className="section-title">{t("fieldGuide.title")}</div>

          <div
            className="mascot-card"
            style={{ ["--ribbon" as never]: "var(--brand-gold)" }}
          >
            <div className="top">
              <img src="/cast/vega.svg" alt="" />
              <div>
                <div className="role">{t("fieldGuide.vegaRole")}</div>
                <div className="name" style={{ color: "var(--brand-gold)" }}>
                  Vega
                </div>
              </div>
            </div>
            <div className="bubble">{t("fieldGuide.vegaTip")}</div>
          </div>

          <div className="card">
            <div className="card-h">
              <h3 className="title">{t("fieldGuide.masteryTitle")}</h3>
            </div>
            <div className="ring-row" style={{ justifyContent: "space-around" }}>
              <MasteryRing
                pct={0.92}
                label={t("fieldGuide.masteryPrompts")}
                color="var(--brand-gold)"
              />
              <MasteryRing
                pct={0.55}
                label={t("fieldGuide.masteryMcp")}
                color="var(--signal-cyan)"
              />
              <MasteryRing
                pct={0.18}
                label={t("fieldGuide.masteryAgents")}
                color="var(--mission-magenta)"
              />
            </div>
          </div>

          <div className="card sunk" style={{ padding: 14 }}>
            <div className="row spread">
              <div>
                <div className="eyebrow">{t("fieldGuide.tipEyebrow")}</div>
                <div
                  style={{
                    fontSize: 13,
                    marginTop: 6,
                    lineHeight: 1.5,
                    color: "var(--fg-muted)",
                  }}
                >
                  {t("fieldGuide.tipBody")}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// --- Inline subcomponents (presentational, server-safe) ---

type PathNodeKind = "done" | "current" | "locked" | "boss"

const PATH_NODE_ICON: Record<PathNodeKind, string> = {
  done: "/icons/star.svg",
  current: "/icons/xp-bolt.svg",
  locked: "/icons/lock.svg",
  boss: "/icons/mission-target.svg",
}

function PathNode({
  kind,
  label,
  stars,
}: {
  kind: PathNodeKind
  label: string
  stars?: number
}) {
  return (
    <div className={`path-node ${kind}`}>
      <div className="ring2" />
      <img src={PATH_NODE_ICON[kind]} alt="" />
      {stars != null ? (
        <div className="stars">
          {"★".repeat(stars)}
          {"☆".repeat(3 - stars)}
        </div>
      ) : null}
      <div className="label">{label}</div>
    </div>
  )
}

function Quest({
  icon,
  label,
  sub,
  reward,
  pct,
  done,
}: {
  icon: string
  label: string
  sub: string
  reward: number
  pct?: number
  done?: boolean
}) {
  return (
    <div className={"quest" + (done ? " done" : "")}>
      <div className="icon">
        <img src={icon} alt="" />
      </div>
      <div>
        <div className="label">{label}</div>
        <div className="sub">{sub}</div>
      </div>
      <div className="reward">
        <img src="/icons/xp-bolt.svg" alt="" />+{reward}
      </div>
      {!done ? (
        <div className="bar">
          <b style={{ width: `${(pct ?? 0) * 100}%` }} />
        </div>
      ) : null}
    </div>
  )
}

function MasteryRing({
  pct,
  label,
  color,
}: {
  pct: number
  label: string
  color: string
}) {
  const r = 38
  const c = 2 * Math.PI * r
  return (
    <div className="ring" style={{ position: "relative", marginBottom: 18 }}>
      <svg viewBox="0 0 96 96">
        <circle
          cx="48"
          cy="48"
          r={r}
          stroke="oklch(1 0 0 / 8%)"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="48"
          cy="48"
          r={r}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
        />
      </svg>
      <div className="core" style={{ color }}>
        {Math.round(pct * 100)}%
      </div>
      <div className="lab">{label}</div>
    </div>
  )
}
