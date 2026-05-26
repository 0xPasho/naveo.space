"use client"

import { useTranslations } from "next-intl"

import { cn } from "@/common/lib/utils"
import { CAST } from "@/modules/cast/data"
import { CrewAvatar } from "@/modules/crew"
import type { CrewSlug } from "@/modules/crew"

import { getPresenterTint } from "./presenter-tints"

type Props = {
  slug: CrewSlug
  intent?: string
  className?: string
}

export function DemoPresenterHeader({ slug, intent, className }: Props) {
  const tDossier = useTranslations("crew.dossier")
  const tHeader = useTranslations("lessons.demos.presenterHeader")
  const character = CAST.find((c) => c.slug === slug)
  if (!character) return null

  const tint = getPresenterTint(slug)
  const finalIntent = intent ?? tHeader("defaultIntent")

  return (
    <header
      className={cn(
        "flex items-center gap-3 border-b-2 border-line-soft bg-bg-sunken px-3 py-2.5",
        className,
      )}
    >
      <CrewAvatar slug={slug} size={36} title={character.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p
            className={cn(
              "truncate font-display text-sm font-bold leading-tight tracking-tight",
              tint.text,
            )}
          >
            {character.name}
          </p>
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
            · {tDossier(`${slug}.roleShort` as never)}
          </p>
        </div>
        <p className="mt-0.5 truncate font-sans text-xs italic text-ink-2">
          &ldquo;{finalIntent}&rdquo;
        </p>
      </div>
    </header>
  )
}
