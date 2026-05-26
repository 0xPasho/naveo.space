"use client"

import { useEffect, useMemo, useState } from "react"

import { cn } from "@/common/lib/utils"

type Props = {
  // Number of particles to launch. Capstone variant should pass a larger
  // count for a denser burst.
  count?: number
  // Burst lifetime in milliseconds; component unmounts itself when this
  // elapses so it never pins the layout layer.
  durationMs?: number
  // Palette override. Defaults to gold + cyan + magenta + green when
  // `variant === "default"`, magenta-heavy when `variant === "capstone"`.
  variant?: "default" | "capstone"
}

type Particle = {
  id: number
  x: number // 0..100 (% of container width, horizontal start position)
  driftX: number // px lateral drift
  fall: number // px fall distance (~ container height + overshoot)
  delayMs: number
  durationMs: number
  rotateStart: number // deg
  rotateEnd: number // deg
  color: string
  size: number // px
  shape: "rect" | "circle"
}

const createRng = (seed: number) => {
  let state = seed >>> 0

  return (min: number, max: number) => {
    state = (state * 1664525 + 1013904223) >>> 0
    return min + (state / 0x100000000) * (max - min)
  }
}

// One-shot confetti burst overlayed on the celebration hero. Pure visual,
// fires once on mount, respects prefers-reduced-motion (renders nothing).
//
// Implemented as CSS keyframes per particle (inline animations) rather than
// requestAnimationFrame so the GPU compositor handles motion and no JS
// frame budget is consumed during the burst.
export function ConfettiBurst({
  count = 60,
  durationMs = 2400,
  variant = "default",
}: Props) {
  const palette = useMemo(
    () =>
      variant === "capstone"
        ? [
            "var(--stat-heart)",
            "var(--stat-xp)",
            "var(--track-agents)",
            "var(--track-mcp)",
            "var(--success)",
          ]
        : [
            "var(--stat-xp)",
            "var(--track-prompting)",
            "var(--primary)",
            "var(--track-mcp)",
            "var(--stat-streak)",
          ],
    [variant],
  )

  const particles = useMemo<Particle[]>(() => {
    const rng = createRng(count * 131 + durationMs * 17 + variant.length)

    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: rng(-5, 105),
      driftX: rng(-160, 160),
      fall: rng(220, 480),
      delayMs: rng(0, 380),
      durationMs: rng(1400, 2400),
      rotateStart: rng(-180, 180),
      rotateEnd: rng(-540, 540),
      color: palette[i % palette.length]!,
      size: rng(4, 9),
      shape: rng(0, 1) < 0.55 ? "rect" : "circle",
    }))
  }, [count, durationMs, palette, variant])

  const [alive, setAlive] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => setAlive(false), durationMs)
    return () => window.clearTimeout(t)
  }, [durationMs])

  // Honor reduced-motion: render nothing.
  if (typeof window !== "undefined") {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return null
    }
  }

  if (!alive) return null

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
      aria-hidden
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className={cn(
            "animate-confetti-fall absolute -top-4 block rounded-[2px] opacity-0 will-change-[transform,opacity]",
            p.shape === "circle" && "rounded-full",
          )}
          style={
            {
              left: `${p.x}%`,
              width: `${p.size}px`,
              height: `${p.size * (p.shape === "rect" ? 1.4 : 1)}px`,
              background: p.color,
              animationDelay: `${p.delayMs}ms`,
              animationDuration: `${p.durationMs}ms`,
              "--cf-drift": `${p.driftX}px`,
              "--cf-fall": `${p.fall}px`,
              "--cf-rot-start": `${p.rotateStart}deg`,
              "--cf-rot-end": `${p.rotateEnd}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
