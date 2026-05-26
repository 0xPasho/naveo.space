export const PIECE_TYPES = [
  "track",
  "course",
  "step",
  "concept",
  "pattern",
  "antipattern",
  "example",
  "glossary",
  "daily",
] as const

export type PieceType = (typeof PIECE_TYPES)[number]

export const RELATION_KINDS = [
  "teaches",
  "requires",
  "references",
  "watchOutFor",
  "related",
] as const

export type RelationKind = (typeof RELATION_KINDS)[number]

// Phase 1 shipped deterministic kinds only. Phase 2 added LLM-evaluated
// single-turn kinds (prompt-task) and now multi-turn (conversation-goal).
// Phase 3 (in flight) — visual polish kinds ported from the design but with
// stub server-side validation (always-pass when payload non-empty) until the
// rubric for each is authored: tool-description, mcp-debug.
export const EXERCISE_KINDS = [
  "prompt-anatomy",
  "prompt-AB",
  "prompt-tag-fill",
  "prompt-task",
  "conversation-goal",
  "tool-description",
  "mcp-debug",
  // Track 3 — tool/MCP authoring. Both follow the "student writes text,
  // rubric runs on text directly" pattern (no model call for substitution).
  "tool-schema-author",
  "tool-handler-implement",
  // Phase B.1 — visual drag-and-drop kinds. Deterministic validation, no
  // LLM call. step-order-dnd is a sortable list; slot-fill-dnd drops pieces
  // into labeled slots; wiring-dnd connects nodes in a small graph.
  "step-order-dnd",
  "slot-fill-dnd",
  "wiring-dnd",
] as const

export type ExerciseKind = (typeof EXERCISE_KINDS)[number]

export const SUPPORTED_LOCALES = ["es", "en"] as const
export type ContentLocale = (typeof SUPPORTED_LOCALES)[number]
