import type { CrewSlug, CrewSpec } from "./types"

// Ported from the design package `characters.js` (CHARS object). Coordinates
// are in a 256x256 viewBox. Source of truth for body paths, palette per
// character, face metrics, and insignia placement.

export const GOLD = "#d4a24c"
export const GOLD_DEEP = "#a67a2e"

export const CREW_CHARS: Record<CrewSlug, CrewSpec> = {
  vega: {
    // Rounded pebble / teardrop. Soft, stable.
    body:
      "M 134 46 " +
      "C 92 48 54 88 50 142 " +
      "C 48 196 86 232 132 234 " +
      "C 180 234 212 198 210 148 " +
      "C 208 94 176 46 134 46 Z",
    bodyColor: "#9a8a4c",
    bodyLight: "#c4b06a",
    bodyDeep: "#5e5328",
    outline: "#3a3214",
    faceColor: "#1f1a08",
    face: { cx: 128, cy: 132, eyeDx: 30, eyeR: 6.4, mouthY: 158, mouthW: 22 },
    defaults: { eyes: "open-soft", mouth: "smile-soft" },
    insignia: { type: "diamond", x: 128, y: 192, size: 7.5 },
    blushPos: [
      [78, 156],
      [178, 156],
    ],
  },
  echo: {
    // Symmetrical gem / kite. Precise but rounded.
    body:
      "M 128 36 " +
      "C 156 50 200 86 216 132 " +
      "C 214 158 174 222 128 240 " +
      "C 82 222 42 158 40 132 " +
      "C 56 86 100 50 128 36 Z",
    bodyColor: "#4c8a9a",
    bodyLight: "#74b3c2",
    bodyDeep: "#2e5f6e",
    outline: "#1a3a44",
    faceColor: "#0a1c22",
    face: { cx: 128, cy: 130, eyeDx: 34, eyeR: 6.8, mouthY: 158, mouthW: 18 },
    defaults: { eyes: "open-alert", mouth: "line-soft" },
    insignia: { type: "scanline", y: 116 },
    blushPos: [
      [80, 152],
      [176, 152],
    ],
  },
  atlas: {
    // Tall monolithic column. Arched top, broader at base.
    body:
      "M 56 238 " +
      "L 66 92 " +
      "C 66 24 190 24 190 92 " +
      "L 200 238 " +
      "C 200 242 196 246 192 246 " +
      "L 64 246 " +
      "C 60 246 56 242 56 238 Z",
    bodyColor: "#2a2a3a",
    bodyLight: "#4a465e",
    bodyDeep: "#16161e",
    outline: "#08080e",
    // Warm cream — the only way the face reads on the dark monolith.
    faceColor: "#c9c3b2",
    face: { cx: 128, cy: 108, eyeDx: 24, eyeR: 5.2, mouthY: 130, mouthW: 18 },
    defaults: { eyes: "open-small", mouth: "line-firm" },
    insignia: { type: "chevron", x: 128, y: 60, size: 14 },
    blushPos: [
      [96, 124],
      [160, 124],
    ],
  },
  forge: {
    // Chunky asymmetric rounded square / cog-pebble.
    body:
      "M 78 46 " +
      "C 56 48 46 60 48 80 " +
      "L 52 196 " +
      "C 52 216 64 224 84 224 " +
      "L 188 224 " +
      "C 212 224 216 208 212 188 " +
      "L 208 76 " +
      "C 206 56 192 46 178 48 Z",
    bodyColor: "#a06a4c",
    bodyLight: "#c98c68",
    bodyDeep: "#6b4628",
    outline: "#3e2412",
    faceColor: "#2c1808",
    face: { cx: 128, cy: 128, eyeDx: 32, eyeR: 7.5, mouthY: 158, mouthW: 16 },
    defaults: { eyes: "open-wide", mouth: "small-o" },
    insignia: { type: "forge-marks", x: 128, y: 60 },
    blushPos: [
      [78, 152],
      [178, 152],
    ],
  },
  // Placeholder painterly spec until Claude Design ships the final art.
  orbit: {
    // Taller, narrower vertical ovoid — suggests orbital path.
    body:
      "M 128 36 " +
      "C 88 42 70 88 70 138 " +
      "C 70 200 92 240 128 240 " +
      "C 164 240 186 200 186 138 " +
      "C 186 88 168 42 128 36 Z",
    bodyColor: "#4a7a9e",
    bodyLight: "#7aa6c8",
    bodyDeep: "#1f3a52",
    outline: "#0a1a28",
    faceColor: "#08121d",
    face: { cx: 128, cy: 130, eyeDx: 28, eyeR: 6.0, mouthY: 158, mouthW: 18 },
    defaults: { eyes: "open-small", mouth: "line-soft" },
    insignia: { type: "diamond", x: 128, y: 196, size: 6.5 },
    blushPos: [
      [82, 154],
      [174, 154],
    ],
  },
  // Placeholder painterly spec until Claude Design ships the final art.
  hex: {
    // Rounded hexagonal blob — geometric vs. the organic shapes of the rest.
    body:
      "M 128 38 " +
      "C 134 38 140 40 144 44 " +
      "L 196 78 " +
      "C 200 82 202 86 202 92 " +
      "L 202 168 " +
      "C 202 174 200 178 196 182 " +
      "L 144 216 " +
      "C 140 220 134 222 128 222 " +
      "C 122 222 116 220 112 216 " +
      "L 60 182 " +
      "C 56 178 54 174 54 168 " +
      "L 54 92 " +
      "C 54 86 56 82 60 78 " +
      "L 112 44 " +
      "C 116 40 122 38 128 38 Z",
    bodyColor: "#7c4ca0",
    bodyLight: "#a87bc8",
    bodyDeep: "#3e1f5c",
    outline: "#1c0c2c",
    faceColor: "#0e0418",
    face: { cx: 128, cy: 128, eyeDx: 30, eyeR: 5.8, mouthY: 156, mouthW: 16 },
    defaults: { eyes: "open-alert", mouth: "line-firm" },
    insignia: { type: "forge-marks", x: 128, y: 62 },
    blushPos: [
      [82, 152],
      [174, 152],
    ],
  },
} as const

// Deterministic per-character turbulence seed so each crew member's brushed
// edge looks consistent across renders. Matches the design's build() formula.
export const brushSeed = (slug: CrewSlug): number =>
  (slug.charCodeAt(0) * 7 + slug.charCodeAt(1) * 13) % 100
