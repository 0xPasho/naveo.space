import { ArrowDown, ArrowUp, Bolt, Crown, Flame, Gem, Minus } from "lucide-react"
import { getFormatter, getTranslations } from "next-intl/server"

import {
  Button,
  Card,
  Chip,
  DialogBubble,
  Eyebrow,
  LeagueRow,
  Mascot,
  StatTile,
} from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { cn } from "@/common/lib/utils"
import type { ContentLocale } from "@/modules/content/types"
import { CrewAvatar, CrewCharacter } from "@/modules/crew"
import { getOrCreateUser } from "@/modules/users/service"
import { currentUser } from "@/server/auth"

import { MENTOR_LABEL } from "./data"
import { getLeaderboard } from "./service"
import type { Climber, MentorKey, OfficerRow } from "./types"

type Props = {
  locale: ContentLocale
}

/* Map each mentor (crew member) to its Naveo Bridge track tone, so
   chips and avatars stay coherent across the platform. */
const MENTOR_TONE: Record<
  MentorKey,
  "prompting" | "mcp" | "skills" | "agents" | "tooling" | "evals"
> = {
  vega: "skills",
  echo: "prompting",
  atlas: "mcp",
  forge: "evals",
  orbit: "tooling",
  hex: "agents",
}

const initialsOf = (name: string): string =>
  name.replace(/[^a-zA-ZÀ-ÿ ]/g, "").trim().slice(0, 2).toUpperCase() || "OF"

export async function LeaderboardView({ locale }: Props) {
  const t = await getTranslations("leaderboard")
  const fmt = await getFormatter({ locale })

  const clerkUser = await currentUser()
  let viewerId: string | null = null
  if (clerkUser) {
    await getOrCreateUser(clerkUser.id)
    viewerId = clerkUser.id
  }

  const data = await getLeaderboard(viewerId, locale)
  const { rows, totalOfficers, top3, movers, you, xpToNext, ahead } = data

  const now = new Date()

  const moverChips: Climber[] = (movers ?? []).map((m) => ({
    userId: m.userId,
    name: m.name,
    handle: m.handle,
    rankDelta: m.rankDelta,
    todayXp: m.todayXp,
    mentor: m.mentor,
    // rankDelta is rolling-7d vs the prior 7-day slice; > 0 = climbed,
    // < 0 = slipped, 0 = held. "Today's movers" filters by todayXp>0,
    // so trend describes the 7-day change of someone active today.
    trend: m.rankDelta > 0 ? "up" : m.rankDelta < 0 ? "down" : "hold",
    you: m.you,
  }))

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-5 pb-12 pt-6 md:px-8 lg:grid-cols-[1fr_360px]">
      <main className="flex min-w-0 flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Eyebrow className="text-stat-xp">
            {t("context.eyebrow")}
          </Eyebrow>
          <h1 className="font-display font-bold text-5xl leading-[1.05] tracking-tight text-ink-1">
            {t("context.meta", { n: totalOfficers })}
          </h1>
        </header>

        {top3 ? (
          <section className="flex flex-col gap-6">
            <div className="flex justify-center">
              <span className="inline-flex size-24 items-center justify-center rounded-full bg-stat-xp shadow-[0_6px_0_0_var(--stat-xp-shadow)]">
                <Crown
                  className="size-12 text-track-skills-ink"
                  strokeWidth={2.5}
                />
              </span>
            </div>
            <div>
              <Eyebrow className="text-stat-xp">{t("podium.eyebrow")}</Eyebrow>
              <h2 className="mt-1 font-display font-bold text-2xl tracking-tight text-ink-1">
                {t.rich("podium.title", {
                  em: (chunks) => (
                    <span className="text-stat-xp">{chunks}</span>
                  ),
                })}
              </h2>
            </div>
            <div className="grid grid-cols-3 items-end gap-3">
              <PodiumTier rank={2} officer={top3[1]!} label={t("podium.second")} />
              <PodiumTier rank={1} officer={top3[0]!} label={t("podium.champion")} />
              <PodiumTier rank={3} officer={top3[2]!} label={t("podium.third")} />
            </div>
          </section>
        ) : null}

        {you ? (
          <StatusCard
            you={you}
            ahead={ahead}
            xpToNext={xpToNext}
            total={totalOfficers}
            t={{
              rank: t("status.rank"),
              outOf: t("status.outOf", { n: totalOfficers }),
              eyebrow: t("status.eyebrow"),
              leadingHeadline: t("status.leadingHeadline"),
              aheadHeadline: (xp) =>
                t.rich("status.aheadHeadline", {
                  xp,
                  num: (chunks) => (
                    <span className="text-stat-xp">{chunks}</span>
                  ),
                }),
              aheadSub: (name, xp) =>
                t.rich("status.aheadSub", {
                  name,
                  xp,
                  b: (chunks) => (
                    <span className="font-bold text-ink-1">{chunks}</span>
                  ),
                }),
              leadingSub: t("status.leadingSub"),
              cta: t("status.cta"),
              ctaSub: t("status.ctaSub"),
              youPin: t("status.youPin"),
            }}
          />
        ) : null}

        <section className="flex flex-col gap-3">
          <div>
            <Eyebrow>{t("movers.eyebrow")}</Eyebrow>
            <h3 className="mt-1 font-display font-bold text-xl tracking-tight text-ink-1">
              {t("movers.title")}
            </h3>
          </div>
          {moverChips.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {moverChips.map((c, i) => (
                <ClimberChip
                  key={i}
                  c={c}
                  xpLabel={t("movers.xpToday", { n: c.todayXp })}
                />
              ))}
            </div>
          ) : (
            <Card className="flex items-center gap-4 p-5">
              <Mascot crew="forge" size={64} showLabel={false} />
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold text-base text-ink-1">
                  {t("empty.moversTitle")}
                </div>
                <p className="mt-0.5 font-sans font-semibold text-sm text-ink-2">
                  {t("empty.moversBody")}
                </p>
              </div>
            </Card>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <Eyebrow>{t("rankings.eyebrow")}</Eyebrow>
            <h3 className="mt-1 font-display font-bold text-xl tracking-tight text-ink-1">
              {t("rankings.title")}
            </h3>
          </div>

          <Card className="overflow-hidden p-0">
            {rows.length === 0 ? (
              <div className="p-6 font-sans font-semibold text-sm text-ink-3">
                {t("rankings.empty")}
              </div>
            ) : (
              <div className="flex flex-col gap-1 p-3">
                {rows.map((r) => (
                  <LeagueRow
                    key={r.userId}
                    rank={r.rank}
                    name={r.name}
                    sub={undefined}
                    xp={r.xp.toLocaleString()}
                    zone={
                      r.you
                        ? r.rankDelta > 0
                          ? "promote"
                          : r.rankDelta < 0
                            ? "demote"
                            : "safe"
                        : undefined
                    }
                    isCurrentUser={r.you}
                    avatar={
                      <span className="inline-flex size-9 items-center justify-center overflow-hidden rounded-full border-2 border-line-strong bg-bg-raised">
                        <CrewCharacter slug={r.mentor} size="full" flat />
                      </span>
                    }
                  />
                ))}
              </div>
            )}
          </Card>

          {rows.length > 0 ? (
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
              {t("rankings.updatedAt", {
                time: fmt.dateTime(now, { hour: "2-digit", minute: "2-digit" }),
              })}
            </p>
          ) : null}
        </section>
      </main>

      <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
        <Card className="flex flex-col items-center gap-4 p-5 text-center">
          <Mascot crew="forge" size={96} showLabel={false} />
          <Eyebrow className="text-stat-xp">{t("aside.mascotEyebrow")}</Eyebrow>
          <DialogBubble className="w-full text-center" tone="neutral">
            {t("aside.mascotLine")}
          </DialogBubble>
        </Card>

        {you ? (
          <div className="flex flex-col gap-2">
            <Eyebrow>{t("aside.yourActivityEyebrow")}</Eyebrow>
            <div className="grid grid-cols-3 gap-2">
              <StatTile
                variant="outline"
                tone="xp"
                label={t("aside.statToday")}
                value={you.todayXp.toLocaleString()}
              />
              <StatTile
                variant="outline"
                tone="xp"
                label={t("aside.statWindow")}
                value={you.xp.toLocaleString()}
              />
              <StatTile
                variant="outline"
                tone="streak"
                label={t("aside.statStreak")}
                value={you.streak.toString()}
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Eyebrow>{t("aside.howEyebrow")}</Eyebrow>
          <div className="flex flex-col gap-2">
            <RewardChip
              icon={<Bolt className="size-5 text-stat-xp" strokeWidth={2.5} />}
              label={t("aside.howStep")}
            />
            <RewardChip
              icon={<Flame className="size-5 text-stat-streak" strokeWidth={2.5} />}
              label={t("aside.howDaily")}
            />
            <RewardChip
              icon={<Gem className="size-5 text-stat-gem" strokeWidth={2.5} />}
              label={t("aside.howGems")}
            />
            <RewardChip
              icon={<Crown className="size-5 text-stat-xp" strokeWidth={2.5} />}
              label={t("aside.howTop")}
            />
          </div>
        </div>
      </aside>
    </div>
  )
}

/* ----------------------------- status card ----------------------------- */

type StatusCardProps = {
  you: OfficerRow
  ahead: OfficerRow | null
  xpToNext: number | null
  total: number
  t: {
    rank: string
    outOf: string
    eyebrow: string
    leadingHeadline: string
    aheadHeadline: (xp: number) => React.ReactNode
    aheadSub: (name: string, xp: number) => React.ReactNode
    leadingSub: string
    cta: string
    ctaSub: string
    youPin: string
  }
}

function StatusCard({ you, ahead, xpToNext, total, t }: StatusCardProps) {
  const leading = !ahead || xpToNext === null
  const ratio = total > 1 ? (you.rank - 1) / (total - 1) : 0
  // Dot rides the hold-zone (middle 60% of the bar).
  const dotLeft = `${(20 + ratio * 60).toFixed(1)}%`

  return (
    <Card className="grid items-stretch gap-6 p-6 md:grid-cols-[auto_1fr_auto]">
      <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-stat-xp/40 bg-bg-deep px-7 py-5">
        <span className="font-display font-bold text-[10px] uppercase tracking-[0.14em] text-ink-3">
          {t.rank}
        </span>
        <span className="font-display font-bold text-6xl tracking-tight tabular-nums text-ink-1">
          #{you.rank}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
          {t.outOf}
        </span>
      </div>

      <div className="flex flex-col justify-center gap-3">
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <h2 className="font-display font-bold text-3xl tracking-tight leading-snug text-ink-1">
          {leading ? t.leadingHeadline : t.aheadHeadline(xpToNext ?? 0)}
        </h2>
        <p className="font-sans font-semibold text-base leading-relaxed text-ink-2">
          {leading ? t.leadingSub : t.aheadSub(ahead!.name, xpToNext ?? 0)}
        </p>
        <div className="relative mt-1.5 flex h-10 overflow-hidden rounded-md border-2 border-line-strong bg-bg-sunken shadow-elev-inset">
          <div className="flex flex-1 items-center justify-center bg-success/15 font-display font-bold text-xs uppercase tracking-wide text-success">
            <ArrowUp className="size-4" strokeWidth={3} />
          </div>
          <div className="flex flex-[3] items-center justify-center bg-bg-raised">
            <span className="font-display font-bold text-[10px] uppercase tracking-[0.12em] text-ink-3">
              HOLD
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center bg-danger/15 font-display font-bold text-xs uppercase tracking-wide text-danger">
            <ArrowDown className="size-4" strokeWidth={3} />
          </div>
          <div
            className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: dotLeft }}
          >
            <div className="relative">
              <div className="size-3 rounded-full bg-primary shadow-[0_0_0_4px_var(--primary-soft)]" />
              <div className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-xs bg-primary px-1.5 py-0.5 font-display font-bold text-[9px] uppercase tracking-wide text-primary-foreground">
                {t.youPin}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-stretch justify-center gap-2">
        <Button size="lg" render={<Link href="/tracks" />}>
          {t.cta}
        </Button>
        <span className="text-center font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">
          {t.ctaSub}
        </span>
      </div>
    </Card>
  )
}

/* ----------------------------- podium tier ----------------------------- */

type PodiumTierProps = {
  rank: 1 | 2 | 3
  officer: OfficerRow
  label: string
}

const TIER_CONFIG = {
  1: {
    cardBg: "bg-stat-xp/15 border-stat-xp/40",
    badge: "bg-stat-xp text-track-skills-ink shadow-[0_4px_0_0_var(--stat-xp-shadow)]",
    base: "bg-stat-xp text-track-skills-ink shadow-[0_6px_0_0_var(--stat-xp-shadow)]",
    height: "h-44",
  },
  2: {
    cardBg: "bg-stat-gem/15 border-stat-gem/40",
    badge: "bg-stat-gem text-track-prompting-ink shadow-[0_4px_0_0_var(--stat-gem-shadow)]",
    base: "bg-stat-gem text-track-prompting-ink shadow-[0_6px_0_0_var(--stat-gem-shadow)]",
    height: "h-32",
  },
  3: {
    cardBg: "bg-track-evals/15 border-track-evals/40",
    badge: "bg-track-evals text-white shadow-[0_4px_0_0_var(--track-evals-shadow)]",
    base: "bg-track-evals text-white shadow-[0_6px_0_0_var(--track-evals-shadow)]",
    height: "h-24",
  },
} as const

function PodiumTier({ rank, officer, label }: PodiumTierProps) {
  const cfg = TIER_CONFIG[rank]
  const tone = MENTOR_TONE[officer.mentor]
  return (
    <Link
      href={`/perfil/${officer.userId}`}
      className="group flex flex-col"
    >
      <div
        className={cn(
          "relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-transform group-hover:-translate-y-1",
          cfg.cardBg,
        )}
      >
        <div className="relative">
          <div className="grid size-16 place-items-center overflow-hidden rounded-full border-2 border-line-strong bg-bg-raised font-display font-bold text-xl text-ink-1">
            {initialsOf(officer.name)}
          </div>
          <div
            className={cn(
              "absolute -right-1 -bottom-1 inline-flex size-7 items-center justify-center rounded-full font-display font-bold text-sm",
              cfg.badge,
            )}
          >
            {rank}
          </div>
        </div>
        <div className="font-display font-bold text-base leading-tight text-ink-1">
          {officer.name}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
          {officer.handle}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex size-6 items-center justify-center overflow-hidden rounded-full bg-bg-deep">
            <CrewCharacter slug={officer.mentor} size="full" flat />
          </span>
          <Chip tone={tone}>{MENTOR_LABEL[officer.mentor]}</Chip>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <span className="inline-flex items-baseline gap-1">
            <Bolt className="size-3.5 text-stat-xp" strokeWidth={2.5} />
            <span className="font-display font-bold text-sm text-ink-1 tabular-nums">
              {officer.xp.toLocaleString()}
            </span>
            <span className="font-mono text-[10px] uppercase text-ink-3">
              XP
            </span>
          </span>
          <span className="inline-flex items-baseline gap-1">
            <Flame className="size-3.5 text-stat-streak" strokeWidth={2.5} />
            <span className="font-display font-bold text-sm text-ink-1 tabular-nums">
              {officer.streak}
            </span>
            <span className="font-mono text-[10px] uppercase text-ink-3">
              D
            </span>
          </span>
        </div>
      </div>
      <div
        className={cn(
          "mt-2 flex flex-col items-center justify-center rounded-md border-2 border-line-strong",
          cfg.base,
          cfg.height,
        )}
      >
        <div className="font-display font-bold text-3xl tracking-tight tabular-nums">
          {rank}
        </div>
        <div className="font-display font-bold text-[10px] uppercase tracking-[0.14em] opacity-75">
          {label}
        </div>
      </div>
    </Link>
  )
}

/* ----------------------------- climber chip ----------------------------- */

type ClimberChipProps = {
  c: Climber
  xpLabel: string
}

function ClimberChip({ c, xpLabel }: ClimberChipProps) {
  const up = c.trend === "up"
  const hold = c.trend === "hold"
  return (
    <Link
      href={`/perfil/${c.userId}`}
      className={cn(
        "flex items-center gap-3 rounded-md border-2 px-3.5 py-3 transition-colors",
        c.you
          ? "border-primary bg-primary-soft"
          : hold
            ? "border-line-soft bg-bg-raised hover:border-line-strong"
            : up
              ? "border-success/40 bg-success-soft/50 hover:border-success"
              : "border-danger/40 bg-danger-soft/50 hover:border-danger",
      )}
    >
      <CrewAvatar slug={c.mentor} size={44} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-display font-bold text-base text-ink-1">
          {c.name}
        </div>
        <div className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
          {xpLabel}
        </div>
      </div>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-display font-bold text-lg tabular-nums",
          hold ? "text-ink-3" : up ? "text-success" : "text-danger",
        )}
      >
        {hold ? (
          <Minus className="size-4" strokeWidth={3} />
        ) : up ? (
          <ArrowUp className="size-4" strokeWidth={3} />
        ) : (
          <ArrowDown className="size-4" strokeWidth={3} />
        )}
        {Math.abs(c.rankDelta)}
      </span>
    </Link>
  )
}

/* ----------------------------- reward chip ----------------------------- */

type RewardChipProps = {
  icon: React.ReactNode
  label: string
}

function RewardChip({ icon, label }: RewardChipProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border-2 border-line-soft bg-bg-raised px-3.5 py-3">
      <span className="inline-flex size-9 items-center justify-center rounded-md border-2 border-line-strong bg-bg-sunken shadow-elev-inset">
        {icon}
      </span>
      <span className="font-display font-bold text-sm text-ink-1">
        {label}
      </span>
    </div>
  )
}
