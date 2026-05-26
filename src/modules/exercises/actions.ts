"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { currentUser } from "@/server/auth"
import { checkAndIncrement } from "@/server/rate-limit"
import { hasHearts } from "@/modules/economy/service"
import { getOrCreateUser } from "@/modules/users/service"

import { DAILY_RUN_LIMIT } from "./data"
import { ChatMessageSchema, ExercisePayloadSchema } from "./lib"
import { chatTurn, loadStep, runForUser } from "./service"
import type {
  ChatMessage,
  RunExerciseInput,
  RunExerciseResult,
} from "./types"

const InputSchema = z.object({
  trackSlug: z.string().min(1),
  courseSlug: z.string().min(1),
  stepSlug: z.string().min(1),
  locale: z.string().min(1),
  payload: ExercisePayloadSchema,
})

export async function runExercise(input: RunExerciseInput): Promise<RunExerciseResult> {
  const parsed = InputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const clerkUser = await currentUser()
  if (!clerkUser) return { ok: false, error: "unauthorized" }

  const user = await getOrCreateUser(clerkUser.id)

  const limit = await checkAndIncrement(user.id, DAILY_RUN_LIMIT)
  if (!limit.ok) return { ok: false, error: "rate_limited" }

  const step = await loadStep(parsed.data)
  if (!step) return { ok: false, error: "not_found" }

  // Server-side hearts gate. The UI also disables Comprobar at 0, but this
  // closes the gap for replay / devtools bypass — and short-circuits the
  // attempt before we burn a rubric LLM call we'd refuse to count anyway.
  if (!(await hasHearts(user.id))) return { ok: false, error: "no_hearts" }

  const result = await runForUser({
    userId: user.id,
    step,
    payload: parsed.data.payload,
  })

  // Invalidate every server-rendered surface that reads wallet/xp/streak so
  // the HUD (in the (player) + (site) layouts) reflects the new hearts and
  // streak immediately on the client's router.refresh(). Without this, a
  // soft refresh re-runs the page but the layout's getWallet/getXpSnapshot
  // come back cached and the HUD shows stale values until the next nav.
  revalidatePath("/", "layout")

  return { ok: true, result }
}

// ---------- Conversation turn (per-message during a chat) ----------

const ChatTurnInputSchema = z.object({
  trackSlug: z.string().min(1),
  courseSlug: z.string().min(1),
  stepSlug: z.string().min(1),
  locale: z.string().min(1),
  transcript: z.array(ChatMessageSchema).min(1).max(40),
})

export type SendChatTurnInput = z.infer<typeof ChatTurnInputSchema>

export type SendChatTurnResult =
  | { ok: true; reply: ChatMessage }
  | {
      ok: false
      error:
        | "unauthorized"
        | "rate_limited"
        | "not_found"
        | "invalid_input"
        | "model_error"
        | "wrong_kind"
        | "max_turns_exceeded"
    }

export async function sendChatTurn(
  input: SendChatTurnInput,
): Promise<SendChatTurnResult> {
  const parsed = ChatTurnInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const clerkUser = await currentUser()
  if (!clerkUser) return { ok: false, error: "unauthorized" }

  const user = await getOrCreateUser(clerkUser.id)
  const limit = await checkAndIncrement(user.id, DAILY_RUN_LIMIT)
  if (!limit.ok) return { ok: false, error: "rate_limited" }

  const step = await loadStep(parsed.data)
  if (!step) return { ok: false, error: "not_found" }

  const result = await chatTurn({ step, transcript: parsed.data.transcript })
  if (!result.ok) {
    if (result.error === "step-kind-mismatch") return { ok: false, error: "wrong_kind" }
    if (result.error === "max-turns-exceeded")
      return { ok: false, error: "max_turns_exceeded" }
    return { ok: false, error: "model_error" }
  }

  return { ok: true, reply: { role: "assistant", content: result.reply } }
}
