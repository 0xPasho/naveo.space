"use server"

import { z } from "zod"

import { currentUser } from "@/server/auth"
import { getStep } from "@/modules/content/service"
import type { ContentLocale } from "@/modules/content/types"
import { getOrCreateUser } from "@/modules/users/service"

import { markStepCompleted } from "./service"

const InputSchema = z.object({
  trackSlug: z.string().min(1),
  courseSlug: z.string().min(1),
  stepSlug: z.string().min(1),
  locale: z.enum(["es", "en"]),
})

export type MarkStepViewedInput = z.infer<typeof InputSchema>

export type MarkStepViewedResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "not_found" | "invalid_input" | "has_exercise" }

// Marks a step as completed because the user advanced past it. Server
// validates the step actually has no exercise (otherwise progress should
// be driven by runExercise / passing the check, not by advancing).
export async function markStepViewed(
  input: MarkStepViewedInput,
): Promise<MarkStepViewedResult> {
  const parsed = InputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const clerkUser = await currentUser()
  if (!clerkUser) return { ok: false, error: "unauthorized" }

  const step = await getStep(
    parsed.data.stepSlug,
    parsed.data.locale as ContentLocale,
  )
  if (!step) return { ok: false, error: "not_found" }
  if (step.courseSlug !== parsed.data.courseSlug) {
    return { ok: false, error: "not_found" }
  }
  if (step.frontMatter.exercise) return { ok: false, error: "has_exercise" }

  const user = await getOrCreateUser(clerkUser.id)
  await markStepCompleted({
    userId: user.id,
    stepId: step.id,
    stepLocale: step.locale,
  })
  return { ok: true }
}
