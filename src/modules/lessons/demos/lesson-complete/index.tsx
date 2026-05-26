"use client"

import { Award, Check } from "lucide-react"
import { useTranslations } from "next-intl"

import { Card } from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
import { CAST } from "@/modules/cast/data"
import type { Character } from "@/modules/cast/types"
import { CrewCharacter } from "@/modules/crew"
import type { CrewSlug } from "@/modules/crew"

const colorClass = {
  gold: {
    text: "text-stat-xp",
    border: "border-stat-xp/20",
    avatarBorder: "border-stat-xp/25",
    bg: "bg-bg-sunken",
  },
  cyan: {
    text: "text-track-prompting",
    border: "border-track-prompting/20",
    avatarBorder: "border-track-prompting/25",
    bg: "bg-bg-sunken",
  },
} as const

type Props = {
  props?: Record<string, unknown>
}

const isCrewSlug = (v: unknown): v is Character["slug"] =>
  v === "vega" ||
  v === "atlas" ||
  v === "echo" ||
  v === "forge" ||
  v === "orbit" ||
  v === "hex"

export default function LessonCompleteDemo({ props }: Props) {
  const t = useTranslations("lessons.demos.lessonComplete")
  const tDossier = useTranslations("crew.dossier")
  const signedBySlug =
    props && isCrewSlug(props.signedBy) ? props.signedBy : "atlas"
  // `isCrewSlug` guards the input above, so `find` always hits. The fallback
  // is purely defensive — pin it to atlas (the default signedBy) for
  // consistency.
  const signer =
    CAST.find((c) => c.slug === signedBySlug) ??
    CAST.find((c) => c.slug === "atlas")!
  const tint = colorClass[signer.color]

  return (
    <Card className="overflow-hidden p-0">
      <header className="flex items-start justify-between gap-3 border-b-2 border-line-soft bg-bg-sunken px-3 py-3">
        <div>
          <p
            className={cn(
              "font-mono text-[10px] uppercase tracking-[0.24em]",
              tint.text,
            )}
          >
            {t("eyebrow")}
          </p>
          <h2 className="mt-1 font-display text-lg font-bold leading-tight text-ink-1">
            {t("title")}
          </h2>
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-md border-2 px-2 py-1 font-mono text-[10px] uppercase tracking-wider",
            tint.border,
            tint.text,
          )}
        >
          <Award className="size-3" aria-hidden />
          {t("stage")}
        </div>
      </header>

      <div className="flex flex-col items-center justify-center gap-6 bg-bg-sunken/60 px-6 py-10 text-center">
        <div
          className={cn(
            "animate-attempt-pass relative flex flex-col items-center gap-4 rounded-2xl border-2 bg-bg-raised px-10 py-10",
            tint.border,
          )}
        >
          <span
            className={cn(
              "inline-flex size-24 items-center justify-center overflow-hidden rounded-full border-2",
              tint.avatarBorder,
              tint.bg,
            )}
            aria-hidden
          >
            <CrewCharacter
              slug={signer.slug as CrewSlug}
              expression="win"
              size="full"
              title={signer.name}
              className="size-full object-contain p-1.5"
            />
          </span>

          <div className="space-y-1">
            <p
              className={cn(
                "font-display text-2xl font-bold tracking-tight",
                tint.text,
              )}
            >
              {signer.name}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
              {tDossier(`${signer.slug}.roleShort` as never)}
            </p>
          </div>

          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border-2 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider",
              tint.border,
              tint.text,
            )}
          >
            <Check className="size-3.5" />
            {t("signedLabel")}
          </div>
        </div>

        <p className="max-w-xs font-sans text-xs leading-relaxed text-ink-3">
          {t("body")}
        </p>
      </div>
    </Card>
  )
}
