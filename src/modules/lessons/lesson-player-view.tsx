import { resolveStepLeadCharacter } from "@/modules/content/lib"

import type { StepNeighbors } from "./types"
import { LessonHeader } from "./components/lesson-header"
import { ReadingPane } from "./components/reading-pane"
import { StepShell } from "./components/step-shell"
import {
  TutorDrawer,
  TutorFab,
  TutorProvider,
} from "./components/tutor-drawer"

type Props = {
  data: StepNeighbors
  locale: string
  // Live hearts count for the signed-in user. `Number.POSITIVE_INFINITY` for
  // anon users — they're not yet bound by the economy. StepShell uses this
  // to disable Comprobar when the wallet is empty.
  hearts: number
  // Live gems count for the signed-in user. `Number.POSITIVE_INFINITY` for
  // anon users. TutorDrawer uses it to disable Send when the user can't
  // afford a tutor question.
  gems: number
  // Anon users can still browse and interact with the lesson UI, but
  // submitting an attempt requires auth. StepShell uses this to swap
  // Comprobar from a server-action submit into a sign-in modal trigger.
  isSignedIn: boolean
}

const stepHref = (
  trackSlug: string,
  courseSlug: string,
  stepSlug: string,
) => `/tracks/${trackSlug}/${courseSlug}/${stepSlug}`

export function LessonPlayerView({
  data,
  locale,
  hearts,
  gems,
  isSignedIn,
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
  const leadCharacter = resolveStepLeadCharacter(step.frontMatter)

  return (
    <TutorProvider
      stepRef={{
        trackSlug: track.slug,
        courseSlug: course.slug,
        stepSlug: step.slug,
      }}
      locale={locale}
      leadCharacter={leadCharacter}
      gems={gems}
    >
      <div className="flex h-full flex-col bg-bg-deep text-ink-1">
        <LessonHeader
          track={track}
          course={course}
          step={step}
          positionInCourse={positionInCourse}
          totalInCourse={totalInCourse}
        />
        <StepShell
          // Belt-and-suspenders alongside the page.tsx remount key: if
          // anything (route prefetch reuse, Fast Refresh, parent-tree
          // caching) keeps the parent alive between steps, this key still
          // forces StepShell to remount. Without it, the result/payload
          // state in StepShell leaks across step navigations and the
          // runner renders the previous step's pass state, including the
          // green "correct" highlight on the right answer.
          key={`${track.slug}/${course.slug}/${step.slug}`}
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
          outOfHearts={hearts <= 0}
          isSignedIn={isSignedIn}
          reading={<ReadingPane body={step.body} />}
        />
        <TutorFab />
        <TutorDrawer />
      </div>
    </TutorProvider>
  )
}
