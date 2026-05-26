"use client"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — selectable MCQ answer card.
   Four states: idle / selected / correct / wrong. Letter badge on the
   left reads as a label and shifts color with the state. */
type MCQState = "idle" | "selected" | "correct" | "wrong"

const optionVariants = cva(
  [
    "flex w-full items-center gap-3.5",
    "px-4 py-4",
    "rounded-lg border-2",
    "font-sans font-bold text-base text-ink-1",
    "transition-[transform,box-shadow,border-color,background-color] duration-fast ease-out",
    "active:translate-y-1 active:shadow-none",
    "cursor-pointer text-left",
  ].join(" "),
  {
    variants: {
      state: {
        idle:
          "bg-bg-surface border-line-strong shadow-[0_4px_0_0_rgba(0,0,0,0.5)] hover:border-ink-3",
        selected:
          "bg-primary-soft border-primary shadow-[0_4px_0_0_var(--primary-shadow)]",
        correct:
          "bg-success-soft border-success shadow-[0_4px_0_0_var(--success-shadow)]",
        wrong:
          "bg-danger-soft border-danger shadow-[0_4px_0_0_var(--danger-shadow)]",
      },
    },
    defaultVariants: { state: "idle" },
  },
)

const letterVariants = cva(
  "inline-flex size-8 items-center justify-center rounded-sm border-2 font-display font-bold text-base",
  {
    variants: {
      state: {
        idle: "bg-bg-raised text-ink-3 border-line-strong",
        selected: "bg-primary text-primary-foreground border-primary",
        correct: "bg-success text-track-skills-ink border-success",
        wrong: "bg-danger text-white border-danger",
      },
    },
    defaultVariants: { state: "idle" },
  },
)

type MCQOptionProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> &
  VariantProps<typeof optionVariants> & {
    state?: MCQState
    letter?: React.ReactNode
    label: React.ReactNode
  }

function MCQOption({
  className,
  state = "idle",
  letter,
  label,
  ...props
}: MCQOptionProps) {
  return (
    <button
      data-slot="mcq-option"
      data-state={state}
      type="button"
      className={cn(optionVariants({ state }), className)}
      {...props}
    >
      {letter ? (
        <span className={cn(letterVariants({ state }))}>{letter}</span>
      ) : null}
      <span className="flex-1">{label}</span>
    </button>
  )
}

export { MCQOption, optionVariants }
export type { MCQOptionProps, MCQState }
