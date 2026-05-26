import { getTranslations } from "next-intl/server"

import { Eyebrow } from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
import { CrewCharacter } from "@/modules/crew"
import type { CrewSlug } from "@/modules/crew"

type StationTone = "prompting" | "skills" | "agents" | "tooling" | "evals"

type StationTile = {
  slug: CrewSlug
  tone: StationTone
  span: string
}

// 5 stations, asymmetric grid: 2 large on top row, 3 on bottom row.
// Atlas sits above the bento as the captain banner; he's not a station.
const STATIONS: StationTile[] = [
  { slug: "vega", tone: "prompting", span: "md:col-span-3" },
  { slug: "echo", tone: "skills", span: "md:col-span-3" },
  { slug: "forge", tone: "tooling", span: "md:col-span-2" },
  { slug: "orbit", tone: "agents", span: "md:col-span-2" },
  { slug: "hex", tone: "evals", span: "md:col-span-2" },
]

const TONE_BORDER: Record<StationTone, string> = {
  prompting: "border-track-prompting/40",
  skills: "border-track-skills/40",
  agents: "border-track-agents/40",
  tooling: "border-track-tooling/40",
  evals: "border-track-evals/40",
}

const TONE_GLYPH: Record<StationTone, string> = {
  prompting: "bg-track-prompting/15",
  skills: "bg-track-skills/15",
  agents: "bg-track-agents/15",
  tooling: "bg-track-tooling/15",
  evals: "bg-track-evals/15",
}

const TONE_DOT: Record<StationTone, string> = {
  prompting: "bg-track-prompting",
  skills: "bg-track-skills",
  agents: "bg-track-agents",
  tooling: "bg-track-tooling",
  evals: "bg-track-evals",
}

const TONE_TEXT: Record<StationTone, string> = {
  prompting: "text-track-prompting",
  skills: "text-track-skills",
  agents: "text-track-agents",
  tooling: "text-track-tooling",
  evals: "text-track-evals",
}

export async function LandingStationsBento() {
  const t = await getTranslations("home.stations")
  const tDossier = await getTranslations("crew.dossier")

  return (
    <section
      aria-labelledby="landing-stations-title"
      className="border-t-2 border-line-soft bg-bg-sunken py-20 md:py-28"
    >
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <div className="mb-10 flex flex-col gap-3">
          <Eyebrow className="text-primary">{t("eyebrow")}</Eyebrow>
          <h2
            id="landing-stations-title"
            className="max-w-3xl font-display font-bold text-3xl leading-tight tracking-tight text-ink-1 sm:text-4xl"
          >
            {t("title")}
          </h2>
          <p className="max-w-2xl font-sans text-base font-semibold leading-relaxed text-ink-2">
            {t("sub")}
          </p>
        </div>

        {/* Atlas — captain banner */}
        <div className="mb-5 flex items-center gap-5 rounded-xl border-2 border-line-strong bg-bg-surface p-5 shadow-elev-3">
          <div className="relative inline-flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-line-strong bg-bg-sunken">
            <CrewCharacter slug="atlas" size="full" title={tDossier("atlas.roleShort")} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Eyebrow className="text-stat-xp">{t("atlas.eyebrow")}</Eyebrow>
            <h3 className="font-display font-bold text-xl leading-tight tracking-tight text-ink-1">
              {t("atlas.name")}
            </h3>
            <p className="font-sans text-sm font-semibold leading-snug text-ink-2">
              {t("atlas.body")}
            </p>
          </div>
        </div>

        {/* 5 stations */}
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-5">
          {STATIONS.map((station) => (
            <li
              key={station.slug}
              className={cn(
                "min-w-0 rounded-xl border-2 bg-bg-surface p-5 shadow-elev-3",
                TONE_BORDER[station.tone],
              )}
              data-station={station.slug}
            >
              <div className="flex h-full flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "inline-flex size-16 items-center justify-center overflow-hidden rounded-lg",
                      TONE_GLYPH[station.tone],
                    )}
                  >
                    <CrewCharacter
                      slug={station.slug}
                      size="full"
                      title={tDossier(`${station.slug}.roleShort`)}
                    />
                  </div>
                  <span
                    className={cn(
                      "inline-flex size-2.5 rounded-full",
                      TONE_DOT[station.tone],
                    )}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Eyebrow className={TONE_TEXT[station.tone]}>
                    {t(`tiles.${station.slug}.station`)}
                  </Eyebrow>
                  <h3 className="font-display font-bold text-lg leading-tight tracking-tight text-ink-1">
                    {t(`tiles.${station.slug}.name`)}
                  </h3>
                </div>

                <p className="font-sans text-sm font-semibold leading-relaxed text-ink-2">
                  {t(`tiles.${station.slug}.body`)}
                </p>

                <div className="mt-auto border-t-2 border-line-soft pt-3 font-mono text-xs text-ink-3">
                  {t(`tiles.${station.slug}.example`)}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
