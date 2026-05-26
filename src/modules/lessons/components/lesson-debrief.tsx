import { Crown } from "lucide-react"
import { getTranslations } from "next-intl/server"

import {
  Button,
  Chip,
  Eyebrow,
  StatTile,
} from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { CrewCharacter } from "@/modules/crew"

import { ConfettiBurst } from "./confetti-burst"

type SigningOfficer =
  | "vega"
  | "atlas"
  | "echo"
  | "forge"
  | "orbit"
  | "hex"

type Props = {
  // The course / track context for the eyebrow text.
  trackTitle: string
  courseTitle: string
  // Counts feed the Accuracy stat (cleared / total).
  stepsCleared: number
  totalSteps: number
  // XP earned during this course, drives the XP EARNED tile.
  xpEarned: number
  // Mascot to render. Defaults to "echo" (the signing officer).
  signingOfficer?: SigningOfficer
  // Capstone variant: bigger confetti, heart-tone eyebrow, "TRACK CLEARED"
  // crown chip up top.
  isCapstone?: boolean
  // CTAs: back to the course path, and an optional "next track" link when
  // the whole track is cleared.
  courseHref: string
  nextTrackHref?: string | null
  // Live streak from gamification (signed-in only).
  streakDays?: number
}

// Lesson cleared celebration. Mirrors the design system's "Applied · Lesson
// complete" preview: confetti backdrop, mascot hero, eyebrow + title +
// subtitle, three StatTiles (XP / Accuracy / Streak), and two big buttons at
// the bottom.
export async function LessonDebrief({
  trackTitle,
  courseTitle,
  stepsCleared,
  totalSteps,
  xpEarned,
  signingOfficer = "echo",
  isCapstone = false,
  courseHref,
  nextTrackHref,
  streakDays = 0,
}: Props) {
  const t = await getTranslations("lessons.debrief")
  const officerName =
    signingOfficer.charAt(0).toUpperCase() + signingOfficer.slice(1)

  const accuracyPct =
    totalSteps === 0 ? 0 : Math.round((stepsCleared / totalSteps) * 100)

  return (
    <div className="relative min-h-full bg-bg-deep">
      <ConfettiBurst
        count={isCapstone ? 120 : 60}
        variant={isCapstone ? "capstone" : "default"}
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-10 md:py-12">
        {isCapstone ? (
          <Chip tone="heart" className="text-sm">
            <Crown className="size-3.5" />
            {t("capstone.stamp")}
          </Chip>
        ) : null}

        <CrewCharacter
          slug={signingOfficer}
          expression={isCapstone ? "win" : "happy"}
          size={120}
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <Eyebrow className={isCapstone ? "text-stat-heart" : "text-primary"}>
            {isCapstone
              ? t("capstone.eyebrow", { track: trackTitle })
              : t("eyebrow", { track: trackTitle, course: courseTitle })}
          </Eyebrow>
          <h1 className="font-display text-5xl font-bold leading-tight tracking-tight text-ink-1">
            {isCapstone ? t("capstone.title") : t("title")}
          </h1>
          <p className="max-w-md font-sans text-base font-semibold leading-relaxed text-ink-2">
            {isCapstone
              ? t("capstone.subtitle", { officer: officerName })
              : t("subtitle", { officer: officerName })}
          </p>
        </div>

        <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile
            tone="xp"
            label={t("rewards.xpLab")}
            value={`+${xpEarned}`}
          />
          <StatTile
            tone="success"
            label={t("rewards.accuracyLab")}
            value={`${accuracyPct}%`}
          />
          <StatTile
            tone="streak"
            label={t("rewards.streakLab")}
            value={String(streakDays)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            render={<Link href={courseHref} />}
            variant="secondary"
            size="lg"
          >
            {t("ctaBack")}
          </Button>
          {nextTrackHref ? (
            <Button
              render={<Link href={nextTrackHref} />}
              size="lg"
            >
              {t("ctaNextTrack")}
            </Button>
          ) : (
            <Button render={<Link href={courseHref} />} size="lg">
              {t("ctaContinue")}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
