// Translate a check `reason` value into user-facing copy.
//
// Reasons come in two shapes:
//
//   1. Tag-style strings emitted by deterministic checks or transport errors.
//      Examples: "json:invalid", "missing:alias,puesto", "length:too-short:12<50",
//      "task-model:error". These are short, contain `:`, and have no spaces.
//
//   2. Full-sentence reasons emitted by LLM judges. These are user-facing
//      already (the judge prompt asks for a short sentence in the criterion's
//      language). They typically contain spaces and end with a period.
//
// We translate (1) via the i18n bundle (lessons.checks namespace) and pass
// (2) through unchanged.

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string

const isTagReason = (s: string): boolean => {
  // Heuristic: tags have no spaces, length under ~60 chars, and are not
  // sentences (no leading uppercase Spanish/English word followed by space).
  if (s.includes(" ")) return false
  if (s.length > 60) return false
  return true
}

export const translateReason = (
  t: TranslateFn,
  reason: string | undefined,
): string | undefined => {
  if (!reason) return undefined
  if (!isTagReason(reason)) return reason

  // Split "head:param" — head is the lookup key, param holds optional data.
  const colonAt = reason.indexOf(":")
  const head = colonAt === -1 ? reason : reason.slice(0, colonAt)
  const param = colonAt === -1 ? "" : reason.slice(colonAt + 1)

  // Multi-segment tags (e.g., "json:invalid", "regex:no-match") use the full
  // string as the i18n key. Param-bearing tags (e.g., "missing:alias,puesto")
  // use the head as the key and pass the param as a variable.
  switch (head) {
    case "missing": {
      const out = safeT(t, "missing", { keys: param })
      return out ?? reason
    }
    case "length": {
      // "length:too-short:12<50" or "length:too-long:200>100"
      const sub = param.split(":")[0] // "too-short" | "too-long"
      const numbers = (param.split(":")[1] ?? "").split(/[<>]/)
      const len = numbers[0] ?? ""
      const out = safeT(t, `length:${sub}`, { len })
      return out ?? reason
    }
    case "judge": {
      const out = safeT(t, `judge:${param}`)
      return out ?? reason
    }
    case "task-model": {
      const out = safeT(t, `task-model:${param}`)
      return out ?? reason
    }
    case "json":
    case "regex":
    case "contains":
    case "exec":
    case "skipped": {
      const out = safeT(t, `${head}:${param}`)
      return out ?? reason
    }
    case "unknown-check":
      return safeT(t, "unknown-check") ?? reason
    default: {
      // Tags without a colon, like "kind-mismatch" or "wrong-choice".
      const out = safeT(t, head)
      return out ?? reason
    }
  }
}

// next-intl throws on missing keys in dev. Wrap so a missing translation
// falls back to the raw tag instead of crashing the lesson player.
const safeT = (
  t: TranslateFn,
  key: string,
  vars?: Record<string, string | number>,
): string | null => {
  try {
    return t(key, vars)
  } catch {
    return null
  }
}
