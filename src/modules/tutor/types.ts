// Re-uses the same single-turn message shape as conversation-goal exercises.
export type TutorMessage = {
  role: "user" | "assistant"
  content: string
}

export type AskTutorInput = {
  trackSlug: string
  courseSlug: string
  stepSlug: string
  locale: string
  transcript: TutorMessage[]
}

export type AskTutorResult =
  | { ok: true; reply: TutorMessage; gemsAfter: number }
  | {
      ok: false
      error:
        | "unauthorized"
        | "rate_limited"
        | "not_found"
        | "invalid_input"
        | "model_error"
        | "no_gems"
    }

export type PersonaSlug = "vega" | "atlas" | "echo" | "forge" | "orbit" | "hex"
