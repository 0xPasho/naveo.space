import type { Course, Step, Track } from "@/modules/content/types"
import type { StepProgress } from "@/modules/progress/types"

export type StepNeighbors = {
  step: Step
  course: Course
  track: Track
  prevStep: Step | null
  nextStep: Step | null
  positionInCourse: number
  totalInCourse: number
  // User's persisted progress for THIS step. Null when the user is not
  // signed in or hasn't attempted the step yet.
  stepProgress: StepProgress | null
  // Count of completed steps in this course (for the header badge).
  completedInCourse: number
}
