import type { ReactNode } from "react"

import { GOLD, GOLD_DEEP } from "./data"
import type {
  CrewExprSpec,
  CrewExpression,
  CrewEyeKind,
  CrewMouthKind,
  CrewSpec,
} from "./types"

// Pure render helpers — ported from the design package `characters.js`.
// Each helper returns a JSX subtree instead of an HTML string so React can
// reconcile the layers and the parent component stays declarative.

export const exprSpec = (
  expression: CrewExpression,
  c: CrewSpec,
): CrewExprSpec => {
  const d = c.defaults
  switch (expression) {
    case "neutral":
      return { eyes: d.eyes, mouth: d.mouth }
    case "happy":
      return { eyes: "closed-smile", mouth: "smile-big", blush: true }
    case "curious":
      return {
        eyes: d.eyes,
        mouth: "small-o",
        asymmetric: true,
        accessory: "curious",
      }
    case "thinking":
      return {
        eyes: "closed-rest",
        mouth: "line-tiny",
        accessory: "thinking",
      }
    case "win":
      return {
        eyes: "closed-smile",
        mouth: "smile-big",
        blush: true,
        accessory: "sparkles",
      }
    case "correction":
      return { eyes: "lowered", mouth: "frown-small", eyeShiftY: 1.5 }
  }
}

// ─── eyes ────────────────────────────────────────────────────────────

type EyeSide = "left" | "right"

const CircleEye = ({
  cx,
  cy,
  r,
  fill,
  className,
}: {
  cx: number
  cy: number
  r: number
  fill: string
  className: string
}) => (
  <g className={className}>
    <circle cx={cx} cy={cy} r={r} fill={fill} />
    <circle
      cx={cx + r * 0.35}
      cy={cy - r * 0.4}
      r={r * 0.28}
      fill="#fff"
      opacity={0.55}
    />
  </g>
)

export const renderEye = (
  side: EyeSide,
  kind: CrewEyeKind,
  c: CrewSpec,
  opts: CrewExprSpec,
): ReactNode => {
  const f = c.face
  const cx = f.cx + (side === "right" ? f.eyeDx : -f.eyeDx)
  let cy = f.cy + (opts.eyeShiftY ?? 0)
  // Asymmetric: raise the left eye slightly for a "head tilt" feel.
  if (opts.asymmetric && side === "left") cy -= 2.5
  const r = f.eyeR
  const cls = `eye-${side}`
  const fc = c.faceColor

  switch (kind) {
    case "open-soft":
      return <CircleEye cx={cx} cy={cy} r={r * 0.92} fill={fc} className={cls} />
    case "open-alert":
      return <CircleEye cx={cx} cy={cy} r={r} fill={fc} className={cls} />
    case "open-small":
      return <CircleEye cx={cx} cy={cy} r={r * 0.85} fill={fc} className={cls} />
    case "open-wide":
      return <CircleEye cx={cx} cy={cy} r={r} fill={fc} className={cls} />
    case "closed-smile": {
      const w = r * 1.6
      return (
        <path
          className={cls}
          d={`M ${cx - w} ${cy + r * 0.4} Q ${cx} ${cy - r * 0.9} ${cx + w} ${cy + r * 0.4}`}
          fill="none"
          stroke={fc}
          strokeWidth={r * 0.55}
          strokeLinecap="round"
        />
      )
    }
    case "closed-rest": {
      const w = r * 1.4
      return (
        <path
          className={cls}
          d={`M ${cx - w} ${cy - r * 0.1} Q ${cx} ${cy + r * 0.55} ${cx + w} ${cy - r * 0.1}`}
          fill="none"
          stroke={fc}
          strokeWidth={r * 0.5}
          strokeLinecap="round"
        />
      )
    }
    case "lowered": {
      const w = r * 1.3
      return (
        <g className={cls}>
          <CircleEye
            cx={cx}
            cy={cy + 1.5}
            r={r * 0.78}
            fill={fc}
            className=""
          />
          <path
            d={`M ${cx - w} ${cy - r * 0.4} Q ${cx} ${cy - r * 0.05} ${cx + w} ${cy - r * 0.4}`}
            fill="none"
            stroke={fc}
            strokeWidth={r * 0.5}
            strokeLinecap="round"
            opacity={0.9}
          />
        </g>
      )
    }
  }
}

// ─── mouth ───────────────────────────────────────────────────────────

export const renderMouth = (kind: CrewMouthKind, c: CrewSpec): ReactNode => {
  const f = c.face
  const cx = f.cx
  const cy = f.mouthY
  const w = f.mouthW
  const fc = c.faceColor
  const sw = 2.6

  switch (kind) {
    case "smile-soft":
      return (
        <path
          className="mouth"
          d={`M ${cx - w * 0.5} ${cy - 1} Q ${cx} ${cy + 4.5} ${cx + w * 0.5} ${cy - 1}`}
          fill="none"
          stroke={fc}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      )
    case "smile-big": {
      const ww = w * 0.8
      return (
        <path
          className="mouth"
          d={`M ${cx - ww} ${cy - 2} Q ${cx} ${cy + 8} ${cx + ww} ${cy - 2}`}
          fill="none"
          stroke={fc}
          strokeWidth={sw + 0.4}
          strokeLinecap="round"
        />
      )
    }
    case "line-soft":
    case "line-flat":
      return (
        <path
          className="mouth"
          d={`M ${cx - w * 0.45} ${cy} L ${cx + w * 0.45} ${cy}`}
          fill="none"
          stroke={fc}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      )
    case "line-firm":
      return (
        <path
          className="mouth"
          d={`M ${cx - w * 0.6} ${cy} L ${cx + w * 0.6} ${cy}`}
          fill="none"
          stroke={fc}
          strokeWidth={sw + 0.6}
          strokeLinecap="round"
        />
      )
    case "line-tiny":
      return (
        <path
          className="mouth"
          d={`M ${cx - w * 0.22} ${cy} L ${cx + w * 0.22} ${cy}`}
          fill="none"
          stroke={fc}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      )
    case "small-o":
      return (
        <ellipse
          className="mouth"
          cx={cx}
          cy={cy + 1}
          rx={w * 0.18}
          ry={w * 0.22}
          fill={fc}
        />
      )
    case "frown-small": {
      const ww = w * 0.42
      return (
        <path
          className="mouth"
          d={`M ${cx - ww} ${cy + 2} Q ${cx} ${cy - 2.5} ${cx + ww} ${cy + 2}`}
          fill="none"
          stroke={fc}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      )
    }
  }
}

// ─── insignia ───────────────────────────────────────────────────────

export const renderInsignia = (c: CrewSpec): ReactNode => {
  const i = c.insignia
  switch (i.type) {
    case "diamond": {
      const s = i.size
      return (
        <g className="insignia">
          <path
            d={`M ${i.x} ${i.y - s} L ${i.x + s} ${i.y} L ${i.x} ${i.y + s} L ${i.x - s} ${i.y} Z`}
            fill={GOLD}
            stroke={GOLD_DEEP}
            strokeWidth={0.8}
          />
          <circle
            cx={i.x - s * 0.35}
            cy={i.y - s * 0.35}
            r={s * 0.18}
            fill="#fff"
            opacity={0.6}
          />
        </g>
      )
    }
    case "scanline":
      return (
        <g className="insignia" opacity={0.85}>
          <line
            x1={56}
            y1={i.y}
            x2={200}
            y2={i.y}
            stroke={GOLD}
            strokeWidth={1.4}
            strokeLinecap="round"
            opacity={0.55}
          />
          <circle cx={128} cy={i.y} r={2.2} fill={GOLD} />
        </g>
      )
    case "chevron": {
      const s = i.size
      return (
        <g className="insignia">
          <path
            d={`M ${i.x - s} ${i.y + s * 0.5} L ${i.x} ${i.y - s * 0.4} L ${i.x + s} ${i.y + s * 0.5}`}
            fill="none"
            stroke={GOLD}
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )
    }
    case "forge-marks":
      return (
        <g className="insignia">
          <rect
            x={i.x - 14}
            y={i.y}
            width={8}
            height={8}
            rx={1.5}
            fill={GOLD}
            transform={`rotate(45 ${i.x - 10} ${i.y + 4})`}
          />
          <circle cx={i.x + 10} cy={i.y + 4} r={3.4} fill={GOLD} />
        </g>
      )
  }
}

// ─── accessories ─────────────────────────────────────────────────────

const Sparkle = ({
  x,
  y,
  size,
  delay,
}: {
  x: number
  y: number
  size: number
  delay: number
}) => {
  const s = size
  return (
    <g
      transform={`translate(${x} ${y})`}
      style={{ ["--d" as string]: `${delay}s` }}
    >
      <path
        d={`M 0 ${-s} L ${s * 0.28} ${-s * 0.28} L ${s} 0 L ${s * 0.28} ${s * 0.28} L 0 ${s} L ${-s * 0.28} ${s * 0.28} L ${-s} 0 L ${-s * 0.28} ${-s * 0.28} Z`}
        fill={GOLD}
      />
    </g>
  )
}

export const renderSparkles = (): ReactNode => (
  <g className="sparkles">
    <Sparkle x={40} y={60} size={6} delay={0} />
    <Sparkle x={218} y={80} size={5} delay={0.2} />
    <Sparkle x={36} y={168} size={4.5} delay={0.4} />
    <Sparkle x={222} y={184} size={5.5} delay={0.1} />
    <Sparkle x={80} y={30} size={4} delay={0.3} />
    <Sparkle x={190} y={36} size={5} delay={0.5} />
  </g>
)

export const renderThinking = (c: CrewSpec): ReactNode => {
  // Atlas has a cream face on a dark body — its accent dot reads better in
  // gold than in faceColor, so swap there only.
  const dotColor = c.faceColor === "#c9c3b2" ? GOLD : c.faceColor
  const y = 24
  const cx = 128
  return (
    <g className="thinking">
      <circle
        cx={cx - 14}
        cy={y}
        r={3}
        fill={dotColor}
        opacity={0.85}
        style={{ ["--d" as string]: "0s" }}
      />
      <circle
        cx={cx}
        cy={y}
        r={3}
        fill={dotColor}
        opacity={0.85}
        style={{ ["--d" as string]: "0.18s" }}
      />
      <circle
        cx={cx + 14}
        cy={y}
        r={3}
        fill={dotColor}
        opacity={0.85}
        style={{ ["--d" as string]: "0.36s" }}
      />
    </g>
  )
}

export const renderCurious = (): ReactNode => (
  <g className="curious-mark">
    <path
      d="M 196 56 q 6 -10 14 -2 q 2 4 -4 8 l 0 4"
      fill="none"
      stroke={GOLD}
      strokeWidth={3}
      strokeLinecap="round"
    />
    <circle cx={206} cy={78} r={2.2} fill={GOLD} />
  </g>
)

export const renderBlush = (c: CrewSpec): ReactNode => {
  const [a, b] = c.blushPos
  return (
    <g className="blush" opacity={0.45}>
      <ellipse cx={a[0]} cy={a[1]} rx={7} ry={4} fill="#e07a72" />
      <ellipse cx={b[0]} cy={b[1]} rx={7} ry={4} fill="#e07a72" />
    </g>
  )
}
