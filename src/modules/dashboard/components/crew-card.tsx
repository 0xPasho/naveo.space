import { getTranslations } from "next-intl/server"

import type { CSSProperties } from "react"

import { Card } from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
import { CrewCharacter, toCrewSlug } from "@/modules/crew"

import type { DashboardCrewMember } from "../types"

type Props = {
  member: DashboardCrewMember
}

// Single CrewCard tile — gold ribbon strip on top, glow halo, mascot
// silhouette, role + name. Locked members render desaturated and dimmed.
// Member.color is the legacy field still kept in data.ts; we pass it through
// as a `--ribbon` custom property so the ribbon strip + name pick it up.
export async function CrewCard({ member }: Props) {
  const t = await getTranslations("bridge.crew")
  const style = { "--ribbon": member.color } as CSSProperties
  const slug = toCrewSlug(member.slug)

  return (
    <Card
      style={style}
      className={cn(
        "relative flex flex-col items-center gap-2 overflow-hidden p-5 text-center",
        member.locked && "opacity-60",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-[var(--ribbon)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center_top,var(--ribbon),transparent_60%)] opacity-20"
      />
      {slug ? (
        <CrewCharacter
          slug={slug}
          className={cn(
            "relative size-24",
            member.locked && "grayscale brightness-75",
          )}
          size="full"
        />
      ) : null}
      <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
        {t(`roles.${member.roleKey}`)}
      </div>
      <div className="font-display text-[15px] font-bold leading-tight tracking-tight text-[var(--ribbon)]">
        {member.name}
      </div>
      {member.locked ? (
        <div className="font-mono text-[11px] uppercase tracking-wider text-ink-4">
          {t("locked")}
        </div>
      ) : null}
    </Card>
  )
}
