import type { ModelId } from "@/modules/llm/types"

import type { DeterministicCheckKind } from "./data"

export type { DeterministicCheckKind }

// A single check inside a rubric. Kind discriminates the runner that
// evaluates it.
export type DeterministicCheck = {
  id: string
  kind: "deterministic"
  // The deterministic check function to run (json-parse, has-keys, etc.).
  check: DeterministicCheckKind
  // Per-check args. Shape depends on `check` — validated at runtime.
  args?: unknown
  criterion: string
}

export type LLMJudgeCheck = {
  id: string
  kind: "llm-judge"
  criterion: string
  model?: ModelId
}

export type Check = DeterministicCheck | LLMJudgeCheck

export type Rubric = {
  // Each check evaluates one criterion. Order matters: deterministic
  // checks always run first, judges only run if deterministics pass
  // (saves API cost on bad outputs).
  checks: Check[]
  // How to decide passed-overall:
  // - all-criteria        — every check must pass
  // - all-criteria-all-cases — every check on every test case must pass
  // - threshold           — at least N% of checks pass (use `args`)
  passThreshold?:
    | { rule: "all-criteria" }
    | { rule: "all-criteria-all-cases" }
    | { rule: "threshold"; minPercent: number }
}

export type CheckResult = {
  id: string
  passed: boolean
  // Short, optionally translated reason. For LLM-judge it's the model's
  // own reason; for deterministic it's a tag like "missing:name,age".
  reason?: string
}

export type RubricResult = {
  passed: boolean
  checks: CheckResult[]
}
