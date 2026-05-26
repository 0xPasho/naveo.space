import { Bolt, Lock, Star, Target } from "lucide-react"
import type { CSSProperties } from "react"
import { Fragment } from "react"
import { getTranslations } from "next-intl/server"

import {
  Button,
  Card,
  Chip,
  ChunkyProgress,
  DialogBubble,
} from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { cn } from "@/common/lib/utils"
import { CrewAvatar } from "@/modules/crew"

import type { CatalogCourse } from "../types"
import { CrewPoster } from "./crew-poster"

type Props = {
  course: CatalogCourse
  primary?: boolean
}

// Full-width row card. Poster on left, body (eyebrow / title / tags /
// progress / blurb / footer) on right. The course color is threaded through
// `--course-accent` so the eyebrow + accents stay consistent.
export async function CourseCard({ course, primary = false }: Props) {
  const t = await getTranslations("tracks.list.card")
  const tDetail = await getTranslations("tracks.detail")

  const cta = ctaFor(course, t)
  const mentorName =
    course.mascot.charAt(0).toUpperCase() + course.mascot.slice(1)
  const phrasePreview = phrasePreviewFor(course.slug, t)

  const card = (
    <Card
      className={cn(
        "grid grid-cols-[200px_1fr] gap-5 p-5 transition-transform",
        primary && "border-primary/30",
        course.locked && "opacity-70 grayscale",
      )}
      style={{ ["--course-accent" as never]: course.color } as CSSProperties}
    >
      <div className="relative">
        <CrewPoster
          mascot={course.mascot}
          label={course.complete ? "MISSION CLEARED" : course.rank}
          color={course.color}
        />
        {course.locked ? (
          <span className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-sm border-2 border-line-strong bg-bg-deep/80 text-ink-1">
            <Lock className="size-4" strokeWidth={2.5} />
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        {primary ? (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-stat-xp/15 px-2.5 py-1 font-display font-bold text-[11px] uppercase tracking-[0.12em] text-stat-xp">
            <Star className="size-3" strokeWidth={2.5} fill="currentColor" />
            {t("bestPick")}
          </span>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <span className="font-display font-bold text-[11px] uppercase tracking-[0.12em] text-[var(--course-accent)]">
              {t("unitLabel", { unit: course.unit, duration: course.duration })}
            </span>
            <h2 className="mt-1 font-display font-bold text-2xl tracking-tight leading-tight text-ink-1">
              {tDetail("titlePrefix", { mentor: mentorName })}{" "}
              {course.title.toLowerCase()}
            </h2>
            <div className="mt-3 ml-3 max-w-[420px]">
              <DialogBubble tone="neutral" className="font-sans text-sm font-semibold">
                {phrasePreview}
              </DialogBubble>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {course.tags.map((tag, i) => (
                <Fragment key={tag}>
                  {i > 0 ? (
                    <span className="text-ink-4" aria-hidden>·</span>
                  ) : null}
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">
                    {tag}
                  </span>
                </Fragment>
              ))}
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-44">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display font-bold text-2xl tracking-tight tabular-nums text-ink-1">
                {course.pct}%
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                {t("completed")}
              </span>
            </div>
            <ChunkyProgress value={course.pct} tone="primary" />
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3">
              <span className="inline-flex items-center gap-1">
                <Star className="size-3 text-stat-xp" strokeWidth={2.5} />
                {t("stepsLabel", { done: course.lessonsDone, total: course.lessons })}
              </span>
              <span className="inline-flex items-center gap-1">
                <Bolt className="size-3 text-stat-xp" strokeWidth={2.5} />
                {t("xpLabel", { xp: course.xp })}
              </span>
              {course.boss ? (
                <Chip tone="danger">
                  <Target className="size-3" strokeWidth={2.5} />
                  {t("boss")}
                </Chip>
              ) : null}
            </div>
          </div>
        </div>

        <p className="font-sans font-semibold text-sm leading-relaxed text-ink-2">
          {course.blurb}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
              {t("reportingOfficers")}
            </span>
            <div className="flex items-center gap-2">
              {course.crew.map((member) => (
                <span
                  key={member.name}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-line-soft bg-bg-raised px-2 py-1 font-display font-bold text-[11px] text-ink-1"
                >
                  <CrewAvatar slug={member.mascot} size={18} />
                  {member.name}
                </span>
              ))}
            </div>
          </div>
          <div>{cta}</div>
        </div>
      </div>
    </Card>
  )

  if (course.locked) return card
  return (
    <Link
      href={`/tracks/${course.slug}`}
      className="block transition-transform hover:-translate-y-0.5"
    >
      {card}
    </Link>
  )
}

// Phrase preview — the "what you'll learn" hook we show in a DialogBubble.
// Tries the per-slug key tracks.list.card.phrasePreview.<slug>; if it isn't
// defined the t() helper returns the parent key by convention, so we fall
// back to the generic blurb defined as tracks.list.card.phrasePreview.
function phrasePreviewFor(
  slug: string,
  t: Awaited<ReturnType<typeof getTranslations<"tracks.list.card">>>,
): string {
  // next-intl 'has' would be cleaner but isn't available here; the catalog
  // ships a single generic phrasePreview today, so just use it. Per-slug
  // overrides can be added to messages later under the same key path.
  void slug
  return t("phrasePreview")
}

function ctaFor(
  course: CatalogCourse,
  t: Awaited<ReturnType<typeof getTranslations<"tracks.list.card">>>,
) {
  if (course.locked) {
    return (
      <Button variant="ghost" disabled>
        <Lock className="size-4" strokeWidth={2.5} />
        {t("lockedPrereq", { prereq: course.unlocks ?? "" })}
      </Button>
    )
  }
  if (course.pct === 0) {
    return <Button>{t("launch")}</Button>
  }
  if (course.pct === 100) {
    return <Button variant="secondary">{t("review")}</Button>
  }
  return <Button>{t("continueAt", { step: course.lessonsDone + 1 })}</Button>
}
