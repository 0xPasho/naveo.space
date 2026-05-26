import { getTranslations } from "next-intl/server"

import type { CSSProperties } from "react"

import type { DashboardCrewMember } from "../types"

type Props = {
  member: DashboardCrewMember
}

// Single CrewCard tile — gold ribbon strip on top, glow halo, mascot
// silhouette, role + name + level pill. Mirrors the design's .crew-card.
export async function CrewCard({ member }: Props) {
  const t = await getTranslations("bridge.crew")
  const style = { "--ribbon": member.color } as CSSProperties

  return (
    <div
      className={"crew-card" + (member.locked ? " locked" : "")}
      style={style}
    >
      <div className="ribbon" />
      <div className="glow" />
      <img className="mascot" src={`/cast/${member.slug}.svg`} alt="" />
      <div className="role">{t(`roles.${member.roleKey}`)}</div>
      <div className="name">{member.name}</div>
      <div className="level">
        {member.locked ? (
          <span style={{ color: "var(--fg-faint)" }}>
            {t("level.locked")}
          </span>
        ) : (
          <>
            <span>{t("level.prefix")}</span>
            <b>{member.level}</b>
            <span>{t("level.suffix", { xp: member.xp })}</span>
          </>
        )}
      </div>
    </div>
  )
}
