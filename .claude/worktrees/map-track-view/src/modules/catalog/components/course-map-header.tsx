import { getTranslations } from "next-intl/server"

import { Link } from "@/common/i18n/navigation"

import type { CourseMap } from "../types"

type Props = {
  map: CourseMap
}

// Mission-control header for the course map: unit eyebrow, title, blurb, a
// progress bar with done/total fraction, and a Resume CTA pinned to the right.
// Mascot poster on the right echoes the catalog detail hero, but slimmer.
export async function CourseMapHeader({ map }: Props) {
  const t = await getTranslations("tracks.map")

  const resumeHref = map.resumeAt
    ? `/tracks/${map.trackSlug}/${map.courseSlug}/${map.resumeAt.stepSlug}`
    : `/tracks/${map.trackSlug}/${map.courseSlug}/${map.nodes[0]?.stepSlug ?? ""}`

  const ctaLabel = map.resumeAt
    ? t("ctaResume", {
        step: map.resumeAt.stepNumber,
        total: map.totalSteps,
      })
    : t("ctaReplay")

  return (
    <header className="course-map-header" style={{ ["--unit-color" as never]: map.color }}>
      <div className="course-map-head-text">
        <div className="course-map-eyebrow">
          {t("eyebrow", {
            unit: String(map.unit).padStart(2, "0"),
            track: map.trackTitle,
            done: map.doneSteps,
            total: map.totalSteps,
          })}
        </div>
        <h1 className="course-map-title">{map.courseTitle}</h1>
        {map.blurb ? <p className="course-map-blurb">{map.blurb}</p> : null}

        <div className="course-map-progress-row">
          <div className="progress">
            <b style={{ width: `${map.pct}%` }} />
          </div>
          <span className="course-map-pct">
            {t("progress", {
              pct: map.pct,
              done: map.doneSteps,
              total: map.totalSteps,
            })}
          </span>
        </div>

        <div className="course-map-cta-row">
          <Link href={resumeHref} className="btn btn-cta">
            {ctaLabel}
          </Link>
          <Link
            href={`/tracks/${map.trackSlug}`}
            className="btn btn-ghost btn-sm"
          >
            {t("backToTrack")}
          </Link>
        </div>
      </div>

      <div className="course-map-mascot">
        <img src={`/cast/${map.mascot}.svg`} alt="" />
      </div>
    </header>
  )
}
