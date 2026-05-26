import type { CSSProperties } from "react"
import { getTranslations } from "next-intl/server"

import {
  Button,
  ChunkyProgress,
  DialogBubble,
} from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"

import type { CourseDetail } from "../types"
import { CrewPoster } from "./crew-poster"
import { ScrollToMapButton } from "./scroll-to-map-button"

type Props = {
  detail: CourseDetail
}

// Hero of the course-detail (syllabus) page. Left column = eyebrow / title /
// tags / blurb / stats / CTA row / progress; right column = the crew poster.
export async function CourseDetailHero({ detail }: Props) {
  const t = await getTranslations("tracks.detail")
  const tCard = await getTranslations("tracks.list.card")
  const summary = detail.summary
  const capstoneLabel = await capstoneLabelFor(detail.capstoneTitle)
  const phrasePreview = tCard("phrasePreview")

  const continueHref = detail.continueAt
    ? `/tracks/${detail.continueAt.trackSlug}/${detail.continueAt.courseSlug}/${detail.continueAt.stepSlug}`
    : null

  return (
    <section
      className="grid min-w-0 overflow-hidden gap-6 md:grid-cols-[1fr_280px]"
      style={{ ["--detail-accent" as never]: detail.color } as CSSProperties}
    >
      <div className="flex min-w-0 flex-col gap-3">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[var(--detail-accent)]">
          {t("eyebrow", {
            unit: detail.unit,
            rank: detail.rank,
            steps: summary.stepsTotal,
            duration: detail.duration,
          })}
        </span>
        <h1 className="font-display font-bold text-4xl leading-tight tracking-tight text-ink-1 md:text-5xl">
          {t("titlePrefix", { mentor: capitalize(detail.mascot) })}{" "}
          <span className="text-[var(--detail-accent)]">
            {detail.title.toLowerCase()}
          </span>
          .
        </h1>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">
          {detail.tags.map((tag, i) => (
            <span key={tag} className="contents">
              {i > 0 ? (
                <span className="text-ink-4">{t("tagDot")}</span>
              ) : null}
              <span>{tag}</span>
            </span>
          ))}
        </div>
        <p className="max-w-prose font-sans font-semibold text-base leading-relaxed text-ink-2">
          {detail.blurb}
        </p>

        <div className="mt-2 flex flex-wrap gap-3">
          <DetailStat
            label={t("summary.runLabel")}
            value={t("summary.runValue", {
              done: summary.stepsDone,
              total: summary.stepsTotal,
            })}
          />
          <DetailStat
            label={t("summary.xpLabel")}
            value={t("summary.xpValue", {
              done: summary.xpBanked,
              total: summary.xpTotal,
            })}
            tone="xp"
          />
          {detail.hasCapstone ? (
            <DetailStat
              label={t("summary.capstoneLabel")}
              value={capstoneLabel}
              tone="boss"
            />
          ) : null}
        </div>

        <div className="mt-2 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {continueHref && detail.continueAt ? (
            <Button
              size="lg"
              className="w-full min-w-0 max-w-full overflow-hidden px-5 sm:w-auto sm:px-8"
              render={<Link href={continueHref} />}
            >
              <span className="block min-w-0 max-w-full truncate">
                {t("ctaContinueAt", {
                  step: detail.continueAt.stepNumber,
                  title: detail.continueAt.stepTitle,
                })}
              </span>
            </Button>
          ) : (
            <Button size="lg" className="w-full sm:w-auto">
              {t("ctaStart")}
            </Button>
          )}
          <ScrollToMapButton
            label={t("ctaMap")}
            className="w-full sm:w-auto"
          />
        </div>

        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1">
            <ChunkyProgress value={summary.pct} tone="primary" />
          </div>
          <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink-3 tabular-nums">
            {t("progressLabel", { pct: summary.pct })}
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <CrewPoster
          mascot={detail.mascot}
          label={detail.rank}
          color={detail.color}
        />
        <div className="w-full max-w-full overflow-hidden px-2">
          <DialogBubble
            tone="neutral"
            tailSide="right"
            className="w-full max-w-full font-sans text-sm font-semibold"
          >
            {phrasePreview}
          </DialogBubble>
        </div>
      </div>
    </section>
  )
}

function DetailStat({
  label,
  value,
  tone,
}: {
  label: string
  value: React.ReactNode
  tone?: "xp" | "boss"
}) {
  const valueColor =
    tone === "xp" ? "text-stat-xp" : tone === "boss" ? "text-track-agents" : "text-ink-1"
  return (
    <div className="flex flex-col gap-1 rounded-md border-2 border-line-soft bg-bg-raised px-4 py-3">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
        {label}
      </span>
      <span
        className={`font-display font-bold text-lg leading-none tracking-tight tabular-nums ${valueColor}`}
      >
        {value}
      </span>
    </div>
  )
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

async function capstoneLabelFor(key: string): Promise<string> {
  const t = await getTranslations("tracks.detail.capstones")
  const known = ["default", "echoAudit", "atlasBrief"] as const
  const safe = (known as readonly string[]).includes(key) ? key : "default"
  return t(safe)
}
