import type {
  CatalogChip,
  CatalogCourse,
  SyllabusKind,
} from "./types"

// Filter chips. Static for now — we don't track categories per-track yet.
// Mirrors the design's catalog ChipRow (Courses.jsx :133-143). The "all" chip
// is rendered active; others are visual-only this pass.
export const CATALOG_CHIPS: readonly CatalogChip[] = [
  { id: "all", labelKey: "all", count: 0 }, // count filled at render time
  { id: "prompt", labelKey: "prompting", icon: "✦" },
  { id: "mcp", labelKey: "mcp", icon: "◇" },
  { id: "skills", labelKey: "skills", icon: "▲" },
  { id: "agents", labelKey: "agents", icon: "◎" },
  { id: "code", labelKey: "code", icon: "≡" },
  { id: "beginner", labelKey: "beginner" },
  { id: "intermediate", labelKey: "intermediate" },
  { id: "advanced", labelKey: "advanced" },
] as const

// Per-track visual meta. Keyed by track slug. Not in DB — these are display
// overrides until we have a richer track schema (rank, mascot, capstone, …).
type TrackMeta = Pick<
  CatalogCourse,
  "mascot" | "rank" | "color" | "tags" | "crew" | "duration" | "boss"
>

const VEGA_MAGENTA = "var(--mission-magenta)"
const ECHO_CYAN = "var(--signal-cyan)"
const FORGE_ORANGE = "var(--forge-orange)"
const ATLAS_MAGENTA = "var(--mission-magenta)"

export const TRACK_DISPLAY_META: Record<string, TrackMeta> = {
  "anatomia-del-prompt": {
    mascot: "vega",
    rank: "FIRST OFFICER",
    color: VEGA_MAGENTA,
    tags: ["Prompting", "Beginner", "Foundations"],
    duration: "2h 10min",
    boss: false,
    crew: [
      { name: "Vega", mascot: "vega", color: VEGA_MAGENTA },
      { name: "Echo", mascot: "echo", color: ECHO_CYAN },
    ],
  },
  "coordinacion-con-la-crew": {
    mascot: "echo",
    rank: "QUARTERMASTER",
    color: ECHO_CYAN,
    tags: ["Prompting", "Intermediate", "Multi-turn"],
    duration: "1h 50min",
    boss: true,
    crew: [
      { name: "Echo", mascot: "echo", color: ECHO_CYAN },
      { name: "Vega", mascot: "vega", color: VEGA_MAGENTA },
    ],
  },
}

// Default meta for tracks that aren't keyed above. Order-dependent palette so
// later tracks naturally pick up Forge / Atlas accents.
const DEFAULT_BY_ORDER: TrackMeta[] = [
  {
    mascot: "vega",
    rank: "FIRST OFFICER",
    color: VEGA_MAGENTA,
    tags: ["Prompting", "Beginner"],
    duration: "—",
    boss: false,
    crew: [{ name: "Vega", mascot: "vega", color: VEGA_MAGENTA }],
  },
  {
    mascot: "echo",
    rank: "QUARTERMASTER",
    color: ECHO_CYAN,
    tags: ["Prompting", "Intermediate"],
    duration: "—",
    boss: false,
    crew: [{ name: "Echo", mascot: "echo", color: ECHO_CYAN }],
  },
  {
    mascot: "forge",
    rank: "CHIEF ENGINEER",
    color: FORGE_ORANGE,
    tags: ["MCP & Tools", "Intermediate"],
    duration: "—",
    boss: true,
    crew: [{ name: "Forge", mascot: "forge", color: FORGE_ORANGE }],
  },
  {
    mascot: "atlas",
    rank: "CAPTAIN",
    color: ATLAS_MAGENTA,
    tags: ["Agents", "Advanced"],
    duration: "—",
    boss: true,
    crew: [{ name: "Atlas", mascot: "atlas", color: ATLAS_MAGENTA }],
  },
]

export const trackMetaFor = (slug: string, order: number): TrackMeta =>
  TRACK_DISPLAY_META[slug] ??
  DEFAULT_BY_ORDER[Math.min(order - 1, DEFAULT_BY_ORDER.length - 1)] ??
  DEFAULT_BY_ORDER[0]

// ---------- Course-detail meta ----------
//
// Per-track overrides for the syllabus page. Until the curriculum graph has
// these fields natively (capstone title, signing officer, course "kind"), we
// hardcode them by track slug. Defaults pick sensible values when a track is
// not listed.

type TrackDetailMeta = {
  capstoneTitleKey: string // i18n key fragment under tracks.detail.capstones.*
  signingOfficer: "vega" | "atlas" | "echo" | "forge"
  // Maps a course slug to its display "kind" in the syllabus row. Falls back
  // to "drill" for any unlisted course.
  kindByCourseSlug?: Record<string, SyllabusKind>
}

const DEFAULT_DETAIL_META: TrackDetailMeta = {
  capstoneTitleKey: "default",
  signingOfficer: "echo",
}

export const TRACK_DETAIL_META: Record<string, TrackDetailMeta> = {
  "anatomia-del-prompt": {
    capstoneTitleKey: "echoAudit",
    signingOfficer: "echo",
    kindByCourseSlug: {
      "te-incorporas-a-la-crew": "build",
    },
  },
  "coordinacion-con-la-crew": {
    capstoneTitleKey: "atlasBrief",
    signingOfficer: "atlas",
    kindByCourseSlug: {
      "tu-primera-conversacion": "chat",
    },
  },
}

export const trackDetailMetaFor = (slug: string): TrackDetailMeta =>
  TRACK_DETAIL_META[slug] ?? DEFAULT_DETAIL_META

export const syllabusKindFor = (
  trackSlug: string,
  courseSlug: string,
  isLast: boolean,
): SyllabusKind => {
  if (isLast) return "boss"
  const map = trackDetailMetaFor(trackSlug).kindByCourseSlug
  return map?.[courseSlug] ?? "drill"
}
