import { cn } from "@/common/lib/utils"

import { CAST } from "../data"

const colorClass = {
  vega: "text-[color:var(--char-vega)] border-[color:var(--char-vega)]/30",
  atlas: "text-[color:var(--char-atlas)] border-[color:var(--char-atlas)]/30",
  echo: "text-[color:var(--char-echo)] border-[color:var(--char-echo)]/30",
  forge: "text-[color:var(--char-forge)] border-[color:var(--char-forge)]/30",
} as const

// Static grid of crew members. Renders the same set on every page that
// surfaces the cast (Bridge, future character index, etc.). Source of truth
// for character data is src/modules/cast/data.ts.
export function CrewGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {CAST.map((c) => (
        <article
          key={c.slug}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="mb-2 flex items-center gap-3">
            <span
              className={cn(
                "inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border",
                colorClass[c.color],
              )}
            >
              <img
                src={`/cast/${c.slug}.svg`}
                alt={c.name}
                className="h-full w-auto"
              />
            </span>
            <div>
              <p className="font-bold leading-tight">{c.name}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {c.role}
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {c.description}
          </p>
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">
            {c.appearsIn}
          </p>
        </article>
      ))}
    </div>
  )
}
