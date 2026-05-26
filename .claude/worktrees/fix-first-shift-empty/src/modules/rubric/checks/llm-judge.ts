import "server-only"

import { callJudge } from "@/modules/llm/service"

import type { CheckResult, LLMJudgeCheck } from "../types"

export async function runLLMJudge(
  check: LLMJudgeCheck,
  output: string,
  context?: string,
): Promise<CheckResult> {
  const verdict = await callJudge({
    criterion: check.criterion,
    output,
    context,
    model: check.model,
  })
  return {
    id: check.id,
    passed: verdict.passed,
    reason: verdict.reason,
  }
}
