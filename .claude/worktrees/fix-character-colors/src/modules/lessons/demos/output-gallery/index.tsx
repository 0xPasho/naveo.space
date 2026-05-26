"use client"

import {
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  type LucideIcon,
  Radio,
  ShieldCheck,
} from "lucide-react"
import { useState } from "react"

import { Button } from "@/common/components/ui/button"
import { PromptEditor } from "@/common/components/prompt-editor"
import { cn } from "@/common/lib/utils"

type Case = {
  title: string
  prompt: string
  output: string
  why: string
}

const isCase = (v: unknown): v is Case => {
  if (!v || typeof v !== "object") return false
  const r = v as Record<string, unknown>
  return (
    typeof r.title === "string" &&
    typeof r.prompt === "string" &&
    typeof r.output === "string" &&
    typeof r.why === "string"
  )
}

type Props = {
  props?: Record<string, unknown>
}

export default function OutputGalleryDemo({ props }: Props) {
  const cases =
    props && Array.isArray(props.cases)
      ? (props.cases as unknown[]).filter(isCase)
      : []

  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  if (cases.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        output-gallery: faltan <code className="font-mono">props.cases</code>.
      </div>
    )
  }

  const current = cases[index]
  const isRevealed = revealed.has(index)

  const reveal = () => {
    setRevealed((prev) => {
      const next = new Set(prev)
      next.add(index)
      return next
    })
  }

  const go = (delta: number) => {
    const next = (index + delta + cases.length) % cases.length
    setIndex(next)
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-lg border border-white/10 bg-background/85 shadow-2xl shadow-black/20">
        <header className="flex items-start justify-between gap-3 border-b border-white/10 bg-black/30 px-3 py-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--brand-cyan)]">
              Galería de fallos
            </p>
            <h2 className="mt-1 truncate text-lg font-bold leading-tight">
              {current.title}
            </h2>
          </div>
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-destructive">
            Caso {index + 1} / {cases.length}
          </div>
        </header>

        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/20 px-3 py-2">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <AlertOctagon className="size-3 text-destructive" />
            Fallo en producción
          </div>
          <div className="flex gap-1">
            {cases.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ir al caso ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index
                    ? "w-6 bg-[color:var(--brand-gold)]"
                    : revealed.has(i)
                      ? "w-1.5 bg-[color:var(--brand-gold)]/40"
                      : "w-1.5 bg-white/15",
                )}
              />
            ))}
          </div>
        </div>

        <div key={index} className="animate-attempt-pass">
          <PanelHeader
            icon={Radio}
            label="Prompt"
            value={`${current.prompt.length} chars`}
          />
          <PromptEditor
            value={current.prompt}
            readOnly
            language="markdown"
            minHeight={120}
            maxHeight={240}
            className="bg-black/20"
          />
          <PanelHeader
            icon={FileText}
            label="Output del modelo"
            value={`${current.output.length} chars`}
          />
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words bg-destructive/5 px-3 py-2.5 font-mono text-xs leading-relaxed text-foreground/90">
            {current.output}
          </pre>
        </div>
      </section>

      {isRevealed ? (
        <div className="rounded-lg border border-[color:var(--char-echo)]/30 bg-[color:var(--char-echo)]/5 p-3 backdrop-blur">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--char-echo)]">
            <ShieldCheck className="mr-1 inline size-3" aria-hidden />
            Diagnóstico de Echo
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            {current.why}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-card/70 p-3 text-center backdrop-blur">
          <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
            Antes de revelar: ¿qué falló en este output?
          </p>
          <Button variant="outline" size="sm" onClick={reveal}>
            <Eye />
            Ver diagnóstico
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => go(-1)}
          aria-label="Caso anterior"
        >
          <ChevronLeft />
          Anterior
        </Button>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {revealed.size} / {cases.length} diagnosticados
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => go(1)}
          aria-label="Siguiente caso"
        >
          Siguiente
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}

function PanelHeader({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/20 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md border border-[color:var(--brand-cyan)]/25 text-[color:var(--brand-cyan)]">
          <Icon className="size-3.5" aria-hidden />
        </span>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="font-mono text-[10px] tabular-nums text-muted-foreground">
        {value}
      </p>
    </div>
  )
}
