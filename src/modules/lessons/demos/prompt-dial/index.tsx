"use client"

import {
  type LucideIcon,
  AlertOctagon,
  Check,
  FileText,
  Info,
  Radio,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { forwardRef, useRef, useState } from "react"

import { Card } from "@/common/components/ui"
import { PromptEditor } from "@/common/components/prompt-editor"
import { cn } from "@/common/lib/utils"
import { isCrewSlug } from "@/modules/crew"
import type { CrewSlug } from "@/modules/crew"

import { DemoPresenterHeader } from "../_shared/presenter-header"

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
  const t = useTranslations("lessons.demos.promptDial")
  const before = props && isPair(props.before) ? props.before : null
  const after = props && isPair(props.after) ? props.after : null
  const note = props && typeof props.note === "string" ? props.note : null
  const presenter =
    props && isCrewSlug(props.presenter as string)
      ? (props.presenter as CrewSlug)
      : null
  const intent =
    props && typeof props.intent === "string" ? props.intent : null

  if (!before || !after) {
    return (
      <Card className="border-dashed px-4 py-6 text-sm text-ink-3">
        {t("missingPair")}
      </Card>
    )
  }

  return (
    <Dial
      before={before}
      after={after}
      note={note}
      presenter={presenter}
      intent={intent}
    />
  )
}

function Dial({
  before,
  after,
  note,
  presenter,
  intent,
}: {
  before: Pair
  after: Pair
  note: string | null
  presenter: CrewSlug | null
  intent: string | null
}) {
  const t = useTranslations("lessons.demos.promptDial")
  const [side, setSide] = useState<"before" | "after">("before")
  const active = side === "before" ? before : after
  const beforeLabel = before.label ?? t("defaultBefore")
  const afterLabel = after.label ?? t("defaultAfter")
  const isAfter = side === "after"
  const beforeTabRef = useRef<HTMLButtonElement | null>(null)
  const afterTabRef = useRef<HTMLButtonElement | null>(null)
  const beforePanelId = "prompt-dial-panel-before"
  const afterPanelId = "prompt-dial-panel-after"
  const beforeTabId = "prompt-dial-tab-before"
  const afterTabId = "prompt-dial-tab-after"

  // Arrow-key roving between the two tabs (WAI-ARIA tabs pattern). Home/End
  // jump to the extremes; Left/Right toggle.
  const onTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") {
      e.preventDefault()
      const target = e.key === "ArrowRight" || e.key === "End" ? "after" : "before"
      setSide(target)
      const ref = target === "before" ? beforeTabRef : afterTabRef
      ref.current?.focus()
    }
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0">
        {presenter ? (
          <DemoPresenterHeader slug={presenter} intent={intent ?? undefined} />
        ) : null}
        <header className="flex items-start justify-between gap-3 border-b-2 border-line-soft bg-bg-sunken px-3 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-track-prompting">
              {t("eyebrow")}
            </p>
            <h2 className="mt-1 font-display text-lg font-bold leading-tight text-ink-1">
              {t("title")}
            </h2>
          </div>
          <div
            className={cn(
              "rounded-md border-2 px-2 py-1 font-mono text-[10px] uppercase tracking-wider",
              isAfter
                ? "border-stat-xp/40 text-stat-xp"
                : "border-danger/40 text-danger",
            )}
          >
            {isAfter ? afterLabel : beforeLabel}
          </div>
        </header>

        <div
          role="tablist"
          aria-label={t("tablistAria")}
          className="grid grid-cols-2 gap-1 border-b-2 border-line-soft bg-bg-sunken p-1"
        >
          <DialTab
            ref={beforeTabRef}
            id={beforeTabId}
            controls={beforePanelId}
            label={beforeLabel}
            icon={AlertOctagon}
            active={side === "before"}
            onClick={() => setSide("before")}
            onKeyDown={onTabKeyDown}
            tone="danger"
          />
          <DialTab
            ref={afterTabRef}
            id={afterTabId}
            controls={afterPanelId}
            label={afterLabel}
            icon={Check}
            active={side === "after"}
            onClick={() => setSide("after")}
            onKeyDown={onTabKeyDown}
            tone="gold"
          />
        </div>

        <div
          key={side}
          role="tabpanel"
          id={isAfter ? afterPanelId : beforePanelId}
          aria-labelledby={isAfter ? afterTabId : beforeTabId}
          className="animate-attempt-pass"
        >
          <PanelHeader
            icon={Radio}
            label={t("promptLabel")}
            value={`${active.prompt.length} chars`}
          />
          <PromptEditor
            value={active.prompt}
            readOnly
            language="markdown"
            minHeight={140}
            maxHeight={280}
            className="bg-bg-sunken"
          />
          <PanelHeader
            icon={FileText}
            label={t("outputLabel")}
            value={`${active.output.length} chars`}
          />
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words bg-bg-sunken/50 px-3 py-2.5 font-mono text-xs leading-relaxed text-ink-1">
            {active.output}
          </pre>
        </div>
      </Card>

      {note ? (
        <Card className="p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-track-prompting">
            <Info className="mr-1 inline size-3" aria-hidden />
            {t("noteLabel")}
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-ink-3">
            {note}
          </p>
        </Card>
      ) : null}
    </div>
  )
}

type DialTabProps = {
  id: string
  controls: string
  label: string
  icon: LucideIcon
  active: boolean
  onClick: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void
  tone: "danger" | "gold"
}

const DialTab = forwardRef<HTMLButtonElement, DialTabProps>(function DialTab(
  { id, controls, label, icon: Icon, active, onClick, onKeyDown, tone },
  ref,
) {
  const activeClass =
    tone === "danger"
      ? "border-danger/40 bg-danger-soft text-danger"
      : "border-stat-xp/40 bg-stat-xp/10 text-stat-xp"
  return (
    <button
      ref={ref}
      id={id}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cn(
        "flex items-center justify-center gap-2 rounded-md border-2 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all",
        active
          ? activeClass
          : "border-transparent text-ink-3 hover:border-line-soft hover:text-ink-1",
      )}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </button>
  )
})

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
    <div className="flex items-center justify-between gap-3 border-b-2 border-line-soft bg-bg-sunken px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md border-2 border-track-prompting/25 text-track-prompting">
          <Icon className="size-3.5" aria-hidden />
        </span>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">
          {label}
        </p>
      </div>
      <p className="font-mono text-[10px] tabular-nums text-ink-3">
        {value}
      </p>
    </div>
  )
}
