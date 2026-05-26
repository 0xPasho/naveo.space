"use client"

import { Award, Check } from "lucide-react"

import { cn } from "@/common/lib/utils"
import { CAST } from "@/modules/cast/data"
import type { Character } from "@/modules/cast/types"

const colorClass = {
  gold: {
    text: "text-[color:var(--brand-gold)]",
    border: "border-[color:var(--brand-gold)]/40",
    bg: "bg-[color:var(--brand-gold)]/10",
    glow: "shadow-[0_0_60px_-12px_var(--brand-gold)]",
    ring: "ring-[color:var(--brand-gold)]/20",
  },
  cyan: {
    text: "text-[color:var(--brand-cyan)]",
    border: "border-[color:var(--brand-cyan)]/40",
    bg: "bg-[color:var(--brand-cyan)]/10",
    glow: "shadow-[0_0_60px_-12px_var(--brand-cyan)]",
    ring: "ring-[color:var(--brand-cyan)]/20",
  },
} as const

type Props = {
  props?: Record<string, unknown>
}

const isCrewSlug = (v: unknown): v is Character["slug"] =>
  v === "vega" || v === "atlas" || v === "echo" || v === "forge"

export default function LessonCompleteDemo({ props }: Props) {
  const signedBySlug =
    props && isCrewSlug(props.signedBy) ? props.signedBy : "atlas"
  const signer = CAST.find((c) => c.slug === signedBySlug) ?? CAST[1]
  const tint = colorClass[signer.color]

  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-background/85 shadow-2xl shadow-black/20">
      <header className="flex items-start justify-between gap-3 border-b border-white/10 bg-black/30 px-3 py-3">
        <div>
          <p
            className={cn(
              "font-mono text-[10px] uppercase tracking-[0.24em]",
              tint.text,
            )}
          >
            Cierre de turno
          </p>
          <h2 className="mt-1 text-lg font-bold leading-tight">
            Parte firmado
          </h2>
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider",
            tint.border,
            tint.text,
          )}
        >
          <Award className="size-3" aria-hidden />
          Onboarding
        </div>
      </header>

      <div className="flex flex-col items-center justify-center gap-6 bg-black/20 px-6 py-10 text-center">
        <div
          className={cn(
            "relative flex flex-col items-center gap-4 rounded-2xl border bg-background/80 px-10 py-10 ring-1 backdrop-blur-md animate-attempt-pass",
            tint.border,
            tint.ring,
            tint.glow,
          )}
        >
          <span
            className={cn(
              "inline-flex size-20 items-center justify-center rounded-full border-2 text-4xl leading-none",
              tint.border,
              tint.text,
              tint.bg,
            )}
            aria-hidden
          >
            {signer.glyph}
          </span>

          <div className="space-y-1">
            <p
              className={cn("text-2xl font-bold tracking-tight", tint.text)}
            >
              {signer.name}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {signer.role}
            </p>
          </div>

          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider",
              tint.border,
              tint.text,
              tint.bg,
            )}
          >
            <Check className="size-3.5" />
            Firmado
          </div>
        </div>

        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
          Quedas en periodo de prueba con la crew. La siguiente fase del onboarding te espera.
        </p>
      </div>
    </section>
  )
}
