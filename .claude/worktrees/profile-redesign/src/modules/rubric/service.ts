import "server-only"

import { runDeterministic } from "./checks/deterministic"
import { runLLMJudge } from "./checks/llm-judge"
import { decidePassed } from "./lib"
import type { CheckResult, Rubric, RubricResult } from "./types"

type RunArgs = {
  rubric: Rubric
  // The output to evaluate. For prompt-task / prompt-iterate this is the
  // model's response; for prompt-explain it's the student's text.
  output: string
  // Optional context the LLM-judge needs (e.g. the original task,
  // test-case input). Not used by deterministic checks.
  context?: string
}

// Run all checks. Deterministic checks run first; LLM-judge checks run
// only if every deterministic check passed (saves API cost on bad outputs
// per the plan's cost-control strategy).
export async function runRubric(args: RunArgs): Promise<RubricResult> {
  const { rubric, output, context } = args

  const detChecks = rubric.checks.filter((c) => c.kind === "deterministic")
  const judgeChecks = rubric.checks.filter((c) => c.kind === "llm-judge")

  const detResults: CheckResult[] = detChecks.map((c) =>
    runDeterministic(c, output),
  )

  const allDetPassed = detResults.every((r) => r.passed)

  let judgeResults: CheckResult[] = []
  if (allDetPassed && judgeChecks.length > 0) {
    judgeResults = await Promise.all(
      judgeChecks.map((c) => runLLMJudge(c, output, context)),
    )
  } else if (judgeChecks.length > 0) {
    // Deterministic gate failed — record judge checks as "skipped" rather
    // than absent so the UI can show the full criteria list.
    judgeResults = judgeChecks.map((c) => ({
      id: c.id,
      passed: false,
      reason: "skipped:deterministic-failed",
    }))
  }

  // Preserve original rubric order in the merged result list.
  const byId = new Map<string, CheckResult>()
  for (const r of [...detResults, ...judgeResults]) byId.set(r.id, r)
  const checks: CheckResult[] = rubric.checks
    .map((c) => byId.get(c.id))
    .filter((r): r is CheckResult => r !== undefined)

  return {
    passed: decidePassed(rubric, checks),
    checks,
  }
}
