import crypto from "node:crypto"

import { z } from "zod"

import { CheckSchema, RubricSchema } from "@/modules/rubric/lib"

import { EXERCISE_KINDS, PIECE_TYPES, RELATION_KINDS, SUPPORTED_LOCALES } from "./data"
import type { CharacterSlug, StepFrontmatter } from "./types"

export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

export const hashContent = (body: string, frontMatter: object): string => {
  const canonical = JSON.stringify(frontMatter, Object.keys(frontMatter).sort())
  return crypto.createHash("sha256").update(body).update(canonical).digest("hex")
}

// ---------- Zod schemas ----------

export const PieceTypeSchema = z.enum(PIECE_TYPES)
export const RelationKindSchema = z.enum(RELATION_KINDS)
export const LocaleSchema = z.enum(SUPPORTED_LOCALES)
export const ExerciseKindSchema = z.enum(EXERCISE_KINDS)

export const ExerciseAnatomySchema = z.object({
  kind: z.literal("prompt-anatomy"),
  parts: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        text: z.string().min(1),
      }),
    )
    .min(2),
})

export const ExerciseABSchema = z.object({
  kind: z.literal("prompt-AB"),
  question: z.string().min(1),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  correct: z.enum(["A", "B"]),
  explanation: z.string().min(1),
})

export const ExerciseTagFillSchema = z.object({
  kind: z.literal("prompt-tag-fill"),
  template: z.string().min(1),
  requiredTags: z.array(z.string().min(1)).min(1),
})

export const ExerciseTestCaseSchema = z.object({
  input: z.string().min(1),
})

export const ExercisePromptTaskSchema = z.object({
  kind: z.literal("prompt-task"),
  task: z.string().min(1),
  testCases: z.array(ExerciseTestCaseSchema).min(1),
  rubric: z.array(CheckSchema).min(1),
  model: z.string().optional(),
  starter: z.string().optional(),
  passThreshold: RubricSchema.shape.passThreshold,
})

export const ExerciseConversationGoalSchema = z.object({
  kind: z.literal("conversation-goal"),
  goal: z.string().min(1),
  personaName: z.string().optional(),
  personaSlug: z.enum(["vega", "atlas", "echo", "forge", "orbit", "hex"]).optional(),
  personaSystemPrompt: z.string().min(1),
  personaOpener: z.string().optional(),
  maxTurns: z.number().int().min(1).max(20),
  rubric: z.array(CheckSchema).min(1),
  model: z.string().optional(),
  passThreshold: RubricSchema.shape.passThreshold,
})

export const ExerciseToolSchemaAuthorSchema = z.object({
  kind: z.literal("tool-schema-author"),
  toolName: z.string().min(1),
  toolPurpose: z.string().min(1),
  exampleInvocations: z.array(z.string().min(1)).optional(),
  starter: z.string().min(1),
  language: z.string().optional(),
  rubric: z.array(CheckSchema).min(1),
  model: z.string().optional(),
  passThreshold: RubricSchema.shape.passThreshold,
})

export const ExerciseToolHandlerImplementSchema = z.object({
  kind: z.literal("tool-handler-implement"),
  toolName: z.string().min(1),
  toolSchema: z.string().min(1),
  starter: z.string().min(1),
  language: z.string().optional(),
  scenarios: z
    .array(
      z.object({
        description: z.string().min(1),
        expected: z.string().min(1),
      }),
    )
    .optional(),
  rubric: z.array(CheckSchema).min(1),
  model: z.string().optional(),
  passThreshold: RubricSchema.shape.passThreshold,
})

// Visual-polish kinds — runners exist, schemas were missing until Track 3
// started using them. Registering them here lets MDX parse the frontmatter
// for these exercises (tool-description, mcp-debug, etc.).

export const ExerciseToolDescriptionSchema = z.object({
  kind: z.literal("tool-description"),
  toolName: z.string().min(1),
  context: z.string().min(1),
  starter: z.string().min(1),
  requiredPhrases: z.array(z.string().min(1)).min(1),
})

export const ExerciseMCPDebugSchema = z.object({
  kind: z.literal("mcp-debug"),
  toolSpec: z.string().min(1),
  candidates: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
      }),
    )
    .min(2),
  correct: z.string().min(1),
  explanation: z.string().min(1),
})

// Phase B.1 — drag-and-drop kinds.

export const ExerciseStepOrderDndSchema = z.object({
  kind: z.literal("step-order-dnd"),
  task: z.string().min(1),
  steps: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        detail: z.string().optional(),
      }),
    )
    .min(2),
})

export const ExerciseSlotFillDndSchema = z.object({
  kind: z.literal("slot-fill-dnd"),
  task: z.string().min(1),
  slots: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
      }),
    )
    .min(1),
  pieces: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        correctSlot: z.string().min(1),
      }),
    )
    .min(1),
})

export const ExerciseWiringDndSchema = z.object({
  kind: z.literal("wiring-dnd"),
  task: z.string().min(1),
  sources: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        detail: z.string().optional(),
      }),
    )
    .min(1),
  targets: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        detail: z.string().optional(),
      }),
    )
    .min(1),
  correctConnections: z
    .array(
      z.object({
        from: z.string().min(1),
        to: z.string().min(1),
      }),
    )
    .min(1),
})

export const ExerciseSchema = z.discriminatedUnion("kind", [
  ExerciseAnatomySchema,
  ExerciseABSchema,
  ExerciseTagFillSchema,
  ExercisePromptTaskSchema,
  ExerciseConversationGoalSchema,
  ExerciseToolSchemaAuthorSchema,
  ExerciseToolHandlerImplementSchema,
  ExerciseToolDescriptionSchema,
  ExerciseMCPDebugSchema,
  ExerciseStepOrderDndSchema,
  ExerciseSlotFillDndSchema,
  ExerciseWiringDndSchema,
])

export const StepDemoSchema = z.object({
  id: z.string().min(1),
  props: z.record(z.string(), z.unknown()).optional(),
})

// Same slug set used by ExerciseConversationGoalSchema.personaSlug. Kept inline
// (not imported from modules/cast) so the content layer has no dependency on
// the UI cast module.
export const CharacterSlugSchema = z.enum([
  "vega",
  "atlas",
  "echo",
  "forge",
  "orbit",
  "hex",
])

// Five stations (no atlas — captain has no domain). See docs/plan/10-estaciones.md.
export const StationSlugSchema = z.enum(["vega", "echo", "forge", "orbit", "hex"])

export const StepFrontmatterSchema = z
  .object({
    title: z.string().min(1),
    order: z.number().int().nonnegative(),
    estimatedMinutes: z.number().int().positive(),
    // Optional per-step XP override. Only applies to steps with `exercise`
    // (narrative/demo steps grant 0 XP regardless). Falls back to the
    // per-ExerciseKind default in `gamification/data.ts` when omitted.
    xp: z.number().int().nonnegative().optional(),
    exercise: ExerciseSchema.optional(),
    demo: StepDemoSchema.optional(),
    hints: z.array(z.string().min(1)).optional(),
    // Crew members featured in this step. First entry is the "lead" — drives
    // the mascot/tutor avatar surfaces. When omitted, the lead is derived from
    // the step's conversation-goal personaSlug, falling back to vega.
    characters: z.array(CharacterSlugSchema).optional(),
    // Primary station this step belongs to. Optional during the tagging
    // rollout; a follow-up refine will require it for `exercise` steps once
    // all 141 steps are tagged. See docs/plan/10-estaciones.md.
    station: StationSlugSchema.optional(),
    // Secondary stations whose domain is touched. Must not include the primary
    // station and must not contain duplicates.
    touches: z.array(StationSlugSchema).optional(),
    teaches: z.array(z.string().min(1)).optional(),
    requires: z.array(z.string().min(1)).optional(),
    referencesPatterns: z.array(z.string().min(1)).optional(),
    watchOutFor: z.array(z.string().min(1)).optional(),
    passThreshold: z.object({ rule: z.string().min(1) }).optional(),
  })
  .refine((data) => !(data.exercise && data.demo), {
    message: "A step cannot declare both `exercise` and `demo`.",
    path: ["demo"],
  })
  .refine(
    (data) => {
      if (!data.touches) return true
      const seen = new Set<string>()
      for (const slug of data.touches) {
        if (seen.has(slug)) return false
        seen.add(slug)
      }
      return true
    },
    { message: "`touches` must not contain duplicate stations.", path: ["touches"] },
  )
  .refine(
    (data) =>
      !data.station || !data.touches || !data.touches.includes(data.station),
    {
      message: "`touches` must not include the primary `station`.",
      path: ["touches"],
    },
  )

// Lead character for a step. Explicit `characters[0]` wins; otherwise we
// borrow the slug from a conversation-goal exercise so existing steps don't
// need re-authoring. Returns null when nothing maps — callers decide the
// fallback (mascot/tutor default to "vega").
export const resolveStepLeadCharacter = (
  fm: StepFrontmatter,
): CharacterSlug | null => {
  if (fm.characters && fm.characters.length > 0) return fm.characters[0]
  if (fm.exercise?.kind === "conversation-goal" && fm.exercise.personaSlug) {
    return fm.exercise.personaSlug
  }
  return null
}

// Daily quests are short mini-lessons of 5-8 exercise scenes played back
// to back. No narrative scenes for now — each scene is a deterministic
// exercise from the supported kinds. Player walks scene by scene; XP +
// streak credit happens only when the user clears the FULL quest. Order
// of `scenes` is the order the player walks.
//
// Minimum 5 scenes is a retention requirement, not arbitrary: under that
// the quest feels like a quiz and users blow through it in 30 seconds
// without the daily ritual landing. Build fails authored content with
// fewer scenes.
export const DailyFrontmatterSchema = z.object({
  title: z.string().min(1),
  intro: z.string().optional(),
  scenes: z.array(ExerciseSchema).min(5).max(8),
  station: StationSlugSchema.optional(),
  characters: z.array(CharacterSlugSchema).optional(),
  // Concept slugs this quest reinforces. Aligned with step frontmatter
  // `teaches:` so the service can match "quest covers something the user
  // has already seen in a step." Optional: an untagged quest is treated
  // as foundational/universal and stays eligible for every user.
  teaches: z.array(z.string().min(1)).optional(),
})

export const CourseYamlSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  order: z.number().int().nonnegative(),
  narrativeHook: z.string().optional(),
  estimatedMinutes: z.number().int().positive(),
})

export const TracksYamlSchema = z.object({
  tracks: z
    .array(
      z.object({
        slug: z.string().min(1),
        title: z.string().min(1),
        order: z.number().int().nonnegative(),
        description: z.string().min(1),
        courses: z.array(z.string().min(1)).min(1),
        // When true, the track is skipped by getNextStepForUser unless the
        // user has already started it. Used for the pre-flight bridge track
        // so new users default into Track 1 instead of programming basics.
        optional: z.boolean().optional(),
      }),
    )
    .min(1),
})
