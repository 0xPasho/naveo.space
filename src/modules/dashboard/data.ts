import { PLAYER_STATS_PLACEHOLDER } from "@/modules/users/placeholder-stats"

import type { DashboardCrewMember, DashboardStats } from "./types"

// Crew roster for the dashboard. Order matches Dashboard 3 in the design.
// Forge starts locked because its content lands later in the curriculum.
export const DASHBOARD_CREW: readonly DashboardCrewMember[] = [
  {
    slug: "vega",
    name: "Vega",
    roleKey: "vega",
    color: "var(--stat-xp)",
    tone: "skills",
    locked: false,
  },
  {
    slug: "echo",
    name: "Echo",
    roleKey: "echo",
    color: "var(--track-prompting)",
    tone: "prompting",
    locked: false,
  },
  {
    slug: "atlas",
    name: "Atlas",
    roleKey: "atlas",
    color: "var(--track-mcp)",
    tone: "mcp",
    locked: false,
  },
  {
    slug: "forge",
    name: "Forge",
    roleKey: "forge",
    color: "var(--stat-streak)",
    tone: "evals",
    locked: true,
  },
] as const

// Zero-baseline. Real values are filled in by `getDashboard()`: streak from
// Xp snapshot, xpToday/xpDelta from Progress windows. These zeros only show
// for an unauthenticated viewer.
export const DASHBOARD_PLACEHOLDER_STATS: DashboardStats = {
  xpToday: 0,
  xpDelta: 0,
  xpThisWeek: 0,
  xpWeekDelta: 0,
  streakDays: PLAYER_STATS_PLACEHOLDER.streak,
  bestStreak: 0,
}
