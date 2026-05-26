"use server"

import { z } from "zod"

import { currentUser } from "@/server/auth"
import { checkAndIncrement } from "@/server/rate-limit"
import { DAILY_RUN_LIMIT } from "@/modules/exercises/data"
import { TASK_MODEL } from "@/modules/llm/data"
import { callModel } from "@/modules/llm/service"
import { getOrCreateUser } from "@/modules/users/service"

const InputSchema = z.object({
  prompt: z.string().min(1).max(8000),
})

export type RunPlaygroundInput = z.infer<typeof InputSchema>

export type RunPlaygroundResult =
  | { ok: true; output: string }
  | {
      ok: false
      error:
        | "unauthorized"
        | "rate_limited"
        | "invalid_input"
        | "model_error"
    }

// Single-shot prompt run for the playground demo. No grading, no rubric —
// just text-in / text-out. Shares the per-user daily run limit with graded
// exercises, so abuse can't tip the bill.
export async function runPlayground(
  input: RunPlaygroundInput,
): Promise<RunPlaygroundResult> {
  const parsed = InputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const clerkUser = await currentUser()
  if (!clerkUser) return { ok: false, error: "unauthorized" }

  const user = await getOrCreateUser(clerkUser.id)
  const limit = await checkAndIncrement(user.id, DAILY_RUN_LIMIT)
  if (!limit.ok) return { ok: false, error: "rate_limited" }

  try {
    const r = await callModel({
      model: TASK_MODEL,
      system: "",
      userPrompt: parsed.data.prompt,
      maxTokens: 1024,
    })
    return { ok: true, output: r.text }
  } catch {
    return { ok: false, error: "model_error" }
  }
}
