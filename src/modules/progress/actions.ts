"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { currentUser } from "@/server/auth"
import { getStep } from "@/modules/content/service"
import type { ContentLocale } from "@/modules/content/types"
import { spendHeart } from "@/modules/economy/service"
import { getOrCreateUser } from "@/modules/users/service"
import { db } from "@/server/db"

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
    parsed.data.courseSlug,
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
  // Narrative step completions bump the streak (recordActivity runs inside
  // markStepCompleted). Invalidate the layout so the HUD's StreakPill picks
  // up the new value on the client's next refresh.
  revalidatePath("/", "layout")
  return { ok: true }
}

// ---------- useHint ----------

const HintInputSchema = z.object({
  trackSlug: z.string().min(1),
  courseSlug: z.string().min(1),
  stepSlug: z.string().min(1),
  locale: z.enum(["es", "en"]),
  // The hint index the user is revealing (0-based). Idempotency is keyed on
  // this — if Progress.hintsUsed > hintIndex already, the call is a no-op.
  hintIndex: z.number().int().nonnegative(),
})

export type UseHintInput = z.infer<typeof HintInputSchema>

export type UseHintResult =
  | { ok: true; heartsAfter: number; alreadyUsed: boolean }
  | { ok: false; error: "unauthorized" | "not_found" | "invalid_input" | "no_hints" | "out_of_range" }

// Reveals one hint. Spends 1 heart per **newly revealed** hint — calling
// twice for the same index is a no-op (idempotent). The client tracks its
// own `revealed` state and calls once per click, so the typical pattern is
// "click → server spends 1 heart → UI shows hint".
export async function useHint(input: UseHintInput): Promise<UseHintResult> {
  const parsed = HintInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const clerkUser = await currentUser()
  if (!clerkUser) return { ok: false, error: "unauthorized" }

  const step = await getStep(
    parsed.data.stepSlug,
    parsed.data.locale as ContentLocale,
    parsed.data.courseSlug,
  )
  if (!step) return { ok: false, error: "not_found" }
  if (step.courseSlug !== parsed.data.courseSlug) {
    return { ok: false, error: "not_found" }
  }

  const hints = step.frontMatter.hints ?? []
  if (hints.length === 0) return { ok: false, error: "no_hints" }
  if (parsed.data.hintIndex >= hints.length) {
    return { ok: false, error: "out_of_range" }
  }

  const user = await getOrCreateUser(clerkUser.id)

  // Atomic: only spend a heart + bump counter if we're crossing the
  // `hintsUsed = hintIndex` threshold. Re-reveals of an already-spent hint
  // are no-ops so multi-tab / refresh users don't get charged twice.
  const result = await db.$transaction(async (tx) => {
    const prior = await tx.progress.findUnique({
      where: {
        userId_stepId_stepLocale: {
          userId: user.id,
          stepId: step.id,
          stepLocale: step.locale,
        },
      },
    })
    const currentUsed = prior?.hintsUsed ?? 0
    if (currentUsed > parsed.data.hintIndex) {
      return { alreadyUsed: true as const }
    }
    await tx.progress.upsert({
      where: {
        userId_stepId_stepLocale: {
          userId: user.id,
          stepId: step.id,
          stepLocale: step.locale,
        },
      },
      create: {
        userId: user.id,
        stepId: step.id,
        stepLocale: step.locale,
        status: "in_progress",
        attempts: 0,
        hintsUsed: parsed.data.hintIndex + 1,
      },
      update: {
        hintsUsed: parsed.data.hintIndex + 1,
      },
    })
    return { alreadyUsed: false as const }
  })

  if (result.alreadyUsed) {
    // Re-read wallet for the up-to-date hearts count to return.
    const wallet = await import("@/modules/economy/service").then((m) =>
      m.getWallet(user.id),
    )
    return { ok: true, heartsAfter: wallet.hearts, alreadyUsed: true }
  }

  const heartsAfter = await spendHeart({
    userId: user.id,
    reason: "hint-used",
  }).catch((err) => {
    console.error("[hearts] useHint → spendHeart failed", err)
    return -1
  })

  // Hint reveal spent a heart; force the HUD to re-fetch wallet so the
  // HeartsPill updates without waiting for a navigation.
  revalidatePath("/", "layout")

  return {
    ok: true,
    heartsAfter: heartsAfter < 0 ? 0 : heartsAfter,
    alreadyUsed: false,
  }
}
