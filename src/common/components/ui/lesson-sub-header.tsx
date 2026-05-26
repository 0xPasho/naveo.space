"use client"

import { ChevronRight, X } from "lucide-react"

import { cn } from "@/common/lib/utils"

import { ChunkyProgress } from "./chunky-progress"

/* Naveo "Bridge" — lesson player sub-header.
   Close button | breadcrumb (track > unit > lesson) | inline progress |
   step indicator | trailing slot (e.g., Tutor button).
   Lives below the TopHud on the lesson player screen. */
type LessonBreadcrumb = {
  /** Track id drives the breadcrumb accent color. */
  track:
    | "prompting"
    | "mcp"
    | "skills"
    | "agents"
    | "tooling"
    | "evals"
  /** Track label, e.g. "Prompting". */
  trackLabel: React.ReactNode
  unit: React.ReactNode
  lesson: React.ReactNode
}

type LessonSubHeaderProps = {
  breadcrumb: LessonBreadcrumb
  /** 0–100. Drives the inline progress fill. */
  progress: number
  /** "STEP 3 / 6" style indicator. */
  step: React.ReactNode
  onClose?: () => void
  trailing?: React.ReactNode
  className?: string
}

const TRACK_TEXT = {
  prompting: "text-track-prompting",
  mcp: "text-track-mcp",
  skills: "text-track-skills",
  agents: "text-track-agents",
  tooling: "text-track-tooling",
  evals: "text-track-evals",
} as const

function LessonSubHeader({
  breadcrumb,
  progress,
  step,
  onClose,
  trailing,
  className,
}: LessonSubHeaderProps) {
  return (
    <div
      data-slot="lesson-sub-header"
      className={cn(
        "flex items-center gap-3.5 border-b-2 border-line-strong bg-bg-surface px-5 py-3",
        className,
      )}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close lesson"
        className="inline-flex size-9 items-center justify-center rounded-sm border-2 border-line-strong bg-bg-raised text-ink-2 shadow-elev-1 outline-none transition-colors duration-fast hover:text-ink-1 focus-visible:ring-4 focus-visible:ring-primary-soft"
      >
        <X className="size-4" strokeWidth={3} />
      </button>

      <div className="flex items-center gap-1.5 font-display font-bold text-[13px]">
        <span className={TRACK_TEXT[breadcrumb.track]}>
          {breadcrumb.trackLabel}
        </span>
        <ChevronRight className="size-3 text-ink-4" strokeWidth={3} />
        <span className="text-ink-2">{breadcrumb.unit}</span>
        <ChevronRight className="size-3 text-ink-4" strokeWidth={3} />
        <span className="text-ink-1">{breadcrumb.lesson}</span>
      </div>

      <div className="flex-1 px-5">
        <ChunkyProgress
          value={progress}
          tone={breadcrumb.track}
          aria-label="Lesson progress"
        />
      </div>

      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-3">
        {step}
      </span>

      {trailing}
    </div>
  )
}

export { LessonSubHeader }
export type { LessonSubHeaderProps, LessonBreadcrumb }
