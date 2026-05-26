// Catalog of deterministic check kinds. Each is implemented in
// checks/deterministic.ts. Adding a new kind requires updating both files +
// the Zod schema in lib.ts.
export const DETERMINISTIC_CHECK_KINDS = [
  "json-parse",
  "has-keys",
  "regex-match",
  "contains",
  "length-between",
  "runs-without-error",
] as const

export type DeterministicCheckKind = (typeof DETERMINISTIC_CHECK_KINDS)[number]

// Bumped when the rubric pipeline changes shape in a way that should
// invalidate cached entries. Bump on: new check kind, changed semantics,
// changed judge prompt template.
export const RUBRIC_VERSION = "v1"
