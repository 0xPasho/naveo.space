"use client"

import { useTranslations } from "next-intl"

import { ExerciseMarkdown } from "@/common/components/exercise-markdown"
import { ExerciseQuestion } from "@/common/components/exercise-question"
import { Eyebrow, FeedbackStrip } from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
import type { ExerciseAB } from "@/modules/content/types"

import type { ABPayload, AttemptResult } from "../../types"

type Props = {
  exercise: ExerciseAB
  value: ABPayload
  onChange: (next: ABPayload) => void
  result: AttemptResult | null
}

const emptyPayload = (): ABPayload => ({ kind: "prompt-AB", choice: null })

type CardState = "idle" | "selected" | "correct" | "wrong"

const CARD_CLASSES: Record<CardState, string> = {
  idle: "bg-bg-surface border-line-strong shadow-[0_4px_0_0_rgba(0,0,0,0.5)] hover:border-ink-3",
  selected:
    "bg-primary-soft border-primary shadow-[0_4px_0_0_var(--primary-shadow)]",
  correct:
    "bg-success-soft border-success shadow-[0_4px_0_0_var(--success-shadow)]",
  wrong:
    "bg-danger-soft border-danger shadow-[0_4px_0_0_var(--danger-shadow)]",
}

const LETTER_CLASSES: Record<CardState, string> = {
  idle: "bg-bg-raised text-ink-3 border-line-strong",
  selected: "bg-primary text-primary-foreground border-primary",
  correct: "bg-success text-bg-deep border-success",
  wrong: "bg-danger text-white border-danger",
}

export function PromptABRunner({ exercise, value, onChange, result }: Props) {
  const t = useTranslations("lessons.ab")
  const tShared = useTranslations("lessons.assemble")
  const showResult = Boolean(result)
  // Lock buttons ONLY after a passing attempt. On a failed attempt leave
  // them clickable so the user can re-pick (the parent step-shell clears
  // `result` on every `onChange` edit, returning to interactive state).
  const locked = result?.passed === true
  const correct = exercise.correct

  const stateFor = (letter: "A" | "B"): CardState => {
    if (showResult) {
      if (letter === correct) return "correct"
      if (value.choice === letter && letter !== correct) return "wrong"
      return "idle"
    }
    if (value.choice === letter) return "selected"
    return "idle"
  }

  const renderCard = (letter: "A" | "B", text: string) => {
    const state = stateFor(letter)
    return (
      <button
        key={letter}
        type="button"
        onClick={() => onChange({ kind: "prompt-AB", choice: letter })}
        disabled={locked}
        className={cn(
          // `min-w-0` lets the button shrink inside the 2-col grid; without
          // it the intrinsic width of the mono-styled option text would
          // push the card past its track and overflow to the right.
          "flex w-full min-w-0 flex-col gap-3 rounded-lg border-2 p-4 text-left",
          "font-sans text-base text-ink-1",
          "transition-[transform,box-shadow,border-color,background-color] duration-fast ease-out",
          "active:translate-y-1 active:shadow-none cursor-pointer",
          "disabled:cursor-default disabled:active:translate-y-0",
          CARD_CLASSES[state],
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-sm border-2 font-display font-bold text-base",
              LETTER_CLASSES[state],
            )}
          >
            {letter}
          </span>
          <Eyebrow className="text-ink-3">
            {letter === "A" ? t("variantA") : t("variantB")}
          </Eyebrow>
        </div>
        <ExerciseMarkdown
          text={text}
          className="font-mono text-sm leading-relaxed text-ink-2"
        />
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>{t("kind")}</Eyebrow>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          {t("label")}
        </span>
      </div>

      <ExerciseQuestion text={exercise.question} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {renderCard("A", exercise.optionA)}
        {renderCard("B", exercise.optionB)}
      </div>

      <div className="flex flex-col gap-1 rounded-md border-2 border-line-soft bg-bg-raised p-3.5">
        <Eyebrow className="text-stat-xp">{t("rubricEyebrow")}</Eyebrow>
        <div className="font-sans text-sm font-semibold text-ink-2">
          {t("rubricHint")}
        </div>
      </div>

      {showResult && result ? (
        <FeedbackStrip
          tone={result.passed ? "success" : "error"}
          title={result.passed ? tShared("passed") : tShared("failed")}
          body={
            <ExerciseMarkdown
              text={exercise.explanation}
              className="font-sans text-sm font-semibold leading-relaxed"
            />
          }
        />
      ) : null}
    </div>
  )
}

PromptABRunner.empty = emptyPayload
PromptABRunner.isComplete = (
  _exercise: ExerciseAB,
  value: ABPayload,
): boolean => {
  // Require an explicit pick before Comprobar enables — otherwise the user
  // could submit without engaging and burn hearts on the default.
  void _exercise
  return value.choice !== null
}
