import { Flame as FlameIcon, Zap as ZapIcon } from "lucide-react"
import { getLocale, getTranslations } from "next-intl/server"

import {
  Button,
  Card,
  Chip,
  DialogBubble,
  Eyebrow,
  StreakGrid,
  type StreakIntensity,
  XpChart,
} from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { cn } from "@/common/lib/utils"
import type { ContentLocale } from "@/modules/content/types"
import { CrewCharacter, toCrewSlug } from "@/modules/crew"
import { DAILY_QUEST_XP_PASS } from "@/modules/daily-quest/data"
import { getOrAssignDailyQuest } from "@/modules/daily-quest/service"
import type { AssignedDailyQuest } from "@/modules/daily-quest/types"
import { getWallet } from "@/modules/economy/service"
import {
  getRealXpPerDay,
  getStreakWeek,
  getXpSnapshot,
  type StreakWeekDay,
} from "@/modules/gamification/service"
import { getPracticeRail } from "@/modules/practice/service"
import {
  PRACTICE_RAIL_ORDER,
  type PracticeItem,
  type PracticeRailKind,
} from "@/modules/practice/types"
import {
  getNextActionForUser,
  getOrCreateUser,
} from "@/modules/users/service"
import type { NextAction } from "@/modules/users/types"
import { currentUser } from "@/server/auth"

import { DASHBOARD_CREW } from "../data"
import type { CrewTone, DashboardCrewMember } from "../types"
import { ShipProgress } from "./ship-progress"

/* Bridge / Mission control dashboard (Variant B).
   Duolingo-style dark layout: mascot-forward hero, compact HUD,
   one primary CTA per block, generous gaps, big typography. */

const STREAK_LABELS: readonly string[] = ["M", "T", "W", "T", "F", "S", "S"]

const PRACTICE_TONE: Record<
  PracticeRailKind,
  "prompting" | "mcp" | "skills" | "agents"
> = {
  drill: "prompting",
  build: "skills",
  chat: "agents",
  tool: "mcp",
}

export async function BridgeDashboard() {
  const t = await getTranslations("dashboardBridge")
  const tWeekly = await getTranslations("dashboardBridge.weekly")
  const days = tWeekly.raw("days") as string[]

  const clerkUser = await currentUser()
  let streakDays = 0
  let streakWeek: { days: StreakWeekDay[]; todayIdx: number } = {
    days: ["future", "future", "future", "future", "future", "future", "future"],
    todayIdx: 0,
  }
  let railItems: Partial<Record<PracticeRailKind, PracticeItem>> = {}
  let weeklyBars: number[] = [0, 0, 0, 0, 0, 0, 0]
  let userId: string | null = null
  let daily: AssignedDailyQuest | null = null
  let nextAction: NextAction | null = null
  let streakFreezes = 0

  if (clerkUser) {
    const locale = (await getLocale()) as ContentLocale
    const user = await getOrCreateUser(clerkUser.id)
    userId = user.id

    const todayUtc = new Date()
    todayUtc.setUTCHours(0, 0, 0, 0)
    const dow = (todayUtc.getUTCDay() + 6) % 7
    const weekStart = new Date(todayUtc)
    weekStart.setUTCDate(weekStart.getUTCDate() - dow)

    const [snap, week, rail, bars, dailyResult, action, wallet] =
      await Promise.all([
        getXpSnapshot(user.id),
        getStreakWeek(user.id),
        getPracticeRail(user.id, locale),
        getRealXpPerDay({
          userId: user.id,
          locale,
          days: 7,
          firstDayStart: weekStart,
        }),
        getOrAssignDailyQuest(user.id, locale),
        getNextActionForUser(user.id, locale),
        getWallet(user.id),
      ])
    streakDays = snap.dailyStreak
    streakWeek = week
    railItems = rail.items
    weeklyBars = bars
    daily = dailyResult
    nextAction = action
    streakFreezes = wallet.streakFreezes
  }

  const todayIdx = streakWeek.todayIdx

  const railKindLabel: Record<PracticeRailKind, string> = {
    drill: t("practice.drill"),
    build: t("practice.build"),
    chat: t("practice.chat"),
    tool: t("practice.tool"),
  }
  // Only surface rail kinds that have a REAL item to retry. The previous
  // version always rendered all four rails and substituted hardcoded
  // placeholder copy ("Arregla 5 prompts difusos") for empty buckets, which
  // looked like content the user could click. With nothing to retry the
  // card now shows a single honest empty row + the "abrir cola" CTA still
  // routes to /practice, where the daily quest is the actual next action.
  const practiceRows = PRACTICE_RAIL_ORDER.flatMap((kind) => {
    const item = railItems[kind]
    if (!item) return []
    return [
      {
        kind,
        tone: PRACTICE_TONE[kind],
        kindLabel: railKindLabel[kind],
        label: item.stepTitle,
        xpLabel: `+${item.xpReward} XP`,
        href:
          `/tracks/${item.trackSlug}/${item.courseSlug}/${item.stepSlug}` as const,
      },
    ]
  })

  const streakHeatmap: StreakIntensity[] = streakWeek.days.map((d) => {
    if (d === "done") return 3
    if (d === "today") return 1
    return 0
  }) as StreakIntensity[]

  const xpDays = weeklyBars.map((value, i) => ({
    label: days[i] ?? STREAK_LABELS[i],
    value,
    isToday: i === todayIdx,
  }))

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 pb-12 pt-6 md:px-8">
      {/* Mascot-forward hero — big crew character + dialog bubble + ONE CTA.
          HUD pills live in the top Hud (layout), no duplication here. */}
      <section className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-bg-surface p-7">
        <div className="flex flex-col items-center gap-5 md:flex-row md:items-start md:gap-7">
          <div className="size-32 shrink-0 md:size-36">
            <CrewCharacter slug="echo" size="full" title="Echo" />
          </div>
          <div className="flex-1">
            <DialogBubble className="max-w-none" tailSide="left">
              <Eyebrow className="mb-2 text-primary">
                {t("banner.eyebrow")}
              </Eyebrow>
              <div className="font-display text-2xl font-bold leading-tight tracking-tight text-ink-1 md:text-3xl">
                {t.rich("banner.title", {
                  mentor: (chunks) => (
                    <span className="text-stat-xp">{chunks}</span>
                  ),
                })}
              </div>
              <p className="mt-2 font-sans text-sm font-semibold leading-relaxed text-ink-2">
                {t.rich("banner.statusBody", {
                  online: (chunks) => (
                    <span className="text-success">{chunks}</span>
                  ),
                })}
              </p>
            </DialogBubble>
          </div>
        </div>
        <div className="mt-6 flex justify-center md:justify-start md:pl-44">
          <ResumeButton
            action={nextAction}
            stepLabel={t("banner.ctaResume")}
            dailyLabel={t("banner.ctaResumeDaily")}
          />
        </div>
      </section>

      {/* Ship progress — one row per track */}
      <ShipProgress userId={userId} />

      {/* Crew row */}
      <section className="flex flex-col gap-4">
        <Eyebrow>
          {t("crew.title")} ·{" "}
          <span className="text-primary">{t("crew.subtitle")}</span>
        </Eyebrow>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DASHBOARD_CREW.map((member) => (
            <CrewTile key={member.slug} member={member} />
          ))}
        </div>
      </section>

      {/* Daily mission banner — 1-minute exercise the user does every day to
          hold the streak. Only renders for signed-in users with a populated
          daily pool in their locale. */}
      {daily ? <DailyMissionBanner daily={daily} /> : null}

      {/* Lower row — weekly XP · streak · practice rail */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr_1fr]">
        <Card className="flex flex-col gap-4 p-6">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <Eyebrow>{t("weekly.title")}</Eyebrow>
              <div className="mt-1.5 font-display font-bold text-3xl tracking-tight text-ink-1">
                {weeklyBars.reduce((a, b) => a + b, 0).toLocaleString()}{" "}
                <span className="text-base text-ink-3">XP</span>
              </div>
            </div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
              {t("weekly.range")}
            </span>
          </div>
          <XpChart days={xpDays} height={120} />
        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <Eyebrow>{t("streakBlock.title")}</Eyebrow>
              <div className="mt-1.5 flex items-center gap-2 font-display font-bold text-3xl tracking-tight text-ink-1">
                {streakDays}
                <FlameIcon className="size-6 text-stat-streak" strokeWidth={2.5} />
              </div>
            </div>
            {streakFreezes > 0 ? (
              <Chip tone="warn">
                {t("streakBlock.freeze", { count: streakFreezes })}
              </Chip>
            ) : null}
          </div>
          <StreakGrid cellSize={28} weeks={[streakHeatmap]} />
          <div className="grid grid-cols-7 gap-1.5">
            {STREAK_LABELS.map((d, i) => (
              <span
                key={i}
                className={cn(
                  "text-center font-display font-bold text-[10px] uppercase tracking-wide",
                  i === todayIdx ? "text-stat-streak" : "text-ink-3",
                )}
              >
                {d}
              </span>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <Eyebrow>{t("practice.title")}</Eyebrow>
          {practiceRows.length === 0 ? (
            <p className="font-sans text-sm font-semibold text-ink-3">
              {t("practice.empty")}
            </p>
          ) : null}
          <ul className="flex flex-col gap-2">
            {practiceRows.map((row) => (
              <li key={row.kind}>
                <PracticeRow
                  tone={row.tone}
                  kindLabel={row.kindLabel}
                  label={row.label}
                  xpLabel={row.xpLabel}
                  href={row.href}
                />
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-2">
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              render={<Link href="/practice" />}
            >
              {t("practice.openQueue")}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ------------------------------ resume cta ----------------------------- */

// Routes the hero "Retomar turno" button to the right place based on whether
// the user has an in-flight track step or only a daily-quest left to do.
// Falls back to disabled when there's nothing to resume.
function ResumeButton({
  action,
  stepLabel,
  dailyLabel,
}: {
  action: NextAction | null
  stepLabel: string
  dailyLabel: string
}) {
  if (!action) {
    return (
      <Button size="lg" disabled>
        {stepLabel}
      </Button>
    )
  }
  if (action.kind === "step") {
    const href =
      `/tracks/${action.step.trackSlug}/${action.step.courseSlug}/${action.step.stepSlug}` as const
    return (
      <Button size="lg" render={<Link href={href} />}>
        {stepLabel}
      </Button>
    )
  }
  return (
    <Button size="lg" render={<Link href="/practice/daily" />}>
      {dailyLabel}
    </Button>
  )
}

/* --------------------------- daily mission --------------------------- */

async function DailyMissionBanner({ daily }: { daily: AssignedDailyQuest }) {
  const t = await getTranslations("dashboardBridge.daily")
  const done = daily.passed
  return (
    <Card
      className={cn(
        "flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:gap-6",
        done ? "border-success/30" : "border-primary/30",
      )}
    >
      <div
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-lg shadow-elev-2",
          done ? "bg-success text-bg-deep" : "bg-primary text-primary-foreground",
        )}
      >
        <ZapIcon className="size-6" strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Eyebrow className={done ? "text-success" : "text-primary"}>
            {t("eyebrow")}
          </Eyebrow>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
            {t("sceneCount", { count: daily.quest.frontMatter.scenes.length })}
          </span>
          {done ? <Chip tone="success">{t("doneChip")}</Chip> : null}
        </div>
        <div className="mt-1.5 font-display font-bold text-lg leading-tight tracking-tight text-ink-1 md:text-xl">
          {daily.quest.title}
        </div>
        {daily.quest.frontMatter.intro ? (
          <p className="mt-1 max-w-[60ch] font-sans text-sm font-semibold leading-relaxed text-ink-3 whitespace-pre-line">
            {daily.quest.frontMatter.intro}
          </p>
        ) : null}
      </div>
      <div className="flex flex-row items-center gap-3 md:flex-col md:items-end md:gap-2">
        <span className="font-mono text-[11px] font-bold tabular-nums text-stat-xp">
          +{DAILY_QUEST_XP_PASS} XP
        </span>
        <Button
          variant={done ? "outline" : "default"}
          size="default"
          render={<Link href="/practice/daily" />}
        >
          {done ? t("ctaReplay") : t("ctaStart")}
        </Button>
      </div>
    </Card>
  )
}

/* ----------------------------- crew tile ----------------------------- */

const CREW_BORDER: Record<CrewTone, string> = {
  prompting: "border-track-prompting/35",
  mcp: "border-track-mcp/35",
  skills: "border-track-skills/35",
  agents: "border-track-agents/35",
  tooling: "border-track-tooling/35",
  evals: "border-track-evals/35",
}

async function CrewTile({ member }: { member: DashboardCrewMember }) {
  const t = await getTranslations("bridge.crew")
  const slug = toCrewSlug(member.slug)
  const role = t(`roles.${member.roleKey}` as never)

  return (
    <Card
      className={cn(
        "relative flex flex-col items-center gap-3 p-6 text-center",
        member.locked && "opacity-50 grayscale",
      )}
    >
      <div
        className={cn(
          "grid size-20 place-items-center overflow-hidden rounded-full border-2 bg-bg-sunken",
          CREW_BORDER[member.tone],
        )}
      >
        {slug ? <CrewCharacter slug={slug} size="full" title={member.name} /> : null}
      </div>
      <div className="font-display font-bold text-lg leading-tight text-ink-1">
        {member.name}
      </div>
      <Chip tone={member.tone}>{role}</Chip>
      {member.locked ? (
        <Chip tone="outline" className="mt-1">
          {t("locked")}
        </Chip>
      ) : null}
    </Card>
  )
}

/* ----------------------------- practice row ----------------------------- */

type PracticeRowProps = {
  tone: "prompting" | "mcp" | "skills" | "agents"
  kindLabel: string
  label: string
  xpLabel: string
  href: `/tracks/${string}/${string}/${string}` | null
}

function PracticeRow({
  tone,
  kindLabel,
  label,
  xpLabel,
  href,
}: PracticeRowProps) {
  const inner = (
    <>
      <Chip tone={tone}>{kindLabel}</Chip>
      <div className="flex-1 truncate font-display font-bold text-sm text-ink-1">
        {label}
      </div>
      <span className="font-mono text-[11px] font-bold tabular-nums text-stat-xp">
        {xpLabel}
      </span>
    </>
  )
  const base =
    "flex items-center gap-3 rounded-lg bg-bg-raised px-3.5 py-2.5 transition-colors"
  if (href) {
    return (
      <Link href={href} className={cn(base, "hover:bg-bg-surface")}>
        {inner}
      </Link>
    )
  }
  return <div className={cn(base, "opacity-60")}>{inner}</div>
}
