"use client"

import { Users } from "lucide-react"
import { useState } from "react"

import { cn } from "@/common/lib/utils"
import { CAST } from "@/modules/cast/data"
import type { Character } from "@/modules/cast/types"

const colorClass = {
  gold: {
    text: "text-[color:var(--brand-gold)]",
    border: "border-[color:var(--brand-gold)]/40",
    bg: "bg-[color:var(--brand-gold)]/10",
    glow: "shadow-[0_0_42px_-12px_var(--brand-gold)]",
  },
  cyan: {
    text: "text-[color:var(--brand-cyan)]",
    border: "border-[color:var(--brand-cyan)]/40",
    bg: "bg-[color:var(--brand-cyan)]/10",
    glow: "shadow-[0_0_42px_-12px_var(--brand-cyan)]",
  },
} as const

export default function CrewIntroDemo() {
  const [selectedSlug, setSelectedSlug] = useState<Character["slug"]>("vega")
  const selected = CAST.find((c) => c.slug === selectedSlug) ?? CAST[0]
  const tint = colorClass[selected.color]

  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-background/85 shadow-2xl shadow-black/20">
      <header className="flex items-start justify-between gap-3 border-b border-white/10 bg-black/30 px-3 py-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--brand-cyan)]">
            Pase de lista
          </p>
          <h2 className="mt-1 text-lg font-bold leading-tight">La crew</h2>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {CAST.length} miembros
        </div>
      </header>

      <article
        key={selected.slug}
        className="border-b border-white/10 bg-black/15 p-5 animate-attempt-pass"
        aria-live="polite"
      >
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "inline-flex size-16 shrink-0 items-center justify-center rounded-lg border-2 text-3xl leading-none",
              tint.border,
              tint.text,
              tint.bg,
              tint.glow,
            )}
            aria-hidden
          >
            {selected.glyph}
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn("text-xl font-bold tracking-tight", tint.text)}>
              {selected.name}
            </p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {selected.role}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
              {selected.description}
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-[color:var(--brand-cyan)]/70">
              {selected.appearsIn}
            </p>
          </div>
        </div>
      </article>

      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/20 px-3 py-2">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <Users className="size-3 text-[color:var(--brand-cyan)]" />
          Selecciona un miembro
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 bg-black/15 p-3 sm:grid-cols-4">
        {CAST.map((c) => {
          const t = colorClass[c.color]
          const active = c.slug === selected.slug
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => setSelectedSlug(c.slug)}
              className={cn(
                "group flex flex-col items-center gap-1.5 rounded-md border bg-background/60 px-3 py-3 backdrop-blur-sm transition-all",
                active
                  ? cn(t.border, t.glow, "scale-[1.02]")
                  : "border-white/10 hover:border-white/25 hover:scale-[1.02]",
              )}
              aria-pressed={active}
              aria-label={`Seleccionar ${c.name}`}
            >
              <span
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-md border text-lg leading-none transition-colors",
                  active
                    ? cn(t.border, t.text, t.bg)
                    : "border-white/10 text-muted-foreground group-hover:text-foreground",
                )}
                aria-hidden
              >
                {c.glyph}
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] uppercase tracking-wider transition-colors",
                  active ? t.text : "text-foreground/70",
                )}
              >
                {c.name}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
