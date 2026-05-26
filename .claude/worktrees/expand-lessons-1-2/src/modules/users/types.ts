import type { User as DbUser } from "@/generated/prisma/client"

export type AppUser = DbUser

export type UserStats = {
  totalSteps: number
  completedSteps: number
  totalAttempts: number
  memberSince: Date | null
  xp: number
}

export type NextStepRef = {
  trackSlug: string
  trackTitle: string
  courseSlug: string
  courseTitle: string
  stepSlug: string
  stepTitle: string
  isInProgress: boolean
}

export type ActivityEntry = {
  attemptId: string
  passed: boolean
  createdAt: Date
  stepSlug: string
  stepTitle: string
  // Best-effort breadcrumb. Empty string when the related ContentPiece can't
  // be found (e.g. attempt logged against a step that was later removed).
  trackSlug: string
  courseSlug: string
  courseTitle: string
}
