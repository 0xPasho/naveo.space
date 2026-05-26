import { getTranslations } from "next-intl/server"

import { Link } from "@/common/i18n/navigation"

import type { CourseDetail } from "../types"
import { CrewPoster } from "./crew-poster"

type Props = {
  detail: CourseDetail
}

// Hero block of the course-detail (syllabus) page. Mirrors the design's
// .detail-hero layout: left column = eyebrow / title / tags / blurb / stats /
// CTA row / progress bar; right column = the crew poster.
export async function CourseDetailHero({ detail }: Props) {
  const t = await getTranslations("tracks.detail")
  const summary = detail.summary
  const capstoneLabel = await capstoneLabelFor(detail.capstoneTitle)

  const continueHref = detail.continueAt
    ? `/tracks/${detail.continueAt.trackSlug}/${detail.continueAt.courseSlug}/${detail.continueAt.stepSlug}`
    : null

  return (
    <section className="detail-hero">
      <div className="detail-hero-text">
        <span className="detail-eyebrow">
          {t("eyebrow", {
            unit: detail.unit,
            rank: detail.rank,
            steps: summary.stepsTotal,
            duration: detail.duration,
          })}
        </span>
        <h1 className="detail-title">
          {t("titlePrefix", { mentor: capitalize(detail.mascot) })}{" "}
          <em>{detail.title.toLowerCase()}</em>.
        </h1>
        <div className="course-tags lg">
          {detail.tags.map((tag, i) => (
            <span key={tag} className="contents">
              {i > 0 ? <span className="tag-dot">{t("tagDot")}</span> : null}
              <span className="tag">{tag}</span>
            </span>
          ))}
        </div>
        <p className="detail-blurb">{detail.blurb}</p>

        <div className="detail-stats-row">
          <div className="detail-stat">
            <span className="lab">{t("summary.runLabel")}</span>
            <span className="val">
              {t("summary.runValue", {
                done: summary.stepsDone,
                total: summary.stepsTotal,
              })}
            </span>
          </div>
          <div className="detail-stat">
            <span className="lab">{t("summary.xpLabel")}</span>
            <span className="val gold">
              {t("summary.xpValue", {
                done: summary.xpBanked,
                total: summary.xpTotal,
              })}
            </span>
          </div>
          <div className="detail-stat">
            <span className="lab">{t("summary.heartsLabel")}</span>
            <span className="val">
              {Array.from({ length: summary.heartsMax }).map((_, i) => (
                <img
                  key={i}
                  src={
                    i < summary.hearts
                      ? "/icons/heart.svg"
                      : "/icons/heart-empty.svg"
                  }
                  alt=""
                  style={{ width: 20, height: 20, verticalAlign: -3 }}
                />
              ))}
            </span>
          </div>
          <div className="detail-stat boss">
            <span className="lab">{t("summary.capstoneLabel")}</span>
            <span className="val">{capstoneLabel}</span>
          </div>
        </div>

        <div className="detail-cta-row">
          {continueHref && detail.continueAt ? (
            <Link href={continueHref} className="btn btn-cta">
              {t("ctaContinueAt", {
                step: detail.continueAt.stepNumber,
                title: detail.continueAt.stepTitle,
              })}
            </Link>
          ) : (
            <span className="btn btn-cta">{t("ctaStart")}</span>
          )}
          <span className="btn btn-ghost">{t("ctaMap")}</span>
        </div>

        <div className="detail-progress">
          <div className="progress fat">
            <b style={{ width: `${summary.pct}%` }} />
          </div>
          <span className="detail-progress-num">
            {t("progressLabel", { pct: summary.pct })}
          </span>
        </div>
      </div>

      <div className="detail-hero-poster">
        <CrewPoster
          mascot={detail.mascot}
          label={detail.rank}
          color={detail.color}
        />
      </div>
    </section>
  )
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

async function capstoneLabelFor(key: string): Promise<string> {
  const t = await getTranslations("tracks.detail.capstones")
  const known = ["default", "echoAudit", "atlasBrief"] as const
  const safe = (known as readonly string[]).includes(key) ? key : "default"
  return t(safe)
}
