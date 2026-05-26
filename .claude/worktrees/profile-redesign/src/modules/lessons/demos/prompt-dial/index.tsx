"use client"

import {
  type LucideIcon,
  AlertOctagon,
  Check,
  FileText,
  Info,
  Radio,
} from "lucide-react"
import { useState } from "react"

import { PromptEditor } from "@/common/components/prompt-editor"
import { cn } from "@/common/lib/utils"

type Pair = {
  prompt: string
  output: string
  label?: string
}

const isPair = (v: unknown): v is Pair => {
  if (!v || typeof v !== "object") return false
  const r = v as Record<string, unknown>
  return typeof r.prompt === "string" && typeof r.output === "string"
}

type Props = {
  props?: Record<string, unknown>
}

export default function PromptDialDemo({ props }: Props) {
  const before = props && isPair(props.before) ? props.before : null
  const after = props && isPair(props.after) ? props.after : null
  const note = props && typeof props.note === "string" ? props.note : null

  if (!before || !after) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        prompt-dial: faltan props <code className="font-mono">before</code> y/o{" "}
        <code className="font-mono">after</code>.
      </div>
    )
  }

  return <Dial before={before} after={after} note={note} />
}

function Dial({
  before,
  after,
  note,
}: {
  before: Pair
  after: Pair
  note: string | null
}) {
  const [side, setSide] = useState<"before" | "after">("before")
  const active = side === "before" ? before : after
  const beforeLabel = before.label ?? "Antes"
  const afterLabel = after.label ?? "Después"
  const isAfter = side === "after"

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-lg border border-white/10 bg-background/85 shadow-2xl shadow-black/20">
        <header className="flex items-start justify-between gap-3 border-b border-white/10 bg-black/30 px-3 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--brand-cyan)]">
              Comparativa
            </p>
            <h2 className="mt-1 text-lg font-bold leading-tight">
              Antes y después
            </h2>
          </div>
          <div
            className={cn(
              "rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider",
              isAfter
                ? "border-[color:var(--brand-gold)]/40 text-[color:var(--brand-gold)]"
                : "border-destructive/40 text-destructive",
            )}
          >
            {isAfter ? afterLabel : beforeLabel}
          </div>
        </header>

        <div
          role="tablist"
          aria-label="Comparación de prompts"
          className="grid grid-cols-2 gap-1 border-b border-white/10 bg-black/20 p-1"
        >
          <DialTab
            id="before"
            label={beforeLabel}
            icon={AlertOctagon}
            active={side === "before"}
            onClick={() => setSide("before")}
            tone="destructive"
          />
          <DialTab
            id="after"
            label={afterLabel}
            icon={Check}
            active={side === "after"}
            onClick={() => setSide("after")}
            tone="gold"
          />
        </div>

        <div key={side} className="animate-attempt-pass">
          <PanelHeader
            icon={Radio}
            label="Prompt"
            value={`${active.prompt.length} chars`}
          />
          <PromptEditor
            value={active.prompt}
            readOnly
            language="markdown"
            minHeight={140}
            maxHeight={280}
            className="bg-black/20"
          />
          <PanelHeader
            icon={FileText}
            label="Output del modelo"
            value={`${active.output.length} chars`}
          />
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words bg-black/10 px-3 py-2.5 font-mono text-xs leading-relaxed text-foreground/90">
            {active.output}
          </pre>
        </div>
      </section>

      {note ? (
        <div className="rounded-lg border border-white/10 bg-card/70 p-3 backdrop-blur">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--brand-cyan)]">
            <Info className="mr-1 inline size-3" aria-hidden />
            Nota de Echo
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {note}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function DialTab({
  id,
  label,
  icon: Icon,
  active,
  onClick,
  tone,
}: {
  id: string
  label: string
  icon: LucideIcon
  active: boolean
  onClick: () => void
  tone: "destructive" | "gold"
}) {
  const activeClass =
    tone === "destructive"
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : "border-[color:var(--brand-gold)]/40 bg-[color:var(--brand-gold)]/10 text-[color:var(--brand-gold)]"
  return (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all",
        active
          ? activeClass
          : "border-transparent text-muted-foreground hover:border-white/15 hover:text-foreground",
      )}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </button>
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
