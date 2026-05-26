import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Eyebrow } from "@/common/components/ui"
import { CrewCharacter } from "@/modules/crew"

// Mini lesson player. Mirrors the real (player) layout: reading pane left,
// exercise pane right, chunky footer with Back / Check / Next. Static; the
// MCQ options are pre-set to one "correct" and one "wrong" so the preview
// communicates the rubric experience without needing client interactivity.
export async function LandingPlayerPreview() {
  const t = await getTranslations("home.preview")

  return (
    <div
      aria-label={t("aria")}
      className="overflow-hidden rounded-2xl border-2 border-line-strong bg-bg-surface shadow-elev-3"
    >
      {/* Top bar — mock breadcrumb + progress, matches real player */}
      <div className="flex items-center justify-between gap-3 border-b-2 border-line-soft bg-bg-raised px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex size-6 items-center justify-center rounded-sm bg-track-prompting/20">
            <span className="size-2 rounded-full bg-track-prompting" />
          </span>
          <span className="truncate font-display font-bold text-xs uppercase tracking-[0.14em] text-ink-2">
            {t("breadcrumb")}
          </span>
        </div>
        <span className="font-display font-bold text-xs tabular-nums text-ink-3">
          3 / 8
        </span>
      </div>

      <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
        {/* Reading pane */}
        <div className="flex flex-col gap-3 border-b-2 border-line-soft p-5 md:border-b-0 md:border-r-2">
          <Eyebrow className="text-track-prompting">
            {t("reading.eyebrow")}
          </Eyebrow>
          <h3 className="font-display font-bold text-lg leading-tight tracking-tight text-ink-1">
            {t("reading.title")}
          </h3>
          <p className="font-sans text-sm font-semibold leading-relaxed text-ink-2">
            {t("reading.body")}
          </p>
          <div className="mt-1 rounded-md border-2 border-line-soft bg-bg-sunken p-3 font-mono text-xs leading-relaxed text-ink-2">
            <span className="text-track-prompting">{"<role>"}</span>
            {" " + t("reading.snippetRole") + " "}
            <span className="text-track-prompting">{"</role>"}</span>
          </div>
        </div>

        {/* Exercise pane */}
        <div className="flex flex-col gap-4 bg-bg-deep p-5">
          <Eyebrow>{t("exercise.eyebrow")}</Eyebrow>
          <p className="font-display font-bold text-sm leading-snug text-ink-1">
            {t("exercise.question")}
          </p>

          <div className="flex flex-col gap-2.5">
            <PreviewOption
              letter="A"
              label={t("exercise.optionA")}
              state="idle"
            />
            <PreviewOption
              letter="B"
              label={t("exercise.optionB")}
              state="correct"
            />
          </div>

          <div className="mt-1 flex items-start gap-2.5 rounded-md border-2 border-success/40 bg-success-soft px-3 py-2.5">
            <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-success">
              <Sparkles className="size-3.5 text-bg-deep" strokeWidth={3} />
            </span>
            <p className="font-sans text-xs font-semibold leading-snug text-ink-1">
              {t("exercise.feedback")}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t-2 border-line-soft bg-bg-raised px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-md border-2 border-line-strong bg-bg-surface text-ink-3">
            <ArrowLeft className="size-4" strokeWidth={2.5} />
          </span>
          <span className="font-display font-bold text-[11px] uppercase tracking-[0.12em] text-ink-3">
            {t("footer.back")}
          </span>
        </div>
        <span className="flex items-center gap-1.5">
          <CrewCharacter
            slug="vega"
            expression="happy"
            size={28}
            flat
            title="Vega"
          />
          <span className="font-display font-bold text-[11px] uppercase tracking-[0.12em] text-ink-3">
            {t("footer.guide")}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-[11px] uppercase tracking-[0.12em] text-primary">
            {t("footer.next")}
          </span>
          <span className="inline-flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-[0_3px_0_0_var(--primary-shadow)]">
            <ArrowRight className="size-4" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </div>
  )
}

type PreviewOptionProps = {
  letter: string
  label: string
  state: "idle" | "correct"
}

function PreviewOption({ letter, label, state }: PreviewOptionProps) {
  const isCorrect = state === "correct"
  return (
    <div
      className={
        isCorrect
          ? "flex items-center gap-3 rounded-md border-2 border-success bg-success-soft px-3 py-2.5 shadow-[0_3px_0_0_var(--success-shadow)]"
          : "flex items-center gap-3 rounded-md border-2 border-line-strong bg-bg-surface px-3 py-2.5 shadow-[0_3px_0_0_rgba(0,0,0,0.45)]"
      }
    >
      <span
        className={
          isCorrect
            ? "inline-flex size-7 items-center justify-center rounded-sm border-2 border-success bg-success font-display font-bold text-sm text-track-skills-ink"
            : "inline-flex size-7 items-center justify-center rounded-sm border-2 border-line-strong bg-bg-raised font-display font-bold text-sm text-ink-3"
        }
      >
        {letter}
      </span>
      <span className="font-sans text-sm font-bold text-ink-1">{label}</span>
    </div>
  )
}
