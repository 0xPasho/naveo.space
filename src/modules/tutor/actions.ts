"use server"

import { z } from "zod"

import { GEM_COST } from "@/modules/economy/data"
import { getWallet, spendGems } from "@/modules/economy/service"
import { ChatMessageSchema } from "@/modules/exercises/lib"
import { DAILY_RUN_LIMIT } from "@/modules/exercises/data"
import { getOrCreateUser } from "@/modules/users/service"
import { currentUser } from "@/server/auth"
import { checkAndIncrement } from "@/server/rate-limit"

import { askTutor as askTutorService } from "./service"
import type { AskTutorInput, AskTutorResult } from "./types"

const InputSchema = z.object({
  trackSlug: z.string().min(1),
  courseSlug: z.string().min(1),
  stepSlug: z.string().min(1),
  locale: z.string().min(1),
  transcript: z.array(ChatMessageSchema).min(1).max(40),
})

export const ASK_TUTOR_GEM_COST = GEM_COST["ask-crew"]

export async function askTutor(input: AskTutorInput): Promise<AskTutorResult> {
  const parsed = InputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const clerkUser = await currentUser()
  if (!clerkUser) return { ok: false, error: "unauthorized" }

  const user = await getOrCreateUser(clerkUser.id)
  const limit = await checkAndIncrement(user.id, DAILY_RUN_LIMIT)
  if (!limit.ok) return { ok: false, error: "rate_limited" }

  // Up-front gem guard. Matches the hearts-for-hints pattern: refuse the
  // call before doing any paid work (LLM round-trip) when the wallet can't
  // cover the cost. The client also disables the send button, but a forged
  // request would land here.
  const wallet = await getWallet(user.id)
  if (wallet.gems < ASK_TUTOR_GEM_COST) {
    return { ok: false, error: "no_gems" }
  }

  const result = await askTutorService(parsed.data)
  if (!result.ok) {
    if (result.error === "not-found") return { ok: false, error: "not_found" }
    return { ok: false, error: "model_error" }
  }

  // Charge AFTER a successful reply so a failed model call doesn't burn
  // gems. spendGems is race-safe: if the wallet emptied between the read
  // above and this decrement (e.g. shop purchase in another tab), it
  // returns null and we hand back the answer without charging. Cheaper to
  // eat the rare freebie than to refund.
  const gemsAfter = await spendGems({
    userId: user.id,
    amount: ASK_TUTOR_GEM_COST,
    reason: "ask-crew",
    meta: {
      trackSlug: parsed.data.trackSlug,
      courseSlug: parsed.data.courseSlug,
      stepSlug: parsed.data.stepSlug,
    },
  })

  return {
    ok: true,
    reply: { role: "assistant", content: result.reply },
    // When spendGems returns null the decrement didn't happen (race lost the
    // updateMany predicate). Surface the pre-call balance instead of the
    // optimistic post-charge value so the HUD doesn't briefly flash a wrong
    // lower number. router.refresh() on the client will reconcile to the
    // real balance regardless.
    gemsAfter: gemsAfter ?? wallet.gems,
  }
}
