import "./styles.css"

import type { StepNeighbors } from "./types"
import { LessonHeader } from "./components/lesson-header"
import { ReadingPane } from "./components/reading-pane"
import { StepShell } from "./components/step-shell"
import { TutorDrawer, TutorProvider } from "./components/tutor-drawer"

type Props = {
  data: StepNeighbors
  locale: string
  streak?: number
  streakAtRisk?: boolean
  hearts?: number
  heartsMax?: number
}

const stepHref = (
  trackSlug: string,
  courseSlug: string,
  stepSlug: string,
) => `/tracks/${trackSlug}/${courseSlug}/${stepSlug}`

export function LessonPlayerView({
  data,
  locale,
  streak,
  streakAtRisk,
  hearts,
  heartsMax,
}: Props) {
  const {
    track,
    course,
    step,
    prevStep,
    nextStep,
    positionInCourse,
    totalInCourse,
    stepProgress,
    completedInCourse,
  } = data

  const prevHref = prevStep
    ? stepHref(track.slug, course.slug, prevStep.slug)
    : null
  // No next step inside the course = we're on the last step. Route NEXT to
  // the lesson-cleared celebration page instead of leaving NEXT unrendered.
  const nextHref = nextStep
    ? stepHref(track.slug, course.slug, nextStep.slug)
    : `/tracks/${track.slug}/${course.slug}/cleared`

  const initialPassed = stepProgress?.status === "completed"

  return (
    <TutorProvider>
      <div className="crew-lesson">
        <div className="lp-shell">
          <LessonHeader
            track={track}
            course={course}
            step={step}
            positionInCourse={positionInCourse}
            totalInCourse={totalInCourse}
            completedInCourse={completedInCourse}
            streak={streak}
            streakAtRisk={streakAtRisk}
            hearts={hearts}
            heartsMax={heartsMax}
          />
          <StepShell
            exercise={step.frontMatter.exercise ?? null}
            demo={step.frontMatter.demo ?? null}
            stepRef={{
              trackSlug: track.slug,
              courseSlug: course.slug,
              stepSlug: step.slug,
            }}
            locale={locale}
            prevHref={prevHref}
            nextHref={nextHref}
            initialPassed={initialPassed}
            hints={step.frontMatter.hints}
            positionInCourse={positionInCourse}
            totalInCourse={totalInCourse}
            completedInCourse={completedInCourse}
            reading={<ReadingPane body={step.body} />}
          />
        </div>
        <TutorDrawer />
      </div>
    </TutorProvider>
  )
}
