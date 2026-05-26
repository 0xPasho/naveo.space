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

// Per-character accent color. Each value maps to a Naveo Bridge track or
// stat token defined in src/app/globals.css. Threaded into `--course-accent`
// custom property by course-card and course-detail-hero.
const VEGA_MAGENTA = "var(--stat-xp)"
const ECHO_CYAN = "var(--track-prompting)"
const FORGE_ORANGE = "var(--stat-streak)"
const ATLAS_MAGENTA = "var(--track-mcp)"
const ORBIT_STEEL = "var(--track-tooling)"
const HEX_VIOLET = "var(--track-agents)"

export const TRACK_DISPLAY_META: Record<string, TrackMeta> = {
  "pre-flight": {
    mascot: "vega",
    rank: "RECRUIT",
    color: VEGA_MAGENTA,
    tags: ["Pre-flight", "Beginner", "Optional"],
    duration: "30 min",
    boss: false,
    crew: [{ name: "Vega", mascot: "vega", color: VEGA_MAGENTA }],
  },
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
      { name: "Atlas", mascot: "atlas", color: ATLAS_MAGENTA },
    ],
  },
  "seguridad-de-sistemas-ia": {
    mascot: "hex",
    rank: "RED TEAM",
    color: HEX_VIOLET,
    tags: ["Security", "Advanced", "Adversarial"],
    duration: "1h 20min",
    boss: true,
    crew: [
      { name: "Hex", mascot: "hex", color: HEX_VIOLET },
      { name: "Atlas", mascot: "atlas", color: ATLAS_MAGENTA },
    ],
  },
  "tools-y-mcps": {
    mascot: "forge",
    rank: "CHIEF ENGINEER",
    color: FORGE_ORANGE,
    tags: ["MCP & Tools", "Intermediate"],
    duration: "—",
    boss: true,
    crew: [
      { name: "Forge", mascot: "forge", color: FORGE_ORANGE },
      { name: "Atlas", mascot: "atlas", color: ATLAS_MAGENTA },
    ],
  },
  // Track 4 host is Orbit; Atlas still signs the capstone.
  "flujos-complejos": {
    mascot: "orbit",
    rank: "MISSION OPERATOR",
    color: ORBIT_STEEL,
    tags: ["Systems", "Advanced", "Orchestration"],
    duration: "1h 15min",
    boss: true,
    crew: [
      { name: "Orbit", mascot: "orbit", color: ORBIT_STEEL },
      { name: "Echo", mascot: "echo", color: ECHO_CYAN },
      { name: "Atlas", mascot: "atlas", color: ATLAS_MAGENTA },
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
  signingOfficer: "vega" | "atlas" | "echo" | "forge" | "orbit" | "hex"
  // Maps a course slug to its display "kind" in the syllabus row. Falls back
  // to "drill" for any unlisted course.
  kindByCourseSlug?: Record<string, SyllabusKind>
}

const DEFAULT_DETAIL_META: TrackDetailMeta = {
  capstoneTitleKey: "default",
  signingOfficer: "echo",
}

export const TRACK_DETAIL_META: Record<string, TrackDetailMeta> = {
  "pre-flight": {
    capstoneTitleKey: "default",
    signingOfficer: "vega",
    kindByCourseSlug: {
      "pre-flight": "drill",
    },
  },
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
  "seguridad-de-sistemas-ia": {
    capstoneTitleKey: "default",
    signingOfficer: "atlas",
    kindByCourseSlug: {
      "protocolo-de-seguridad": "build",
    },
  },
  "flujos-complejos": {
    capstoneTitleKey: "default",
    signingOfficer: "atlas",
    kindByCourseSlug: {
      "sistemas-multi-step": "build",
    },
  },
}

export const trackDetailMetaFor = (slug: string): TrackDetailMeta =>
  TRACK_DETAIL_META[slug] ?? DEFAULT_DETAIL_META

// Map a (track, course) to its syllabus display kind. The last course in a
// track is rendered as the boss row, but only when the track has a capstone
// (`meta.boss === true`). Tracks without a capstone (e.g. pre-flight) fall
// back to their normal kindByCourseSlug mapping.
export const syllabusKindFor = (
  trackSlug: string,
  courseSlug: string,
  isLast: boolean,
  trackHasBoss: boolean,
): SyllabusKind => {
  if (isLast && trackHasBoss) return "boss"
  const map = trackDetailMetaFor(trackSlug).kindByCourseSlug
  return map?.[courseSlug] ?? "drill"
}
