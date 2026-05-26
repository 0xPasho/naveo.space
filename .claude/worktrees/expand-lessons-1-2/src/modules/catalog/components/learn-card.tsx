import { getTranslations } from "next-intl/server"

import { CAST } from "@/modules/cast/data"

type Props = {
  signingOfficer: "vega" | "atlas" | "echo" | "forge"
}

// "What you'll clear" debrief card. Mirrors the design's .learn-card layout —
// title + signing officer pill on the right, then a 2-column grid of
// checkmarked points. Points are i18n strings (generic for now).
export async function LearnCard({ signingOfficer }: Props) {
  const t = await getTranslations("tracks.detail.debrief")
  const points = t.raw("points") as string[]
  const officer = CAST.find((m) => m.slug === signingOfficer)

  return (
    <section className="card learn-card">
      <div className="learn-head">
        <div>
          <div className="card-h" style={{ margin: 0 }}>
            <h3 className="title">
              <span className="accent">{t("eyebrow")}</span> ·{" "}
              {t("eyebrowAccent")}
            </h3>
          </div>
          <h2 className="learn-title">{t("title")}</h2>
        </div>
        <div className="learn-officer">
          <img
            src={`/cast/${signingOfficer}.svg`}
            alt={officer?.name ?? signingOfficer}
          />
          <div>
            <div className="learn-officer-name">{officer?.name ?? ""}</div>
            <div className="learn-officer-role">{t("officerRole")}</div>
          </div>
        </div>
      </div>
      <ul className="learn-list">
        {points.map((point, i) => (
          <li key={i}>
            <span className="learn-check">✓</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
