import { cn } from "@/common/lib/utils"

import { CREW_CHARS, brushSeed } from "../data"
import {
  exprSpec,
  renderBlush,
  renderCurious,
  renderEye,
  renderInsignia,
  renderMouth,
  renderSparkles,
  renderThinking,
} from "../lib"
import type { CrewExpression, CrewSlug } from "../types"

type CrewSize = number | "full"

type Props = {
  slug: CrewSlug
  expression?: CrewExpression
  // Pixel size, or "full" to fill the parent's width and derive height
  // from the 1:1 viewBox aspect (matches <img> with `width:100%` + no
  // explicit height — important for parents that aren't square).
  size?: CrewSize
  className?: string
  // Accessible title for the SVG. When omitted the SVG is decorative
  // (aria-hidden). Provide a string to surface a name to assistive tech.
  title?: string
  // Omit the feTurbulence brush filter — cheaper at small sizes (avatars
  // in lists, leaderboard rows). Visual difference is negligible under ~48px.
  flat?: boolean
}

// Inline SVG mascot. Server-renderable: no hooks, no client state. All
// animation is CSS-only (see globals.css :: crew-bob / crew-blink / etc).
export function CrewCharacter({
  slug,
  expression = "neutral",
  size = 128,
  className,
  title,
  flat = false,
}: Props) {
  const c = CREW_CHARS[slug]
  const s = exprSpec(expression, c)
  const filterId = `crew-${slug}-brush`
  const fillId = `crew-${slug}-fill`
  const seed = brushSeed(slug)

  const isFull = size === "full"

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={isFull ? "100%" : size}
      height={isFull ? undefined : size}
      className={cn("crew-char", className)}
      data-character={slug}
      data-expression={expression}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        {/* Painterly fill — warm highlight upper-left → body → deep at bottom-right */}
        <radialGradient id={fillId} cx="38%" cy="32%" r="82%">
          <stop offset="0" stopColor={c.bodyLight} />
          <stop offset="0.55" stopColor={c.bodyColor} />
          <stop offset="1" stopColor={c.bodyDeep} />
        </radialGradient>
        {flat ? null : (
          <filter
            id={filterId}
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.05"
              numOctaves={2}
              seed={seed}
              result="noise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.2" />
          </filter>
        )}
      </defs>

      <g
        className="silhouette"
        filter={flat ? undefined : `url(#${filterId})`}
      >
        <path
          className="body"
          d={c.body}
          fill={`url(#${fillId})`}
          stroke={c.outline}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        {/* Soft top-edge brushed sheen */}
        <path
          className="body-sheen"
          d={c.body}
          fill="none"
          stroke={c.bodyLight}
          strokeWidth={2}
          strokeLinejoin="round"
          opacity={0.18}
          transform="translate(-3 -3)"
        />
      </g>

      {renderInsignia(c)}
      {s.blush ? renderBlush(c) : null}

      <g className="face">
        {renderEye("left", s.eyes, c, s)}
        {renderEye("right", s.eyes, c, s)}
        {renderMouth(s.mouth, c)}
      </g>

      {s.accessory === "sparkles" ? renderSparkles() : null}
      {s.accessory === "thinking" ? renderThinking(c) : null}
      {s.accessory === "curious" ? renderCurious() : null}
    </svg>
  )
}
