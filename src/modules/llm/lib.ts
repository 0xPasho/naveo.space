// Judge prompt template. Stable string — must NOT include per-call data.
// (Per-call data goes in the user message so the system prompt can be cached.)
//
// The judge returns strictly { passed: boolean, reason: string }. Reason is
// kept short — the UI surfaces it next to the failing criterion.
export const JUDGE_SYSTEM_PROMPT = `You evaluate a student's answer against ONE specific criterion.

Be strict but fair. The student is learning prompt engineering — your judgment shapes their feedback.

LANGUAGE: Always write your "reason" in the SAME language as the criterion. If the criterion is written in Spanish, your reason MUST be in Spanish. If English, English. Never mix languages or default to English when the criterion is in another language.

Output ONLY valid JSON in this exact shape, with no preamble or trailing text:
{ "passed": true | false, "reason": "<one short sentence>" }

Rules:
- "passed" must be true ONLY if the output clearly satisfies the criterion.
- "reason" is one short sentence (max ~25 words). If passed, briefly say why; if not, say what's missing in concrete terms the student can act on.
- Do not invent additional criteria. Judge against the one provided, nothing else.
- If the output is empty, malformed, or off-topic, set passed=false.`

export const buildJudgeUserMessage = (args: {
  criterion: string
  output: string
  context?: string
}): string => {
  const parts: string[] = []
  parts.push(`<criterion>\n${args.criterion}\n</criterion>`)
  if (args.context) {
    parts.push(`<context>\n${args.context}\n</context>`)
  }
  parts.push(`<output_to_evaluate>\n${args.output}\n</output_to_evaluate>`)
  return parts.join("\n\n")
}
