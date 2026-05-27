"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { currentUser } from "@/server/auth"
import { getStep } from "@/modules/content/service"
import type { ContentLocale } from "@/modules/content/types"
import { getWallet, spendHeart } from "@/modules/economy/service"
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
  | {
      ok: false
      error:
        | "unauthorized"
        | "not_found"
        | "invalid_input"
        | "no_hints"
        | "out_of_range"
        | "no_hearts"
    }

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

  // Idempotency check before any writes: if this hint index is already
  // revealed, the call is free and a no-op. Multi-tab / refresh users don't
  // get charged twice.
  const prior = await db.progress.findUnique({
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
    const wallet = await getWallet(user.id)
    return { ok: true, heartsAfter: wallet.hearts, alreadyUsed: true }
  }

  // New reveal — must have at least one heart to pay for it. Refuse up front
  // so we never bump Progress.hintsUsed while spendHeart silently no-ops on
  // an empty wallet. Matches the runDailyQuestScene guard.
  const wallet = await getWallet(user.id)
  if (wallet.hearts <= 0) return { ok: false, error: "no_hearts" }

  // Spend the heart BEFORE bumping Progress so a no-heart wallet never leaves
  // hintsUsed advanced for free. spendHeart is atomic (conditional updateMany),
  // so concurrent calls can't both succeed when the user has 1 heart.
  const heartsAfter = await spendHeart({
    userId: user.id,
    reason: "hint-used",
  }).catch((err) => {
    console.error("[hearts] useHint → spendHeart failed", err)
    return -1
  })
  if (heartsAfter === 0) {
    // updateMany matched 0 rows — the wallet emptied between the guard above
    // and the spend. Refuse without writing hintsUsed.
    return { ok: false, error: "no_hearts" }
  }

  // Conditional upsert: only advance hintsUsed when the requested index is
  // strictly higher than what's already recorded. A concurrent low-index
  // reveal can't regress the counter and re-charge a later hint.
  const targetUsed = parsed.data.hintIndex + 1
  await db.progress.upsert({
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
      hintsUsed: targetUsed,
    },
    update: {},
  })
  await db.progress.updateMany({
    where: {
      userId: user.id,
      stepId: step.id,
      stepLocale: step.locale,
      hintsUsed: { lt: targetUsed },
    },
    data: { hintsUsed: targetUsed },
  })

  // Hint reveal spent a heart; force the HUD to re-fetch wallet so the
  // HeartsPill updates without waiting for a navigation.
  revalidatePath("/", "layout")

  return {
    ok: true,
    heartsAfter: heartsAfter < 0 ? 0 : heartsAfter,
    alreadyUsed: false as const,
  }
}
