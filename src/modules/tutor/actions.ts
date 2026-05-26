"use server"

import { z } from "zod"

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

export async function askTutor(input: AskTutorInput): Promise<AskTutorResult> {
  const parsed = InputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const clerkUser = await currentUser()
  if (!clerkUser) return { ok: false, error: "unauthorized" }

  const user = await getOrCreateUser(clerkUser.id)
  const limit = await checkAndIncrement(user.id, DAILY_RUN_LIMIT)
  if (!limit.ok) return { ok: false, error: "rate_limited" }

  const result = await askTutorService(parsed.data)
  if (!result.ok) {
    if (result.error === "not-found") return { ok: false, error: "not_found" }
    return { ok: false, error: "model_error" }
  }

  return { ok: true, reply: { role: "assistant", content: result.reply } }
}
