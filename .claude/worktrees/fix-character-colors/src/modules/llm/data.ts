// OpenRouter model identifiers — format: "<provider>/<model>".
// All calls go through the Vercel AI SDK + OpenRouter so we can swap
// providers (Anthropic, OpenAI, Mistral, ...) without touching the call site.

// Default model for LLM-judge checks. Cheap + fast — judges run many times
// per attempt so cost matters. See docs/plan/06-architecture.md.
export const JUDGE_MODEL = "anthropic/claude-haiku-4.5"

// Default model for "student task" runs (when an exercise asks the LLM to
// produce an output that the rubric then evaluates). Stays on Haiku to
// keep per-attempt cost under the plan's < $0.01 target for cheap steps.
export const TASK_MODEL = "anthropic/claude-haiku-4.5"

// Bumped task model for steps that explicitly need more reasoning.
// Authors can override via exercise frontmatter `model:` once Phase 2 wires it.
export const TASK_MODEL_HEAVY = "anthropic/claude-sonnet-4.6"

// Hard ceiling for any single LLM call — protects against runaway prompts.
export const MAX_OUTPUT_TOKENS = 4096

export type ModelId = string
