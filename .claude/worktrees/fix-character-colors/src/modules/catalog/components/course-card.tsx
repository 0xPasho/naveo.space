import { getTranslations } from "next-intl/server"
import { Fragment } from "react"

import { Link } from "@/common/i18n/navigation"

import type { CatalogCourse } from "../types"
import { CrewPoster } from "./crew-poster"

type Props = {
  course: CatalogCourse
  primary?: boolean
}

// Full-width row card. Poster on left, body (eyebrow / title / tags / progress
// / blurb / footer) on right. The footer carries reporting officers + a
// state-aware CTA.
//
// Card-as-link: when not locked, the entire <article> is wrapped in a Link to
// /tracks/<slug>. The visual button is rendered as a span (not a real button)
// so the click target is the whole row — same pattern as the previous tracks
// page. For locked courses we render an unwrapped article.
export async function CourseCard({ course, primary = false }: Props) {
  const t = await getTranslations("tracks.list.card")
  const tDetail = await getTranslations("tracks.detail")

  const cta = ctaFor(course, t)
  const mentorName =
    course.mascot.charAt(0).toUpperCase() + course.mascot.slice(1)

  const card = (
    <article
      className={
        "course-card" +
        (primary ? " primary" : "") +
        (course.locked ? " locked" : "")
      }
    >
      <div className="course-poster-wrap">
        <CrewPoster
          mascot={course.mascot}
          label={course.complete ? "MISSION CLEARED" : course.rank}
          color={course.color}
        />
        {course.locked ? (
          <div className="course-lock">
            <img src="/icons/lock.svg" alt="" />
          </div>
        ) : null}
      </div>

      <div className="course-body">
        <div className="course-meta-row">
          <div className="course-meta-left">
            <span className="course-eyebrow" style={{ color: course.color }}>
              {t("unitLabel", { unit: course.unit, duration: course.duration })}
            </span>
            <h2 className="course-title">
              {tDetail("titlePrefix", { mentor: mentorName })}{" "}
              {course.title.toLowerCase()}
            </h2>
            <div className="course-tags">
              {course.tags.map((tag, i) => (
                <Fragment key={tag}>
                  {i > 0 ? <span className="tag-dot">•</span> : null}
                  <span className="tag">{tag}</span>
                </Fragment>
              ))}
            </div>
          </div>
          <div className="course-progress-block">
            <div className="course-progress-num">
              <b>{course.pct}%</b>
              <span>{t("completed")}</span>
            </div>
            <div className="course-progress">
              <b style={{ width: `${course.pct}%` }} />
            </div>
            <div className="course-progress-stats">
              <span>
                <img src="/icons/star.svg" alt="" />{" "}
                {t("stepsLabel", {
                  done: course.lessonsDone,
                  total: course.lessons,
                })}
              </span>
              <span>
                <img src="/icons/xp-bolt.svg" alt="" />{" "}
                {t("xpLabel", { xp: course.xp })}
              </span>
              {course.boss ? (
                <span className="boss-flag">
                  <img src="/icons/mission-target.svg" alt="" /> {t("boss")}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <p className="course-blurb">{course.blurb}</p>

        <div className="course-foot">
          <div className="course-crew">
            <span className="course-crew-label">{t("reportingOfficers")}</span>
            <div className="course-crew-pills">
              {course.crew.map((member) => (
                <span
                  key={member.name}
                  className="crew-mini-pill"
                  style={{ "--accent": member.color } as React.CSSProperties}
                >
                  <img src={`/cast/${member.mascot}.svg`} alt="" />
                  <span>{member.name}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="course-cta">{cta}</div>
        </div>
      </div>
    </article>
  )

  if (course.locked) return card
  return (
    <Link href={`/tracks/${course.slug}`} className="course-card-link">
      {card}
    </Link>
  )
}

function ctaFor(
  course: CatalogCourse,
  t: Awaited<ReturnType<typeof getTranslations<"tracks.list.card">>>,
) {
  if (course.locked) {
    return (
      <span className="btn btn-ghost btn-locked">
        <img src="/icons/lock.svg" alt="" />{" "}
        {t("lockedPrereq", { prereq: course.unlocks ?? "" })}
      </span>
    )
  }
  if (course.pct === 0) return <span className="btn btn-cta">{t("launch")}</span>
  if (course.pct === 100)
    return <span className="btn btn-cyan">{t("review")}</span>
  return (
    <span className="btn btn-cta">
      {t("continueAt", { step: course.lessonsDone + 1 })}
    </span>
  )
}
