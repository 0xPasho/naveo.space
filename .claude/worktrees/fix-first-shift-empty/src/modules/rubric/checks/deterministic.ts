import "server-only"

import type { CheckResult, DeterministicCheck } from "../types"

// Each function takes the output to evaluate plus the check's args, and
// returns { passed, reason? }. Reason is a short tag (not user-facing
// directly — UI maps it to translated copy).

const stripCodeFences = (s: string): string =>
  s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim()

const checkers: Record<
  DeterministicCheck["check"],
  (output: string, args: unknown) => { passed: boolean; reason?: string }
> = {
  "json-parse": (output) => {
    try {
      JSON.parse(stripCodeFences(output))
      return { passed: true }
    } catch {
      return { passed: false, reason: "json:invalid" }
    }
  },

  "has-keys": (output, args) => {
    const expected = Array.isArray(args) ? (args as string[]) : []
    if (expected.length === 0) return { passed: true }
    let parsed: unknown
    try {
      parsed = JSON.parse(stripCodeFences(output))
    } catch {
      return { passed: false, reason: "json:invalid" }
    }
    if (typeof parsed !== "object" || parsed === null) {
      return { passed: false, reason: "json:not-object" }
    }
    const obj = parsed as Record<string, unknown>
    const missing = expected.filter((k) => !(k in obj))
    if (missing.length > 0) {
      return { passed: false, reason: `missing:${missing.join(",")}` }
    }
    return { passed: true }
  },

  "regex-match": (output, args) => {
    let pattern = ""
    let flags = ""
    if (typeof args === "string") {
      pattern = args
    } else if (args && typeof args === "object") {
      const obj = args as { pattern?: unknown; flags?: unknown }
      if ("pattern" in obj) pattern = String(obj.pattern ?? "")
      if ("flags" in obj) flags = String(obj.flags ?? "")
    }
    if (!pattern) return { passed: false, reason: "regex:empty-pattern" }
    try {
      const re = new RegExp(pattern, flags)
      return re.test(output)
        ? { passed: true }
        : { passed: false, reason: "regex:no-match" }
    } catch {
      return { passed: false, reason: "regex:invalid-pattern" }
    }
  },

  contains: (output, args) => {
    const needle = typeof args === "string" ? args : ""
    if (!needle) return { passed: false, reason: "contains:empty-needle" }
    return output.includes(needle)
      ? { passed: true }
      : { passed: false, reason: "contains:not-found" }
  },

  "length-between": (output, args) => {
    const range =
      args && typeof args === "object"
        ? (args as { min?: unknown; max?: unknown })
        : {}
    const min = typeof range.min === "number" ? range.min : 0
    const max = typeof range.max === "number" ? range.max : Number.POSITIVE_INFINITY
    const len = output.length
    if (len < min) return { passed: false, reason: `length:too-short:${len}<${min}` }
    if (len > max) return { passed: false, reason: `length:too-long:${len}>${max}` }
    return { passed: true }
  },

  "runs-without-error": (output) => {
    // Placeholder: real handler-execution sandbox is Phase 4.
    // For now we treat a non-empty output as "ran".
    return output.trim().length > 0
      ? { passed: true }
      : { passed: false, reason: "exec:empty-output" }
  },
}

export const runDeterministic = (
  check: DeterministicCheck,
  output: string,
): CheckResult => {
  const fn = checkers[check.check]
  if (!fn) {
    return { id: check.id, passed: false, reason: `unknown-check:${check.check}` }
  }
  const r = fn(output, check.args)
  return { id: check.id, passed: r.passed, reason: r.reason }
}
