import type { CSSProperties } from "react"

import type { CrewPreviewMember } from "../types"

type Props = {
  member: CrewPreviewMember
  name: string
  role: string
  blurb: string
}

// Landing variant of the dashboard CrewCard. Same ribbon + glow + mascot
// silhouette pattern, but no level pill — instead a short blurb so signed-out
// visitors get a feel for each character's personality.
export function CrewPreviewCard({ member, name, role, blurb }: Props) {
  const style = { "--ribbon": member.color } as CSSProperties

  return (
    <article className="crew-card" style={style}>
      <div className="ribbon" />
      <div className="glow" />
      <img className="mascot" src={`/cast/${member.slug}.svg`} alt="" />
      <div className="role">{role}</div>
      <div className="name">{name}</div>
      <p className="blurb">{blurb}</p>
    </article>
  )
}
