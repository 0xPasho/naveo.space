import { getTranslations } from "next-intl/server"

import type { DashboardCrewMember } from "../types"
import { CrewCard } from "./crew-card"

type Props = {
  crew: DashboardCrewMember[]
}

// "Your crew" rail — header + 4-up CrewCard grid. Mirrors the design's
// `<div className="card"><div className="card-h">…</div><div className="crew-grid">…</div></div>`.
export async function CrewRail({ crew }: Props) {
  const t = await getTranslations("bridge.crew")
  return (
    <div className="card">
      <div className="card-h">
        <h3 className="title">{t("title").toUpperCase()}</h3>
        <button className="more">{t("switchMentor")}</button>
      </div>
      <div className="crew-grid">
        {crew.map((member) => (
          <CrewCard key={member.slug} member={member} />
        ))}
      </div>
    </div>
  )
}
