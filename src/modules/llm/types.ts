import type { ModelId } from "./data"

export type { ModelId }

export type LLMTextRequest = {
  model: ModelId
  // System prompt — kept stable across calls so the provider's prompt cache
  // (when supported via providerOptions) can reuse it.
  system: string
  // User message content (single user turn for our use cases).
  userPrompt: string
  maxTokens?: number
}

export type LLMTextResponse = {
  text: string
  usage: {
    inputTokens: number
    outputTokens: number
    cacheReadTokens: number
    cacheWriteTokens: number
  }
}

// Result of a single LLM-judge invocation. The judge always returns
// { passed, reason } — generateObject + Zod validates this structure.
export type JudgeVerdict = {
  passed: boolean
  reason: string
}

export type JudgeRequest = {
  // The criterion the output must satisfy (from the rubric).
  criterion: string
  // The output being evaluated. For most exercises this is the model's
  // response; for `prompt-explain` style steps it's the student's text.
  output: string
  // Optional context the judge should know about (e.g. the original
  // task description, the test-case input).
  context?: string
  model?: ModelId
}
