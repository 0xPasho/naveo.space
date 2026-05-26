import type { CrewPreviewMember, Pillar } from "./types"

// Crew preview order matches the dashboard rail (Vega → Echo → Atlas → Forge)
// so signed-in users see continuity across landing → dashboard. Colors mirror
// DASHBOARD_CREW. Names are proper nouns (kept inline, same as
// modules/dashboard/data.ts).
export const HOME_CREW: readonly CrewPreviewMember[] = [
  {
    slug: "vega",
    name: "Vega",
    roleKey: "vega",
    color: "var(--mission-magenta)",
  },
  {
    slug: "echo",
    name: "Echo",
    roleKey: "echo",
    color: "var(--signal-cyan)",
  },
  {
    slug: "atlas",
    name: "Atlas",
    roleKey: "atlas",
    // Bronze pauldron from tokens.css — same as dashboard.
    color: "oklch(0.66 0.10 50)",
  },
  {
    slug: "forge",
    name: "Forge",
    roleKey: "forge",
    color: "var(--forge-orange)",
  },
] as const

export const HOME_PILLARS: readonly Pillar[] = [
  { key: "prompts", tone: "cyan" },
  { key: "tools", tone: "gold" },
  { key: "mcp", tone: "magenta" },
  { key: "agents", tone: "green" },
] as const

export const HOME_HOW_STEPS = ["drill", "build", "ship"] as const
