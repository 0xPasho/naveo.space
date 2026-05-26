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
  personaSlug?: "vega" | "atlas" | "echo" | "forge"
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

export type ExercisePromptAssemble = {
  kind: "prompt-assemble"
  // The instruction shown above the bank.
  task: string
  // The shuffled token bank. The "correct" order is the one given here AS-IS;
  // the runner shuffles client-side. Matching by exact array equality.
  tokens: { id: string; label: string; kind?: string }[]
}

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

export type Exercise =
  | ExerciseAnatomy
  | ExerciseAB
  | ExerciseTagFill
  | ExercisePromptTask
  | ExerciseConversationGoal
  | ExercisePromptAssemble
  | ExerciseToolDescription
  | ExerciseMCPDebug

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

export type StepFrontmatter = StepRelations & {
  title: string
  order: number
  estimatedMinutes: number
  // A step's right pane is polymorphic: at most one of these is present.
  // Both absent = full-width MDX (pure narrative step).
  exercise?: Exercise
  demo?: StepDemo
  hints?: string[]
  passThreshold?: { rule: string }
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
