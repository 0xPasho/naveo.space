import type { Check, Rubric } from "@/modules/rubric/types"

import type { ContentLocale, ExerciseKind, PieceType, RelationKind } from "./data"

export type { ContentLocale, ExerciseKind, PieceType, RelationKind }

// ---------- Exercise definitions (frontmatter shapes) ----------

export type ExerciseAnatomyPart = {
  id: string
  label: string
  text: string
}

export type ExerciseAnatomy = {
  kind: "prompt-anatomy"
  parts: ExerciseAnatomyPart[]
}

export type ExerciseAB = {
  kind: "prompt-AB"
  question: string
  optionA: string
  optionB: string
  correct: "A" | "B"
  explanation: string
}

export type ExerciseTagFill = {
  kind: "prompt-tag-fill"
  template: string
  requiredTags: string[]
}

export type ExerciseTestCase = {
  input: string
}

export type ExercisePromptTask = {
  kind: "prompt-task"
  // Task description shown to the student (rendered above the editor).
  task: string
  // Inputs to substitute into the student's prompt template via `{{input}}`.
  testCases: ExerciseTestCase[]
  // Rubric checks evaluated on the model's output for each test case.
  rubric: Check[]
  // Optional override of the default task model. Format: OpenRouter slug.
  model?: string
  // Optional placeholder text shown in the editor (helps the student start).
  starter?: string
  // Defaults to "all-criteria-all-cases".
  passThreshold?: Rubric["passThreshold"]
}

export type ExerciseConversationGoal = {
  kind: "conversation-goal"
  // What the student must achieve through the conversation.
  goal: string
  // Display name of the persona the student talks to (Vega, Atlas, ...).
  // Optional — falls back to a generic label.
  personaName?: string
  // Slug from cast.md — used to render the persona's glyph + color.
  personaSlug?: "vega" | "atlas" | "echo" | "forge" | "orbit" | "hex"
  // System prompt that defines the persona for the LLM. Should set tone,
  // background, and any constraints (e.g., "give vague answers first").
  personaSystemPrompt: string
  // Optional starter message the persona sends first. If absent, the
  // student opens the conversation.
  personaOpener?: string
  // Hard cap on number of student messages. Prevents runaway sessions.
  maxTurns: number
  // Rubric checks evaluated on the FULL transcript when the student
  // submits. Same Check shape as prompt-task; deterministic checks operate
  // on the rendered transcript text.
  rubric: Check[]
  model?: string
  passThreshold?: Rubric["passThreshold"]
}

// ---------- Visual-polish exercise kinds (server validation is stubbed —
// always passes when payload non-empty — until rubric is authored) ----------

export type ExerciseToolDescription = {
  kind: "tool-description"
  // The tool name (e.g. "fetch_user_profile").
  toolName: string
  // The full tool spec the user is editing (read-only context shown around
  // the editable description field).
  context: string
  // Initial description (starter copy) the user edits.
  starter: string
  // Expected key phrases the description should mention. Stub validation
  // checks substring presence (case-insensitive).
  requiredPhrases: string[]
}

export type ExerciseMCPDebug = {
  kind: "mcp-debug"
  // The MCP tool spec (read-only).
  toolSpec: string
  // List of candidate root causes; the user picks ONE.
  candidates: { id: string; label: string }[]
  // Correct candidate id.
  correct: string
  explanation: string
}

// Author the JSON Schema for a tool. The student's submission (the schema
// text itself) is the "output" — rubric runs on it directly, no model call.
export type ExerciseToolSchemaAuthor = {
  kind: "tool-schema-author"
  // Tool name + plain-language purpose shown above the editor.
  toolName: string
  toolPurpose: string
  // Optional example invocations to ground what the schema must accept.
  exampleInvocations?: string[]
  // Initial schema text (typically a near-empty stub the student fills in).
  starter: string
  // Optional language hint for the editor (defaults to "json").
  language?: string
  rubric: Check[]
  model?: string
  passThreshold?: Rubric["passThreshold"]
}

// Implement a tool handler in code. The student writes the function body;
// the rubric runs on the code text directly (no execution). LLM-judge is
// the main evaluator — it reads the code + scenarios and decides whether
// the handler would behave correctly. Cheap, no sandbox.
export type ExerciseToolHandlerImplement = {
  kind: "tool-handler-implement"
  toolName: string
  // The tool's schema (read-only — student is writing the handler FOR this).
  toolSchema: string
  // Initial handler code (a stub signature, comments, or partial code).
  starter: string
  // Optional language hint for the editor (e.g. "javascript", "python").
  language?: string
  // Scenarios the handler is expected to behave correctly on. Shown in the
  // UI and surfaced to the LLM-judge via rubric context.
  scenarios?: { description: string; expected: string }[]
  rubric: Check[]
  model?: string
  passThreshold?: Rubric["passThreshold"]
}

// ---------- Phase B.1 — drag-and-drop kinds (deterministic) ----------

// A sortable list. The order given in `steps` is the CORRECT order; the
// runner shuffles client-side. Pass = order matches `steps` array.
export type ExerciseStepOrderDnd = {
  kind: "step-order-dnd"
  task: string
  steps: { id: string; label: string; detail?: string }[]
}

// Drag pieces from a bank into labeled slots. Each piece has a `correctSlot`
// declaring where it belongs. Pass = every slot holds its expected piece.
export type ExerciseSlotFillDnd = {
  kind: "slot-fill-dnd"
  task: string
  slots: { id: string; label: string }[]
  pieces: { id: string; label: string; correctSlot: string }[]
}

// Connect nodes in a small graph. The student draws connections from
// `sources` to `targets`; `correctConnections` declares the expected edges.
// Pass = student's edge set equals the expected edge set (order-independent).
export type ExerciseWiringDnd = {
  kind: "wiring-dnd"
  task: string
  sources: { id: string; label: string; detail?: string }[]
  targets: { id: string; label: string; detail?: string }[]
  correctConnections: { from: string; to: string }[]
}

export type Exercise =
  | ExerciseAnatomy
  | ExerciseAB
  | ExerciseTagFill
  | ExercisePromptTask
  | ExerciseConversationGoal
  | ExerciseToolDescription
  | ExerciseMCPDebug
  | ExerciseToolSchemaAuthor
  | ExerciseToolHandlerImplement
  | ExerciseStepOrderDnd
  | ExerciseSlotFillDnd
  | ExerciseWiringDnd

// ---------- Demo (interactive non-graded right-pane content) ----------

// A step may declare a `demo` instead of (or in absence of) an `exercise`.
// The id resolves to a component in `modules/lessons/demos/registry`. Props
// pass through opaque — the demo component is responsible for validating them.
export type StepDemo = {
  id: string
  props?: Record<string, unknown>
}

// ---------- Frontmatter for each piece type ----------

export type StepRelations = {
  teaches?: string[]
  requires?: string[]
  referencesPatterns?: string[]
  watchOutFor?: string[]
}

export type CharacterSlug = "vega" | "atlas" | "echo" | "forge" | "orbit" | "hex"

// Stations are the five teachable knowledge domains, each owned by a crew
// member. Atlas is the captain, not a station — see docs/plan/10-estaciones.md.
export type StationSlug = "vega" | "echo" | "forge" | "orbit" | "hex"

export type StepFrontmatter = StepRelations & {
  title: string
  order: number
  estimatedMinutes: number
  // Optional per-step XP override. Only honored on steps with `exercise`;
  // narrative/demo steps grant zero XP regardless. When omitted, the runtime
  // falls back to the per-ExerciseKind default in `gamification/data.ts`.
  xp?: number
  // A step's right pane is polymorphic: at most one of these is present.
  // Both absent = full-width MDX (pure narrative step).
  exercise?: Exercise
  demo?: StepDemo
  hints?: string[]
  // Crew featured in this step. First slug is the lead — drives the mascot
  // and tutor avatar. Omit to derive from exercise.personaSlug (vega fallback).
  characters?: CharacterSlug[]
  // Primary station this step belongs to. Required on exercise steps once
  // tagging lands. Drives mastery accrual in StationMastery.
  station?: StationSlug
  // Secondary stations whose domain is touched by this step (e.g. a Forge
  // tool-description exercise that also teaches Vega-style clarity). Receives
  // a fraction of the mastery delta.
  touches?: StationSlug[]
  passThreshold?: { rule: string }
}

// Daily quests are short mini-lessons of 2-5 exercise scenes played back
// to back. They live outside the track→course→step tree and the runtime
// treats them as an independent pool from which one quest is assigned per
// user per UTC day. The player walks `scenes` in order; XP + streak credit
// only fire when the user clears every scene. See
// modules/daily-quest/service.ts.
export type DailyFrontmatter = {
  title: string
  // Short copy shown above the first scene on the play page. Optional —
  // each scene's own task/goal text is usually enough.
  intro?: string
  // Ordered list of exercise scenes the player walks through. 5-8 scenes.
  scenes: Exercise[]
  // Optional station tag (for future bias toward stations the user works in).
  station?: StationSlug
  // Optional crew featured. First slug is the lead avatar on the daily card.
  characters?: CharacterSlug[]
  // Concept slugs this quest reinforces. Match the `teaches:` taxonomy on
  // step frontmatter so the daily-quest service can bias toward quests the
  // user has already encountered in a step. Untagged quests are treated as
  // foundational/universal and stay eligible for everyone.
  teaches?: string[]
}

export type CourseFrontmatter = {
  slug: string
  title: string
  order: number
  narrativeHook?: string
  estimatedMinutes: number
}

export type TrackFrontmatter = {
  slug: string
  title: string
  order: number
  description: string
  courses: string[]
  // True for bridge tracks the dashboard should not auto-route into. The
  // user can still start them manually from the catalog.
  optional?: boolean
}

// ---------- Domain views (built from a ContentPiece row) ----------

export type Step = {
  id: string
  locale: ContentLocale
  slug: string
  courseSlug: string
  title: string
  body: string
  order: number
  frontMatter: StepFrontmatter
}

export type DailyQuest = {
  id: string
  locale: ContentLocale
  slug: string
  title: string
  body: string
  frontMatter: DailyFrontmatter
}

export type Course = {
  id: string
  locale: ContentLocale
  slug: string
  trackSlug: string
  title: string
  order: number
  frontMatter: CourseFrontmatter
}

export type Track = {
  id: string
  locale: ContentLocale
  slug: string
  title: string
  order: number
  frontMatter: TrackFrontmatter
}
