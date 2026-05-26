import "server-only"

import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { generateObject, generateText } from "ai"
import { z } from "zod"

import { JUDGE_MODEL, MAX_OUTPUT_TOKENS } from "./data"
import { JUDGE_SYSTEM_PROMPT, buildJudgeUserMessage } from "./lib"
import type {
  JudgeRequest,
  JudgeVerdict,
  LLMTextRequest,
  LLMTextResponse,
} from "./types"

let cachedRouter: ReturnType<typeof createOpenRouter> | null = null

const getRouter = (): ReturnType<typeof createOpenRouter> => {
  if (cachedRouter) return cachedRouter
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to .env to enable LLM-judge checks.",
    )
  }
  cachedRouter = createOpenRouter({ apiKey })
  return cachedRouter
}

const toUsage = (
  usage: {
    inputTokens?: number
    outputTokens?: number
    inputTokenDetails?: { cacheReadTokens?: number; cacheWriteTokens?: number }
  } | undefined,
): LLMTextResponse["usage"] => ({
  inputTokens: usage?.inputTokens ?? 0,
  outputTokens: usage?.outputTokens ?? 0,
  cacheReadTokens: usage?.inputTokenDetails?.cacheReadTokens ?? 0,
  cacheWriteTokens: usage?.inputTokenDetails?.cacheWriteTokens ?? 0,
})

// Generic text-in / text-out wrapper. Used for any non-structured generation.
// Provider-specific options (Anthropic cache_control, etc.) can be added here
// later via the `providerOptions` parameter when we wire a runner.
export async function callModel(req: LLMTextRequest): Promise<LLMTextResponse> {
  const router = getRouter()
  const result = await generateText({
    model: router(req.model),
    system: req.system,
    prompt: req.userPrompt,
    maxOutputTokens: req.maxTokens ?? MAX_OUTPUT_TOKENS,
  })
  return { text: result.text, usage: toUsage(result.usage) }
}

// Multi-turn chat wrapper. `system` defines the persona; `messages` is the
// running transcript (alternating user/assistant). Returns the next
// assistant message. Used by conversation-goal exercises.
export async function callChat(args: {
  model: string
  system: string
  messages: { role: "user" | "assistant"; content: string }[]
  maxTokens?: number
}): Promise<LLMTextResponse> {
  const router = getRouter()
  const result = await generateText({
    model: router(args.model),
    system: args.system,
    messages: args.messages,
    maxOutputTokens: args.maxTokens ?? MAX_OUTPUT_TOKENS,
  })
  return { text: result.text, usage: toUsage(result.usage) }
}

const VerdictSchema = z.object({
  passed: z.boolean(),
  reason: z.string().min(1),
})

// Run a single LLM-judge against an output. Always returns a verdict; on
// parse failure or refusal the verdict is { passed: false, reason: <why> }.
// Never throws — judge failures are first-class results, not exceptions.
export async function callJudge(req: JudgeRequest): Promise<JudgeVerdict> {
  try {
    const router = getRouter()
    const result = await generateObject({
      model: router(req.model ?? JUDGE_MODEL),
      schema: VerdictSchema,
      system: JUDGE_SYSTEM_PROMPT,
      prompt: buildJudgeUserMessage(req),
      maxOutputTokens: 256,
    })
    return result.object
  } catch (err) {
    const name = err instanceof Error ? err.name : ""
    if (name === "RateLimitError") {
      return { passed: false, reason: "judge:rate-limited" }
    }
    if (name === "NoObjectGeneratedError" || name === "TypeValidationError") {
      return { passed: false, reason: "judge:invalid-shape" }
    }
    if (name === "APICallError") {
      return { passed: false, reason: "judge:api-error" }
    }
    return { passed: false, reason: "judge:unknown-error" }
  }
}
