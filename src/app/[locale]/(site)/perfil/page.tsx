import { Bolt, Flame, Star } from "lucide-react"
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server"
import { clerkClient } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"

import { SignInPrompt } from "@/common/components/sign-in-prompt"
import {
  Card,
  Chip,
  ChunkyProgress,
  DialogBubble,
  Eyebrow,
  StatTile,
} from "@/common/components/ui"
import { CAST } from "@/modules/cast/data"
import { cn } from "@/common/lib/utils"
import type { ContentLocale } from "@/modules/content/types"
import { CrewCharacter, CrewLessonsDialog } from "@/modules/crew"
import type { CrewSlug } from "@/modules/crew"
import { listCrewLessonsBySlug } from "@/modules/crew/lessons"
import type { CrewLessonMap } from "@/modules/crew/lessons"
import { getXpSnapshot } from "@/modules/gamification/service"
import { getEarnedBadges } from "@/modules/progress/service"
import type { CourseBadge } from "@/modules/progress/types"
import { ActivityLogDialog } from "@/modules/users/components/activity-log-dialog"
import { SignOutLink } from "@/modules/users/components/sign-out-link"
import type {
  ActivityEntry,
  CalendarDay,
  TrackMastery,
  WeeklyXp,
} from "@/modules/users/types"
import {
  getOrCreateUser,
  getRecentActivity,
  getStreakCalendar,
  getTrackMastery,
  getUserStats,
  getWeeklyXp,
} from "@/modules/users/service"
import { currentUser } from "@/server/auth"

type Props = {
  params: Promise<{ locale: ContentLocale }>
}

/* Naveo Bridge palette mapping for the profile decorations. Every accent
   resolves to a track tone or stat color exposed in globals.css. */
type ProfileTone =
  | "prompting"
  | "mcp"
  | "skills"
  | "agents"
  | "tooling"
  | "evals"
  | "xp"

const BADGE_TONES: readonly ProfileTone[] = [
  "xp",
  "prompting",
  "skills",
  "evals",
  "mcp",
  "agents",
  "tooling",
]

const MASTERY_ROW = [
  { mascot: "vega", tone: "skills" },
  { mascot: "echo", tone: "prompting" },
  { mascot: "forge", tone: "evals" },
  { mascot: "atlas", tone: "mcp" },
] as const

const MENTOR_SLUGS: readonly CrewSlug[] = ["vega", "echo", "atlas", "forge"]

const CREW_NAME_BY_SLUG: Record<CrewSlug, string> = Object.fromEntries(
  CAST.map((character) => [character.slug, character.name]),
) as Record<CrewSlug, string>

const TONE_FILL: Record<ProfileTone, string> = {
  prompting: "bg-track-prompting",
  mcp: "bg-track-mcp",
  skills: "bg-track-skills",
  agents: "bg-track-agents",
  tooling: "bg-track-tooling",
  evals: "bg-track-evals",
  xp: "bg-stat-xp",
}

const TONE_TEXT: Record<ProfileTone, string> = {
  prompting: "text-track-prompting",
  mcp: "text-track-mcp",
  skills: "text-track-skills",
  agents: "text-track-agents",
  tooling: "text-track-tooling",
  evals: "text-track-evals",
  xp: "text-stat-xp",
}

const TONE_BORDER: Record<ProfileTone, string> = {
  prompting: "border-track-prompting/40",
  mcp: "border-track-mcp/40",
  skills: "border-track-skills/40",
  agents: "border-track-agents/40",
  tooling: "border-track-tooling/40",
  evals: "border-track-evals/40",
  xp: "border-stat-xp/40",
}

const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

const slugifyHandle = (name: string): string =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16) || "officer"

// Deterministic mentor pick from the user's display name — every visitor
// always sees the same crew member greet them on their profile.
const pickMentor = (name: string): CrewSlug => {
  const seed = name.trim().toLowerCase()
  if (!seed) return "echo"
  let h = 0
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return MENTOR_SLUGS[h % MENTOR_SLUGS.length]!
}

type ProfileIdentity = {
  id: string
  imageUrl: string | null
  firstName: string | null
  lastName: string | null
  username: string | null
  email: string | null
}

async function getProfileIdentity(
  profileUserId: string,
  current?: Awaited<ReturnType<typeof currentUser>>,
): Promise<ProfileIdentity> {
  if (current?.id === profileUserId) {
    return {
      id: current.id,
      imageUrl: current.imageUrl ?? null,
      firstName: current.firstName ?? null,
      lastName: current.lastName ?? null,
      username: current.username ?? null,
      email: current.primaryEmailAddress?.emailAddress ?? null,
    }
  }

  try {
    const client = await clerkClient()
    const user = await client.users.getUser(profileUserId)
    return {
      id: user.id,
      imageUrl: user.imageUrl ?? null,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      username: user.username ?? null,
      email: user.primaryEmailAddress?.emailAddress ?? null,
    }
  } catch {
    notFound()
  }
}

export default async function PerfilPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const clerkUser = await currentUser()
  if (!clerkUser) {
    const t = await getTranslations("common.anonGate.profile")
    return <SignInPrompt heading={t("heading")} body={t("body")} exploreHref="/tracks" />
  }

  return (
    <ProfileScreen
      locale={locale}
      profileUserId={clerkUser.id}
      viewerUserId={clerkUser.id}
      current={clerkUser}
    />
  )
}

type ProfileScreenProps = {
  locale: ContentLocale
  profileUserId: string
  viewerUserId: string | null
  current?: Awaited<ReturnType<typeof currentUser>>
}

export async function ProfileScreen({
  locale,
  profileUserId,
  viewerUserId,
  current,
}: ProfileScreenProps) {
  const t = await getTranslations("profile")
  const fmt = await getFormatter({ locale })
  const identity = await getProfileIdentity(profileUserId, current)

  if (profileUserId === viewerUserId) {
    await getOrCreateUser(profileUserId)
  }

  const [
    stats,
    badges,
    snap,
    weekly,
    calendar,
    mastery,
    fullActivity,
    lessonsByCrew,
  ] =
    await Promise.all([
      getUserStats(profileUserId, locale),
      getEarnedBadges(profileUserId, locale),
      getXpSnapshot(profileUserId),
      getWeeklyXp(profileUserId, locale),
      getStreakCalendar(profileUserId),
      getTrackMastery(profileUserId, locale),
      getRecentActivity(profileUserId, locale, 50),
      listCrewLessonsBySlug(locale),
    ])
  const activity = fullActivity.slice(0, 6)

  const displayName =
    [identity.firstName, identity.lastName].filter(Boolean).join(" ") ||
    identity.username ||
    identity.email?.split("@")[0] ||
    t("defaultName")

  const handle = identity.username || slugifyHandle(displayName)
  const now = new Date()
  const memberSinceDate = stats.memberSince ?? now
  const daysOnBridge = Math.max(
    1,
    Math.floor(
      (now.getTime() - memberSinceDate.getTime()) / (1000 * 60 * 60 * 24),
    ),
  )

  const joinedDate = fmt.dateTime(memberSinceDate, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  const xpInLevel = stats.xp % 600
  const xpToNext = 600 - xpInLevel
  const rankPct = Math.round((xpInLevel / 600) * 100)

  const xpThisWeek = weekly[weekly.length - 1]?.xp ?? 0
  const xpPrevWeek = weekly[weekly.length - 2]?.xp ?? 0
  const xpDelta = xpThisWeek - xpPrevWeek
  const calendarDoneDays = calendar.filter(
    (c) => c === "done" || c === "today-done",
  ).length

  const mentorSlug = pickMentor(displayName)
  const firstName = identity.firstName || displayName.split(" ")[0] || displayName

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pb-12 pt-6 md:px-8">
        <ProfileHero
          imageUrl={identity.imageUrl}
          name={displayName}
          mentorSlug={mentorSlug}
          greeting={t("greeting", { name: firstName })}
          eyebrow={t("eyebrow", { days: daysOnBridge })}
          handleLine={t("handle", { handle, date: joinedDate })}
          bio={t("bio")}
          lessonsByCrew={lessonsByCrew}
        />

        <StatsStrip
          xp={stats.xp}
          xpLabel={t("stats.totalXpShort")}
          streakDays={snap.dailyStreak}
          streakLabel={t("stats.streakShort")}
          steps={stats.completedSteps}
          totalSteps={stats.totalSteps}
          stepsLabel={t("stats.stepsShort")}
        />

        <RankCard
          rankName={t("rank.name")}
          rankMeta={t.rich("rank.meta", {
            xp: xpToNext,
            b: (chunks) => (
              <span className="font-bold text-stat-xp">{chunks}</span>
            ),
          })}
          rankPct={rankPct}
          rankCardTitle={t("rank.cardTitle")}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <header className="mb-5 flex items-center justify-between gap-2">
              <h3 className="font-display font-bold text-lg tracking-tight text-ink-1">
                {t("chart.title")}{" "}
                <span className="text-stat-xp">
                  · {t("chart.titleAccent")}
                </span>
              </h3>
              <Chip tone="xp">
                {t("chart.delta", { delta: Math.max(0, xpDelta) })}
              </Chip>
            </header>
            <ProfileXpChart weeks={weekly} />
            <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              <span>{t("chart.axisStart")}</span>
              <span>{t("chart.axisMid")}</span>
              <span>{t("chart.axisEnd")}</span>
            </div>
          </Card>

          <Card className="p-6">
            <header className="mb-5 flex items-center justify-between gap-2">
              <h3 className="font-display font-bold text-lg tracking-tight text-ink-1">
                {t("calendar.title")}{" "}
                <span className="text-stat-streak">
                  · {t("calendar.titleAccent")}
                </span>
              </h3>
              <Chip tone="streak">
                {t("calendar.active", { days: calendarDoneDays })}
              </Chip>
            </header>
            <StreakCalendar cells={calendar} />
            <div className="mt-4 flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
              <CalendarLegendItem className="bg-stat-streak" label={t("calendar.legendDone")} />
              <CalendarLegendItem className="bg-bg-sunken border-2 border-line-strong" label={t("calendar.legendMiss")} />
              <CalendarLegendItem className="bg-primary" label={t("calendar.legendToday")} />
            </div>
          </Card>
        </div>

        <MasteryCard
          mastery={mastery}
          title={t("mastery.title")}
          accent={t("mastery.titleAccent", { count: mastery.length })}
          lockedLabel={t("mastery.locked")}
          lessonsByCrew={lessonsByCrew}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <BadgesCard
            earned={badges}
            formatDate={(d) =>
              fmt.dateTime(d, { day: "numeric", month: "short" })
            }
            title={t("badges.title")}
            accent={t("badges.titleAccent", { earned: badges.length })}
            emptyLabel={t("badges.empty")}
          />
          <ActivityCard
            activity={activity}
            fullActivity={fullActivity}
            locale={locale}
            title={t("activity.title")}
            accent={t("activity.titleAccent")}
            clearedLabel={t("activity.cleared")}
            failedLabel={t("activity.failed")}
            xpUnit={(xp) => t("activity.xpUnit", { xp })}
            emptyLabel={t("activity.empty")}
          />
        </div>

        {profileUserId === viewerUserId ? (
          <div className="flex justify-end pt-2">
            <SignOutLink
              className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3 transition-colors hover:text-ink-1"
              label={t("signOut")}
            />
          </div>
        ) : null}
    </div>
  )
}

/* ----------------------------- profile hero ----------------------------- */

type ProfileHeroProps = {
  imageUrl: string | null | undefined
  name: string
  mentorSlug: CrewSlug
  greeting: string
  eyebrow: string
  handleLine: string
  bio: string
  lessonsByCrew: CrewLessonMap
}

function ProfileHero({
  imageUrl,
  name,
  mentorSlug,
  greeting,
  eyebrow,
  handleLine,
  bio,
  lessonsByCrew,
}: ProfileHeroProps) {
  return (
    <Card className="grid items-center gap-6 p-6 md:grid-cols-[auto_1fr] md:p-8">
      <div className="grid size-32 place-items-center overflow-hidden rounded-full border-4 border-line-strong bg-bg-raised font-display font-bold text-4xl text-ink-1">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
        ) : (
          initialsOf(name)
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Eyebrow className="text-primary">{eyebrow}</Eyebrow>
        <h1 className="font-display font-bold text-3xl tracking-tight leading-tight text-ink-1 md:text-4xl">
          {name}
        </h1>
        <div className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
          {handleLine}
        </div>

        <div className="mt-3 flex items-start gap-3">
          <CrewLessonsDialog
            characterName={CREW_NAME_BY_SLUG[mentorSlug]}
            lessons={lessonsByCrew[mentorSlug]}
            triggerClassName="shrink-0 rounded-full transition-transform hover:-translate-y-0.5"
          >
            <CrewCharacter slug={mentorSlug} size={72} expression="happy" />
          </CrewLessonsDialog>
          <DialogBubble className="max-w-none">{greeting}</DialogBubble>
        </div>

        <p className="mt-1 font-sans font-semibold text-sm leading-relaxed text-ink-2">
          {bio}
        </p>
      </div>
    </Card>
  )
}

/* ----------------------------- rank card ----------------------------- */

type RankCardProps = {
  rankName: string
  rankMeta: React.ReactNode
  rankPct: number
  rankCardTitle: string
}

function RankCard({
  rankName,
  rankMeta,
  rankPct,
  rankCardTitle,
}: RankCardProps) {
  return (
    <Card className="p-6">
      <header className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-display font-bold text-lg tracking-tight text-ink-1">
          {rankCardTitle}{" "}
          <span className="text-stat-xp">· {rankName}</span>
        </h3>
        <span className="font-display font-bold text-xl text-stat-xp tabular-nums">
          {rankPct}%
        </span>
      </header>
      <ChunkyProgress value={rankPct} tone="xp" />
      <p className="mt-3 font-sans text-sm font-semibold text-ink-3">
        {rankMeta}
      </p>
    </Card>
  )
}

/* ----------------------------- stats strip ----------------------------- */

type StatsStripProps = {
  xp: number
  xpLabel: string
  streakDays: number
  streakLabel: string
  steps: number
  totalSteps: number
  stepsLabel: string
}

function StatsStrip({
  xp,
  xpLabel,
  streakDays,
  streakLabel,
  steps,
  totalSteps,
  stepsLabel,
}: StatsStripProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <StatTile
        variant="outline"
        tone="xp"
        label={xpLabel}
        value={xp.toLocaleString()}
        icon={<Bolt className="size-5" strokeWidth={2.5} />}
      />
      <StatTile
        variant="outline"
        tone="streak"
        label={streakLabel}
        value={`${streakDays}d`}
        icon={<Flame className="size-5" strokeWidth={2.5} />}
      />
      <StatTile
        variant="outline"
        tone="prompting"
        label={stepsLabel}
        value={`${steps}/${totalSteps}`}
        icon={<Star className="size-5" strokeWidth={2.5} />}
      />
    </section>
  )
}

/* ----------------------------- charts ----------------------------- */

function ProfileXpChart({ weeks }: { weeks: WeeklyXp[] }) {
  const values = weeks.map((w) => w.xp)
  const max = Math.max(1, ...values)
  return (
    <div className="flex items-end gap-1.5">
      {weeks.map((w, i) => {
        const isCurrent = i === weeks.length - 1
        // Non-zero weeks get a 4% floor so a small value (e.g. 1 XP against
        // a 30-XP scale) still renders a visible nub. Zero weeks stay flat.
        const h = w.xp === 0 ? 0 : Math.max(4, (w.xp / max) * 100)
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="relative flex h-32 w-full flex-col justify-end overflow-hidden rounded-sm bg-bg-sunken shadow-elev-inset">
              <div
                className={cn(
                  "w-full rounded-sm transition-[height] duration-slow ease-bounce",
                  isCurrent
                    ? "bg-stat-xp shadow-[0_3px_0_0_var(--stat-xp-shadow)]"
                    : "bg-stat-xp/40",
                )}
                style={{ height: `${h}%` }}
              />
            </div>
            {isCurrent ? (
              <span className="font-display font-bold text-[11px] tabular-nums text-stat-xp">
                {w.xp}
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function StreakCalendar({ cells }: { cells: CalendarDay[] }) {
  return (
    <div className="grid grid-cols-14 gap-1 md:grid-cols-[repeat(28,minmax(0,1fr))]">
      {cells.map((state, i) => {
        const isToday = state === "today" || state === "today-done"
        const isDone = state === "done" || state === "today-done"
        return (
          <span
            key={i}
            className={cn(
              "aspect-square w-full rounded-xs",
              isDone
                ? "bg-stat-streak shadow-[0_2px_0_0_var(--stat-streak-shadow)]"
                : state === "miss"
                  ? "bg-bg-sunken shadow-elev-inset"
                  : state === "future"
                    ? "bg-bg-sunken/60"
                    : "bg-primary shadow-[0_2px_0_0_var(--primary-shadow)]",
              isToday && "ring-2 ring-primary ring-offset-1 ring-offset-bg-surface",
            )}
            aria-hidden
          />
        )
      })}
    </div>
  )
}

function CalendarLegendItem({
  className,
  label,
}: {
  className: string
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-xs", className)} aria-hidden />
      {label}
    </span>
  )
}

/* ----------------------------- mastery ----------------------------- */

type MasteryCardProps = {
  mastery: TrackMastery[]
  title: string
  accent: string
  lockedLabel: string
  lessonsByCrew: CrewLessonMap
}

function MasteryCard({
  mastery,
  title,
  accent,
  lockedLabel,
  lessonsByCrew,
}: MasteryCardProps) {
  return (
    <Card className="p-6">
      <header className="mb-5">
        <h3 className="font-display font-bold text-lg tracking-tight text-ink-1">
          {title}{" "}
          <span className="text-primary">· {accent}</span>
        </h3>
      </header>
      <div className="flex flex-col gap-4">
        {mastery.map((m, i) => {
          const slot = MASTERY_ROW[i % MASTERY_ROW.length]!
          const tone: ProfileTone = slot.tone
          const locked = m.total === 0
          return (
            <div
              key={m.trackSlug}
              className={cn(
                "grid grid-cols-[auto_1fr] items-center gap-4 rounded-lg border-2 border-line-soft bg-bg-raised p-4",
                locked && "opacity-60",
              )}
            >
              <CrewLessonsDialog
                characterName={CREW_NAME_BY_SLUG[slot.mascot]}
                lessons={lessonsByCrew[slot.mascot]}
                triggerClassName="inline-flex size-16 items-center justify-center overflow-hidden rounded-full border-2 border-line-strong bg-bg-deep transition-transform hover:-translate-y-0.5"
              >
                <CrewCharacter slug={slot.mascot} size="full" />
              </CrewLessonsDialog>
              <div className="min-w-0">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <span className="truncate font-display font-bold text-base text-ink-1">
                    {m.trackTitle}
                  </span>
                  <span
                    className={cn(
                      "font-display font-bold text-base tabular-nums",
                      TONE_TEXT[tone],
                    )}
                  >
                    {locked ? lockedLabel : `${m.pct}%`}
                  </span>
                </div>
                <ChunkyProgress value={m.pct} tone={tone} />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ----------------------------- badges ----------------------------- */

type BadgesCardProps = {
  earned: CourseBadge[]
  formatDate: (d: Date) => string
  title: string
  accent: string
  emptyLabel: string
}

function BadgesCard({
  earned,
  formatDate,
  title,
  accent,
  emptyLabel,
}: BadgesCardProps) {
  return (
    <Card className="p-6">
      <header className="mb-5">
        <h3 className="font-display font-bold text-lg tracking-tight text-ink-1">
          {title}{" "}
          <span className="text-stat-xp">· {accent}</span>
        </h3>
      </header>
      {earned.length === 0 ? (
        <p className="font-sans font-semibold text-sm text-ink-3">
          {emptyLabel}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
          {earned.map((b, i) => {
            const tone = BADGE_TONES[i % BADGE_TONES.length]!
            const initial = b.courseTitle.slice(0, 1).toUpperCase()
            return (
              <div
                key={b.courseSlug}
                className="flex flex-col items-center gap-2 text-center"
                title={`${b.courseTitle} · ${formatDate(b.earnedAt)}`}
              >
                <span
                  className={cn(
                    "grid size-20 place-items-center rounded-full border-4 font-display font-black text-3xl",
                    TONE_FILL[tone],
                    TONE_BORDER[tone],
                    tone === "xp"
                      ? "text-track-skills-ink"
                      : "text-bg-deep",
                  )}
                >
                  {initial}
                </span>
                <div
                  className="line-clamp-2 font-display font-bold text-xs leading-snug text-ink-1"
                >
                  {b.courseTitle}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

/* ----------------------------- activity ----------------------------- */

type ActivityCardProps = {
  activity: ActivityEntry[]
  fullActivity: ActivityEntry[]
  locale: string
  title: string
  accent: string
  clearedLabel: string
  failedLabel: string
  xpUnit: (xp: number) => string
  emptyLabel: string
}

function ActivityCard({
  activity,
  fullActivity,
  locale,
  title,
  accent,
  clearedLabel,
  failedLabel,
  xpUnit,
  emptyLabel,
}: ActivityCardProps) {
  if (activity.length === 0) {
    return (
      <Card className="p-6">
        <header className="mb-5">
          <h3 className="font-display font-bold text-lg tracking-tight text-ink-1">
            {title}{" "}
            <span className="text-primary">· {accent}</span>
          </h3>
        </header>
        <p className="font-sans font-semibold text-sm text-ink-3">
          {emptyLabel}
        </p>
      </Card>
    )
  }

  const showLog = fullActivity.length > activity.length

  return (
    <Card className="p-6">
      <header className="mb-5 flex items-center justify-between gap-2">
        <h3 className="font-display font-bold text-lg tracking-tight text-ink-1">
          {title}{" "}
          <span className="text-primary">· {accent}</span>
        </h3>
        {showLog ? (
          <ActivityLogDialog
            entries={fullActivity}
            locale={locale}
            mascots={MASTERY_ROW.map((m) => m.mascot)}
          />
        ) : null}
      </header>
      <ul className="flex flex-col gap-2">
        {activity.map((a) => {
          const verb = a.passed ? clearedLabel : failedLabel
          return (
            <li
              key={a.attemptId}
              className={cn(
                "flex items-center gap-3 rounded-sm border-2 border-line-soft bg-bg-raised px-3 py-2.5",
                !a.passed && "border-danger/35 bg-danger-soft/40",
              )}
            >
              <div className="min-w-0 flex-1 font-sans font-semibold text-sm text-ink-1">
                <span className={a.passed ? "text-success" : "text-danger"}>
                  {verb}
                </span>{" "}
                <span className="font-bold">{a.stepTitle}</span>
              </div>
              {a.xp > 0 ? (
                <Chip tone="xp">{xpUnit(a.xp)}</Chip>
              ) : null}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
