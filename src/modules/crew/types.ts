// Naveo crew — painterly mascot library
//
// 4 single-silhouette characters × 6 face expressions.
// Body = one path with radial gradient + brush filter. Face / insignia /
// blush / sparkles / thinking / curious-mark live in separate (unfiltered)
// groups so they read crisply at small sizes and can be animated in CSS.
//
// Layer names per SVG:
//   .silhouette   body + outline (filtered, "brush" texture)
//   .face         .eye-left, .eye-right, .mouth
//   .insignia
//   .blush        (happy / win)
//   .sparkles     (win)
//   .thinking     (thinking — three dots)
//   .curious-mark (curious — small ? spark)

import type { CharacterSlug } from "@/modules/cast/types"

// All 6 crew have painterly designs. orbit / hex use placeholder shapes until
// the final art ships from Claude Design — same structure as the original 4
// (silhouette + face + insignia), so swap-in is a single data.ts edit.
export type CrewSlug = "vega" | "echo" | "atlas" | "forge" | "orbit" | "hex"

export type CrewExpression =
  | "neutral"
  | "happy"
  | "curious"
  | "thinking"
  | "win"
  | "correction"

export type CrewFace = {
  cx: number
  cy: number
  eyeDx: number
  eyeR: number
  mouthY: number
  mouthW: number
}

export type CrewInsignia =
  | { type: "diamond"; x: number; y: number; size: number }
  | { type: "scanline"; y: number }
  | { type: "chevron"; x: number; y: number; size: number }
  | { type: "forge-marks"; x: number; y: number }

export type CrewSpec = {
  body: string
  bodyColor: string
  bodyLight: string
  bodyDeep: string
  outline: string
  faceColor: string
  face: CrewFace
  defaults: { eyes: CrewEyeKind; mouth: CrewMouthKind }
  insignia: CrewInsignia
  blushPos: readonly [readonly [number, number], readonly [number, number]]
}

export type CrewEyeKind =
  | "open-soft"
  | "open-alert"
  | "open-small"
  | "open-wide"
  | "closed-smile"
  | "closed-rest"
  | "lowered"

export type CrewMouthKind =
  | "smile-soft"
  | "smile-big"
  | "line-soft"
  | "line-flat"
  | "line-firm"
  | "line-tiny"
  | "small-o"
  | "frown-small"

export type CrewExprSpec = {
  eyes: CrewEyeKind
  mouth: CrewMouthKind
  accessory?: "sparkles" | "thinking" | "curious"
  blush?: boolean
  asymmetric?: boolean
  eyeShiftY?: number
}

const CREW_SLUGS: readonly CrewSlug[] = [
  "vega",
  "echo",
  "atlas",
  "forge",
  "orbit",
  "hex",
]

export const isCrewSlug = (slug: string | null | undefined): slug is CrewSlug =>
  !!slug && (CREW_SLUGS as readonly string[]).includes(slug)

// Convenience: narrow CharacterSlug → CrewSlug | null. All 6 are valid crew
// slugs now (placeholder art for orbit / hex).
export const toCrewSlug = (
  slug: CharacterSlug | string | null | undefined,
): CrewSlug | null => (isCrewSlug(slug) ? slug : null)
