import { useTranslations } from "next-intl"

import { Link } from "@/common/i18n/navigation"
import type { Course, Step, Track } from "@/modules/content/types"
import { HEARTS_MAX_DEFAULT } from "@/modules/economy/data"

import { TutorButton } from "./tutor-drawer"

type Props = {
  track: Track
  course: Course
  step: Step
  positionInCourse: number
  totalInCourse: number
  completedInCourse: number
  // Live streak from gamification.service.getXpSnapshot. Defaults to 0
  // for anon users.
  streak?: number
  streakAtRisk?: boolean
  // Live hearts from economy.service.getWallet. Anon users see a full row
  // of `HEARTS_MAX_DEFAULT` so the header doesn't look broken pre-auth.
  hearts?: number
  heartsMax?: number
}

// Lesson player header — ported from the design's `.lp-head`. Logo (links
// back to the track) + breadcrumb + step counter + streak/hearts pills +
// Tutor IA button, with a 3px progress bar pinned to the bottom edge showing
// course completion.

export function LessonHeader({
  track,
  course,
  step,
  positionInCourse,
  totalInCourse,
  completedInCourse,
  streak = 0,
  streakAtRisk = false,
  hearts = HEARTS_MAX_DEFAULT,
  heartsMax = HEARTS_MAX_DEFAULT,
}: Props) {
  const t = useTranslations("lessons")
  const tCommon = useTranslations("common.hud")
  const pct =
    totalInCourse === 0
      ? 0
      : Math.min(
          100,
          Math.round((completedInCourse / totalInCourse) * 100),
        )

  return (
    <header className="lp-head">
      <Link href={`/tracks/${track.slug}`} className="brand" aria-label={t("bar.exit")}>
        <img src="/icons/logo-the-crew.svg" alt="The Crew" />
      </Link>
      <nav aria-label="breadcrumb" className="crumb">
        <b>{track.title}</b>
        <span className="sep">▸</span>
        <span>{course.title}</span>
        <span className="sep">▸</span>
        <span className="now">{step.title}</span>
      </nav>
      <span className="spacer" />
      <span className="stepcount">
        STEP <b>{positionInCourse}</b> / {totalInCourse}
      </span>
      <span
        className={"head-pill streak" + (streakAtRisk ? " at-risk" : "")}
        title={streakAtRisk ? tCommon("streakAtRiskTitle") : undefined}
      >
        <img src="/icons/streak-flame.svg" alt="" />
        {streak}
      </span>
      <span className="head-pill hearts">
        {Array.from({ length: heartsMax }, (_, i) => (
          <img
            key={i}
            src={i < hearts ? "/icons/heart.svg" : "/icons/heart-empty.svg"}
            alt=""
          />
        ))}
      </span>
      <TutorButton />
      <div className="lp-progress">
        <b style={{ width: `${pct}%` }} />
      </div>
    </header>
  )
}
