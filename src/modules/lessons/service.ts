import "server-only"

import {
  getCourse,
  getStep,
  getTrack,
  listSteps,
} from "@/modules/content/service"
import type { ContentLocale } from "@/modules/content/types"
import {
  getCourseProgress,
  getStepProgress,
} from "@/modules/progress/service"

import type { StepNeighbors } from "./types"

export async function getStepWithNeighbors(
  trackSlug: string,
  courseSlug: string,
  stepSlug: string,
  locale: ContentLocale,
  userId: string | null,
): Promise<StepNeighbors | null> {
  const [step, course, track, allSteps] = await Promise.all([
    getStep(stepSlug, locale, courseSlug),
    getCourse(courseSlug, locale),
    getTrack(trackSlug, locale),
    listSteps(courseSlug, locale),
  ])

  if (!step || !course || !track) return null
  if (course.trackSlug !== track.slug) return null
  if (step.courseSlug !== course.slug) return null

  const idx = allSteps.findIndex((s) => s.slug === step.slug)
  const prevStep = idx > 0 ? allSteps[idx - 1] : null
  const nextStep = idx >= 0 && idx < allSteps.length - 1 ? allSteps[idx + 1] : null

  const [stepProgress, courseProgress] = await Promise.all([
    userId ? getStepProgress(userId, step.id, locale) : Promise.resolve(null),
    getCourseProgress(userId, course.slug, locale),
  ])

  return {
    step,
    course,
    track,
    prevStep,
    nextStep,
    positionInCourse: idx + 1,
    totalInCourse: allSteps.length,
    stepProgress,
    completedInCourse: courseProgress.completed,
  }
}
