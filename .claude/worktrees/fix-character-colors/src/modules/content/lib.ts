import crypto from "node:crypto"

import { z } from "zod"

import { CheckSchema, RubricSchema } from "@/modules/rubric/lib"

import { EXERCISE_KINDS, PIECE_TYPES, RELATION_KINDS, SUPPORTED_LOCALES } from "./data"

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
  personaSlug: z.enum(["vega", "atlas", "echo", "forge"]).optional(),
  personaSystemPrompt: z.string().min(1),
  personaOpener: z.string().optional(),
  maxTurns: z.number().int().min(1).max(20),
  rubric: z.array(CheckSchema).min(1),
  model: z.string().optional(),
  passThreshold: RubricSchema.shape.passThreshold,
})

export const ExerciseSchema = z.discriminatedUnion("kind", [
  ExerciseAnatomySchema,
  ExerciseABSchema,
  ExerciseTagFillSchema,
  ExercisePromptTaskSchema,
  ExerciseConversationGoalSchema,
])

export const StepDemoSchema = z.object({
  id: z.string().min(1),
  props: z.record(z.string(), z.unknown()).optional(),
})

export const StepFrontmatterSchema = z
  .object({
    title: z.string().min(1),
    order: z.number().int().nonnegative(),
    estimatedMinutes: z.number().int().positive(),
    exercise: ExerciseSchema.optional(),
    demo: StepDemoSchema.optional(),
    hints: z.array(z.string().min(1)).optional(),
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
      }),
    )
    .min(1),
})
