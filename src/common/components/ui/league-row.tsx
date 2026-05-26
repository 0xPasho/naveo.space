import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — leaderboard row.
   Rank | avatar slot | name + sub | XP | optional zone badge.
   Current-user row pops with primary border + soft glow.
   Zone badge marks promote / demote / safe brackets. */
type LeagueZone = "promote" | "demote" | "safe"

type LeagueRowProps = {
  rank: number
  name: React.ReactNode
  sub?: React.ReactNode
  xp: number | string
  avatar?: React.ReactNode
  zone?: LeagueZone
  isCurrentUser?: boolean
  className?: string
}

const RANK_BADGE: Record<number, string> = {
  1: "bg-stat-xp text-track-skills-ink shadow-[0_3px_0_0_var(--stat-xp-shadow)]",
  2: "bg-stat-gem text-track-prompting-ink shadow-[0_3px_0_0_var(--stat-gem-shadow)]",
  3: "bg-track-evals text-white shadow-[0_3px_0_0_var(--track-evals-shadow)]",
}

const ZONE_LABEL: Record<LeagueZone, string> = {
  promote: "PROMOTE",
  demote: "DEMOTE",
  safe: "SAFE",
}

const ZONE_STYLE: Record<LeagueZone, string> = {
  promote: "bg-success-soft text-success",
  demote: "bg-danger-soft text-danger",
  safe: "bg-bg-raised text-ink-3 border-2 border-line-strong",
}

function LeagueRow({
  rank,
  name,
  sub,
  xp,
  avatar,
  zone,
  isCurrentUser,
  className,
}: LeagueRowProps) {
  const rankBadge =
    RANK_BADGE[rank] ?? "bg-bg-raised text-ink-1 shadow-elev-1"

  return (
    <div
      data-slot="league-row"
      data-rank={rank}
      data-current={isCurrentUser || undefined}
      className={cn(
        "grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-3.5 rounded-md border-2 px-3.5 py-3",
        isCurrentUser
          ? "border-primary bg-primary-soft"
          : "border-line-soft bg-bg-surface",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-sm font-display font-bold text-base tabular-nums",
          rankBadge,
        )}
      >
        {rank}
      </span>
      <span className="inline-flex size-10 items-center justify-center">
        {avatar}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-display font-bold text-base text-ink-1">
          {name}
        </span>
        {sub ? (
          <span className="truncate font-sans text-xs font-semibold text-ink-3">
            {sub}
          </span>
        ) : null}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-display font-bold text-lg text-ink-1 tabular-nums">
          {xp}
        </span>
        <span className="font-display font-bold text-[10px] uppercase tracking-wide text-ink-3">
          XP
        </span>
      </div>
      {zone ? (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 font-display font-bold text-[10px] uppercase tracking-[0.12em]",
            ZONE_STYLE[zone],
          )}
        >
          {ZONE_LABEL[zone]}
        </span>
      ) : null}
    </div>
  )
}

export { LeagueRow }
export type { LeagueRowProps, LeagueZone }
