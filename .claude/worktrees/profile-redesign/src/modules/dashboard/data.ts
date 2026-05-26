import { PLAYER_STATS_PLACEHOLDER } from "@/modules/users/placeholder-stats"

import type {
  DashboardCommsMessage,
  DashboardCrewMember,
  DashboardStats,
} from "./types"

// Crew levels are placeholders — we don't track per-mentor XP yet. The order
// matches the design's Dashboard 3 crew rail. Forge starts locked because the
// Forge content lands later in the curriculum.
export const DASHBOARD_CREW: readonly DashboardCrewMember[] = [
  {
    slug: "vega",
    name: "Vega",
    roleKey: "vega",
    color: "var(--mission-magenta)",
    level: 6,
    xp: 980,
    locked: false,
  },
  {
    slug: "echo",
    name: "Echo",
    roleKey: "echo",
    color: "var(--signal-cyan)",
    level: 3,
    xp: 320,
    locked: false,
  },
  {
    slug: "atlas",
    name: "Atlas",
    roleKey: "atlas",
    // Bronze pauldron from tokens.css
    color: "oklch(0.66 0.10 50)",
    level: 2,
    xp: 180,
    locked: false,
  },
  {
    slug: "forge",
    name: "Forge",
    roleKey: "forge",
    color: "var(--forge-orange)",
    level: 0,
    xp: 0,
    locked: true,
  },
] as const

// Mock ship-comms feed. Times are placeholder — real comms feed lands when we
// have actual events to surface.
export const DASHBOARD_COMMS: readonly DashboardCommsMessage[] = [
  {
    slug: "echo",
    name: "Echo",
    messageKey: "echo",
    ago: "2m",
    color: "var(--signal-cyan)",
  },
  {
    slug: "vega",
    name: "Vega",
    messageKey: "vega",
    ago: "5m",
    color: "var(--mission-magenta)",
  },
  {
    slug: "atlas",
    name: "Atlas",
    messageKey: "atlas",
    ago: "12m",
    color: "oklch(0.66 0.10 50)",
  },
  {
    slug: "forge",
    name: "Forge",
    messageKey: "forge",
    ago: "1h",
    color: "var(--forge-orange)",
  },
] as const

// Static placeholder stats. Real XP/streak tracking lands when the backend
// exists.
export const DASHBOARD_PLACEHOLDER_STATS: DashboardStats = {
  xpToday: 120,
  xpDelta: 45,
  streakDays: PLAYER_STATS_PLACEHOLDER.streak,
  bestStreak: 17,
}

// Capstone unlocks-in counter (steps). Placeholder — real curriculum-graph
// resolution lands later.
export const DASHBOARD_PLACEHOLDER_CAPSTONE_LOCK_STEPS = 2

export const DASHBOARD_PLACEHOLDER_MINUTES_LEFT = 3
