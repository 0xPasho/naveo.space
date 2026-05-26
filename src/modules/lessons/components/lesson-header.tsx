import { ChevronRight, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { ChunkyProgress } from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import type { Course, Step, Track } from "@/modules/content/types"

type Props = {
  track: Track
  course: Course
  step: Step
  positionInCourse: number
  totalInCourse: number
}

// Map known track slugs to Naveo Bridge track tones. Defaults to
// "prompting" so unknown tracks still render with a sensible accent.
const TRACK_SLUG_TONE: Record<
  string,
  "prompting" | "mcp" | "skills" | "agents" | "tooling" | "evals"
> = {
  prompting: "prompting",
  "prompts-y-comportamiento": "prompting",
  mcp: "mcp",
  "forge-te-da-las-herramientas": "mcp",
  skills: "skills",
  "skills-poderes": "skills",
  agents: "agents",
  "agentes-multi-paso": "agents",
  tooling: "tooling",
  evals: "evals",
}

const TRACK_TEXT_CLASS = {
  prompting: "text-track-prompting",
  mcp: "text-track-mcp",
  skills: "text-track-skills",
  agents: "text-track-agents",
  tooling: "text-track-tooling",
  evals: "text-track-evals",
} as const

// Lesson context bar — second row below the global Hud. Holds the lesson-
// specific affordances: breadcrumb, step counter, and a chunky inline
// progress bar showing course completion. The global stats (XP / streak /
// gems / hearts) live in the Hud above.
export function LessonHeader({
  track,
  course,
  step,
  positionInCourse,
  totalInCourse,
}: Props) {
  const t = useTranslations("lessons")
  const pct =
    totalInCourse === 0
      ? 0
      : Math.min(100, Math.round((positionInCourse / totalInCourse) * 100))
  const tone = TRACK_SLUG_TONE[track.slug] ?? "prompting"

  return (
    <header
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b-2 border-line-strong bg-bg-surface px-4 py-3 sm:flex sm:gap-3.5 sm:px-5"
      aria-label={t("bar.exit")}
    >
      <Link
        href={`/tracks/${track.slug}`}
        aria-label={t("bar.exit")}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm border-2 border-line-strong bg-bg-raised text-ink-2 outline-none transition-colors duration-fast hover:text-ink-1 focus-visible:ring-4 focus-visible:ring-primary-soft"
      >
        <X className="size-4" strokeWidth={3} />
      </Link>

      <nav
        aria-label="breadcrumb"
        className="min-w-0 font-display font-bold"
      >
        <div className="flex min-w-0 flex-col gap-1 sm:hidden">
          <Link
            href={`/tracks/${track.slug}`}
            className={`${TRACK_TEXT_CLASS[tone]} truncate text-xs leading-none hover:underline`}
          >
            {track.title}
          </Link>
          <span className="truncate text-sm leading-tight text-ink-1">
            {step.title}
          </span>
        </div>
        <div className="hidden items-center gap-1.5 text-[13px] sm:flex">
          <Link
            href={`/tracks/${track.slug}`}
            className={`${TRACK_TEXT_CLASS[tone]} hover:underline`}
          >
            {track.title}
          </Link>
          <ChevronRight className="size-3 text-ink-4" strokeWidth={3} />
          <Link
            href={`/tracks/${track.slug}/${course.slug}`}
            className="text-ink-2 hover:text-ink-1 hover:underline"
          >
            {course.title}
          </Link>
          <ChevronRight className="size-3 text-ink-4" strokeWidth={3} />
          <span className="text-ink-1">{step.title}</span>
        </div>
      </nav>

      <div className="col-span-3 hidden flex-1 px-5 sm:block">
        <ChunkyProgress
          value={pct}
          tone={tone}
          aria-label="Course progress"
        />
      </div>

      <span className="shrink-0 text-right font-mono text-[11px] font-bold uppercase leading-tight tracking-wider text-ink-3">
        <span className="hidden sm:inline">STEP </span>
        <span className="text-ink-1">{positionInCourse}</span> /{" "}
        {totalInCourse}
      </span>
    </header>
  )
}
