import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

import {
  Button,
  ChunkyProgress,
  Eyebrow,
  StatTile,
} from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import type { CourseDetail } from "@/modules/catalog/types"

type Props = {
  detail: CourseDetail
}

type TrackTone =
  | "prompting"
  | "mcp"
  | "skills"
  | "agents"
  | "tooling"
  | "evals"

const TRACK_SLUG_TONE: Record<string, TrackTone> = {
  prompting: "prompting",
  "prompts-y-comportamiento": "prompting",
  mcp: "mcp",
  "forge-te-da-las-herramientas": "mcp",
  skills: "skills",
  "skills-poderes": "skills",
  agents: "agents",
  "agentes-multi-paso": "agents",
  tooling: "tooling",
  evals: "evals",
}

const toneFor = (slug: string): TrackTone =>
  TRACK_SLUG_TONE[slug] ?? "prompting"

const ACCENT_STRIP: Record<TrackTone, string> = {
  prompting: "bg-track-prompting",
  mcp: "bg-track-mcp",
  skills: "bg-track-skills",
  agents: "bg-track-agents",
  tooling: "bg-track-tooling",
  evals: "bg-track-evals",
}

const ACCENT_TEXT: Record<TrackTone, string> = {
  prompting: "text-track-prompting",
  mcp: "text-track-mcp",
  skills: "text-track-skills",
  agents: "text-track-agents",
  tooling: "text-track-tooling",
  evals: "text-track-evals",
}

const TRACK_BUTTON: Record<TrackTone, "track-prompting" | "track-mcp" | "track-skills" | "track-agents" | "track-tooling" | "track-evals"> = {
  prompting: "track-prompting",
  mcp: "track-mcp",
  skills: "track-skills",
  agents: "track-agents",
  tooling: "track-tooling",
  evals: "track-evals",
}

// Path header above the in-dashboard CoursePath. Duolingo-flavored:
// chunky TrackBanner-style left accent strip, big text-4xl title,
// chunky progress bar, two outlined stat tiles (XP banked / Stars),
// single primary "Map" CTA — no equal-weight button cluster.
export async function DashboardPathHeader({ detail }: Props) {
  const t = await getTranslations("bridge.pathHeader")
  const tCapstones = await getTranslations("tracks.detail.capstones")

  const mentorName =
    detail.mascot.charAt(0).toUpperCase() + detail.mascot.slice(1)
  const tag = detail.tags[0] ?? ""
  const { stepsDone, stepsTotal, pct, xpBanked } = detail.summary
  const tone = toneFor(detail.trackSlug)

  const starsEarned = stepsDone
  const starsTotal = stepsTotal * 3

  return (
    <header className="flex flex-col gap-6">
      <div className="flex items-stretch gap-5">
        <div
          aria-hidden
          className={`w-1.5 shrink-0 self-stretch rounded-full ${ACCENT_STRIP[tone]}`}
        />
        <div className="flex flex-1 flex-col gap-2">
          <Eyebrow className={ACCENT_TEXT[tone]}>
            {t("eyebrow", {
              unit: String(detail.unit).padStart(2, "0"),
              tag,
              count: stepsTotal,
            })}
          </Eyebrow>
          <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-ink-1">
            {t.rich("title", {
              mentor: mentorName,
              em: (chunks) => (
                <em className="not-italic text-stat-xp">{chunks}</em>
              ),
            })}
          </h2>
        </div>
        <div className="hidden self-end md:block">
          <Button
            variant={TRACK_BUTTON[tone]}
            size="lg"
            render={<Link href={`/tracks/${detail.trackSlug}`} />}
          >
            {t("ctaMap")}
            <ArrowRight className="size-5" strokeWidth={2.5} />
          </Button>
        </div>
      </div>

      <ChunkyProgress
        value={pct}
        tone={tone}
        label={t("progress", { done: stepsDone, total: stepsTotal, pct })}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatTile
          variant="outline"
          tone="xp"
          label={t("meta.xpBanked")}
          value={xpBanked.toLocaleString()}
        />
        <StatTile
          variant="outline"
          tone="streak"
          label={t("meta.stars")}
          value={`${starsEarned}/${starsTotal}`}
        />
        {detail.hasCapstone ? (
          <StatTile
            variant="outline"
            tone="agents"
            label={t("meta.boss")}
            value={tCapstones(detail.capstoneTitle)}
          />
        ) : null}
      </div>

      <div className="md:hidden">
        <Button
          variant={TRACK_BUTTON[tone]}
          size="lg"
          className="w-full"
          render={<Link href={`/tracks/${detail.trackSlug}`} />}
        >
          {t("ctaMap")}
          <ArrowRight className="size-5" strokeWidth={2.5} />
        </Button>
      </div>
    </header>
  )
}
