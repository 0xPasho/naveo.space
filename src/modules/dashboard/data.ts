import { PLAYER_STATS_PLACEHOLDER } from "@/modules/users/placeholder-stats"

import type { DashboardCrewMember, DashboardStats } from "./types"

// Crew roster for the dashboard. Order matches Dashboard 3 in the design.
// Forge, Orbit, and Hex start locked because their content lands later in
// the curriculum.
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
  {
    slug: "orbit",
    name: "Orbit",
    roleKey: "orbit",
    color: "var(--track-tooling)",
    tone: "tooling",
    locked: true,
  },
  {
    slug: "hex",
    name: "Hex",
    roleKey: "hex",
    color: "var(--track-agents)",
    tone: "agents",
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
