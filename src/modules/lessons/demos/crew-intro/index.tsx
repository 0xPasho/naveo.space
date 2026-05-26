"use client"

import { Users } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Card } from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
import { CAST } from "@/modules/cast/data"
import type { Character } from "@/modules/cast/types"
import { CrewCharacter } from "@/modules/crew"
import type { CrewSlug } from "@/modules/crew"

// Full crew (6). The intro prose nods to orbit / hex unlocking later via
// their tracks; rendering them here just gives the student a preview.

const colorClass = {
  gold: {
    text: "text-stat-xp",
    border: "border-stat-xp/40",
    bg: "bg-stat-xp/10",
    glow: "shadow-[0_0_42px_-12px_var(--stat-xp)]",
  },
  cyan: {
    text: "text-track-prompting",
    border: "border-track-prompting/40",
    bg: "bg-track-prompting/10",
    glow: "shadow-[0_0_42px_-12px_var(--track-prompting)]",
  },
} as const

export default function CrewIntroDemo() {
  const t = useTranslations("lessons.demos.crewIntro")
  const tDossier = useTranslations("crew.dossier")
  const [selectedSlug, setSelectedSlug] = useState<Character["slug"]>("vega")
  const selected =
    CAST.find((c) => c.slug === selectedSlug) ?? CAST[0]
  const tint = colorClass[selected.color]

  return (
    <Card className="overflow-hidden p-0">
      <header className="flex items-start justify-between gap-3 border-b-2 border-line-soft bg-bg-sunken px-3 py-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-track-prompting">
            {t("eyebrow")}
          </p>
          <h2 className="mt-1 font-display text-lg font-bold leading-tight text-ink-1">
            {t("title")}
          </h2>
        </div>
        <div className="rounded-md border-2 border-line-soft bg-bg-raised px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">
          {t("memberCount", { count: CAST.length })}
        </div>
      </header>

      <article
        key={selected.slug}
        className="animate-attempt-pass border-b-2 border-line-soft bg-bg-sunken/50 p-5"
        aria-live="polite"
      >
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "inline-flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2",
              tint.border,
              tint.bg,
              tint.glow,
            )}
            aria-hidden
          >
            <CrewCharacter
              slug={selected.slug as CrewSlug}
              expression="happy"
              size="full"
              title={selected.name}
              className="size-full object-contain p-1"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "font-display text-xl font-bold tracking-tight",
                tint.text,
              )}
            >
              {selected.name}
            </p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
              {tDossier(`${selected.slug}.roleShort` as never)}
            </p>
            <p className="mt-3 font-sans text-sm leading-relaxed text-ink-2">
              {tDossier(`${selected.slug}.descriptionShort` as never)}
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-track-prompting/70">
              {tDossier(`${selected.slug}.appearsIn` as never)}
            </p>
          </div>
        </div>
      </article>

      <div className="flex items-center justify-between gap-3 border-b-2 border-line-soft bg-bg-sunken px-3 py-2">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">
          <Users className="size-3 text-track-prompting" />
          {t("selectPrompt")}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 bg-bg-sunken/50 p-3 sm:grid-cols-4">
        {CAST.map((c) => {
          const tone = colorClass[c.color]
          const active = c.slug === selected.slug
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => setSelectedSlug(c.slug)}
              className={cn(
                "group flex flex-col items-center gap-1.5 rounded-md border-2 bg-bg-raised px-3 py-3 transition-all",
                active
                  ? cn(tone.border, tone.glow, "scale-[1.02]")
                  : "border-line-soft hover:border-line-strong hover:scale-[1.02]",
              )}
              aria-pressed={active}
              aria-label={t("selectAria", { name: c.name })}
            >
              <span
                className={cn(
                  "inline-flex size-11 items-center justify-center overflow-hidden rounded-md border-2 transition-colors",
                  active
                    ? cn(tone.border, tone.bg)
                    : "border-line-soft opacity-70 group-hover:opacity-100",
                )}
                aria-hidden
              >
                <CrewCharacter
                  slug={c.slug as CrewSlug}
                  size="full"
                  flat
                  className="size-full object-contain p-0.5"
                />
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] uppercase tracking-wider transition-colors",
                  active ? tone.text : "text-ink-2",
                )}
              >
                {c.name}
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
