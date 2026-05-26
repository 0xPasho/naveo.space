import type { ContentLocale } from "@/modules/content/types"
import type { NextStepRef } from "@/modules/users/types"

export type DashboardMascotSlug = "vega" | "atlas" | "echo" | "forge"

export type DashboardCrewMember = {
  slug: DashboardMascotSlug
  name: string
  // i18n key under bridge.crew.roles.*
  roleKey: DashboardMascotSlug
  color: string
  level: number
  xp: number
  locked: boolean
}

export type DashboardCommsMessage = {
  slug: DashboardMascotSlug
  // Display name shown in the row label (uppercased at render time). Decoupled
  // from `slug` so a future member with slug ≠ name renders correctly.
  name: string
  // i18n key under bridge.comms.messages.*
  messageKey: DashboardMascotSlug
  ago: string
  color: string
}

export type DashboardStats = {
  xpToday: number
  xpDelta: number
  streakDays: number
  bestStreak: number
}

export type DashboardContinue = {
  next: NextStepRef
  unitNumber: number
  stepNumber: number
  totalSteps: number
  pct: number
  estimatedMinutesLeft: number
}

export type Dashboard = {
  locale: ContentLocale
  greetingName: string
  // ISO time-of-day window the greeting line should pick from.
  timeOfDay: "morning" | "afternoon" | "evening"
  shipTime: string
  // null for fresh users with no progress, or for fully-completed catalogs.
  continueAt: DashboardContinue | null
  // Static this pass — no real "daily quest" engine yet.
  capstoneStepsToUnlock: number
  crew: DashboardCrewMember[]
  comms: DashboardCommsMessage[]
  stats: DashboardStats
}
