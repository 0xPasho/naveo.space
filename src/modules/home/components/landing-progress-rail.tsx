import { Diamond, Flame, Heart, Sparkles, Trophy } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { ChunkyProgress, Eyebrow, HudPill, LeagueRow } from "@/common/components/ui"
import { CrewCharacter } from "@/modules/crew"

export async function LandingProgressRail() {
  const t = await getTranslations("home.progress")
  const tDossier = await getTranslations("crew.dossier")

  return (
    <section
      aria-labelledby="landing-progress-title"
      className="border-t-2 border-line-soft bg-bg-sunken py-20 md:py-28"
    >
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <div className="mb-10 flex flex-col gap-3">
          <Eyebrow className="text-primary">{t("eyebrow")}</Eyebrow>
          <h2
            id="landing-progress-title"
            className="max-w-3xl font-display font-bold text-3xl leading-tight tracking-tight text-ink-1 sm:text-4xl"
          >
            {t("title")}
          </h2>
          <p className="max-w-2xl font-sans text-base font-semibold leading-relaxed text-ink-2">
            {t("sub")}
          </p>
        </div>

        {/* HUD pills row */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <HudPill
            kind="xp"
            icon={<Sparkles className="size-3.5 text-white" strokeWidth={2.5} />}
            value="2 480"
            label="XP"
          />
          <HudPill
            kind="streak"
            icon={<Flame className="size-3.5 text-white" strokeWidth={2.5} />}
            value="14"
            label={t("hud.streakLabel")}
          />
          <HudPill
            kind="heart"
            icon={<Heart className="size-3.5 text-white" strokeWidth={2.5} />}
            value="4"
            label={t("hud.heartsLabel")}
          />
          <HudPill
            kind="gem"
            icon={<Diamond className="size-3.5 text-white" strokeWidth={2.5} />}
            value="320"
            label={t("hud.gemsLabel")}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-8">
          {/* Station mastery */}
          <div className="rounded-xl border-2 border-line-soft bg-bg-surface p-5 shadow-elev-2">
            <div className="mb-4 flex items-baseline justify-between">
              <Eyebrow>{t("mastery.label")}</Eyebrow>
              <span className="font-display font-bold text-[11px] text-ink-3">
                {t("mastery.note")}
              </span>
            </div>
            <ul className="flex flex-col gap-4">
              <MasteryRow
                slug="vega"
                title={t("mastery.rows.vega")}
                tone="prompting"
                value={82}
                tier={3}
              />
              <MasteryRow
                slug="echo"
                title={t("mastery.rows.echo")}
                tone="skills"
                value={64}
                tier={2}
              />
              <MasteryRow
                slug="forge"
                title={t("mastery.rows.forge")}
                tone="tooling"
                value={41}
                tier={1}
              />
              <MasteryRow
                slug="hex"
                title={t("mastery.rows.hex")}
                tone="evals"
                value={18}
                tier={0}
              />
            </ul>
          </div>

          {/* Mini leaderboard */}
          <div className="rounded-xl border-2 border-line-soft bg-bg-surface p-5 shadow-elev-2">
            <div className="mb-4 flex items-center justify-between gap-2">
              <Eyebrow>{t("league.label")}</Eyebrow>
              <span className="inline-flex items-center gap-1.5 font-display font-bold text-[11px] uppercase tracking-[0.14em] text-stat-xp">
                <Trophy className="size-3.5" strokeWidth={2.5} />
                {t("league.tier")}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              <LeagueRow
                rank={1}
                name="Nuria Galván"
                sub={t("league.subs.captain")}
                xp="3 120"
                avatar={
                  <CrewCharacter slug="vega" size={36} flat title={tDossier("vega.roleShort")} />
                }
                zone="promote"
              />
              <LeagueRow
                rank={2}
                name="Tu posición"
                sub={t("league.subs.you")}
                xp="2 480"
                avatar={
                  <CrewCharacter slug="forge" size={36} flat title={tDossier("forge.roleShort")} />
                }
                zone="promote"
                isCurrentUser
              />
              <LeagueRow
                rank={3}
                name="Mateo Quispe"
                sub={t("league.subs.steady")}
                xp="2 015"
                avatar={
                  <CrewCharacter slug="echo" size={36} flat title={tDossier("echo.roleShort")} />
                }
                zone="safe"
              />
              <LeagueRow
                rank={4}
                name="Aoife Donnelly"
                sub={t("league.subs.rising")}
                xp="1 740"
                avatar={
                  <CrewCharacter slug="hex" size={36} flat title={tDossier("hex.roleShort")} />
                }
                zone="safe"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

type MasteryRowProps = {
  slug: "vega" | "echo" | "forge" | "hex"
  title: string
  tone: "prompting" | "skills" | "tooling" | "evals"
  value: number
  tier: number
}

function MasteryRow({ slug, title, tone, value, tier }: MasteryRowProps) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
      <span className="inline-flex size-10 items-center justify-center overflow-hidden rounded-md border-2 border-line-soft bg-bg-sunken">
        <CrewCharacter slug={slug} size="full" flat title={title} />
      </span>
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-display font-bold text-sm tracking-tight text-ink-1">
            {title}
          </span>
          <span className="font-display font-bold text-xs tabular-nums text-ink-2">
            {value}
          </span>
        </div>
        <ChunkyProgress tone={tone} value={value} max={100} />
      </div>
      <span className="inline-flex size-9 items-center justify-center rounded-md border-2 border-line-strong bg-bg-raised font-display font-bold text-xs tabular-nums text-ink-2">
        T{tier}
      </span>
    </li>
  )
}
