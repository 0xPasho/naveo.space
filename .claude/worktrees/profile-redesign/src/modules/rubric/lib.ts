import crypto from "node:crypto"

import { z } from "zod"

import { DETERMINISTIC_CHECK_KINDS } from "./data"
import type { CheckResult, Rubric } from "./types"

export const DeterministicCheckSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("deterministic"),
  check: z.enum(DETERMINISTIC_CHECK_KINDS),
  args: z.unknown().optional(),
  criterion: z.string().min(1),
})

export const LLMJudgeCheckSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("llm-judge"),
  criterion: z.string().min(1),
  model: z.string().optional(),
})

export const CheckSchema = z.discriminatedUnion("kind", [
  DeterministicCheckSchema,
  LLMJudgeCheckSchema,
])

export const RubricSchema = z.object({
  checks: z.array(CheckSchema).min(1),
  passThreshold: z
    .union([
      z.object({ rule: z.literal("all-criteria") }),
      z.object({ rule: z.literal("all-criteria-all-cases") }),
      z.object({
        rule: z.literal("threshold"),
        minPercent: z.number().min(0).max(100),
      }),
    ])
    .optional(),
})

// Stable hash of a rubric definition. Used as part of the cache key for
// runs — if the rubric changes, cached entries no longer apply.
export const hashRubric = (rubric: Rubric): string => {
  const canonical = JSON.stringify(rubric, Object.keys(rubric).sort())
  return crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 16)
}

// Decide overall passed flag from individual check results, per the
// rubric's threshold rule. Defaults to "all-criteria".
export const decidePassed = (
  rubric: Rubric,
  results: CheckResult[],
): boolean => {
  if (results.length === 0) return false
  const rule = rubric.passThreshold?.rule ?? "all-criteria"
  if (rule === "threshold") {
    const minPercent = (
      rubric.passThreshold as { rule: "threshold"; minPercent: number }
    ).minPercent
    const pct = (results.filter((r) => r.passed).length / results.length) * 100
    return pct >= minPercent
  }
  // "all-criteria" and "all-criteria-all-cases" both require every result
  // to pass. The "all-cases" semantics live in the runner that constructs
  // results across multiple test cases.
  return results.every((r) => r.passed)
}

// Merge multiple result lists (e.g. one per test case) into a single list
// by check id, taking the worst result per check ("any fail = fail").
export const mergeResults = (lists: CheckResult[][]): CheckResult[] => {
  if (lists.length === 0) return []
  if (lists.length === 1) return lists[0]
  const byId = new Map<string, CheckResult>()
  for (const list of lists) {
    for (const r of list) {
      const prev = byId.get(r.id)
      if (!prev) {
        byId.set(r.id, r)
        continue
      }
      // Worst-of: failure beats success; on tie, keep the existing reason.
      if (prev.passed && !r.passed) {
        byId.set(r.id, r)
      }
    }
  }
  return Array.from(byId.values())
}
