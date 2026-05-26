import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — post-attempt bottom feedback strip.
   Sticks at the bottom of the lesson player with "Amazing!" /
   "Incorrect" + body + a primary action. Border-top + tinted bg keep
   the eye on the action, not the strip itself. */
const stripVariants = cva("px-6 pb-6 pt-5 border-t-2", {
  variants: {
    tone: {
      success: "bg-success-soft border-success",
      error: "bg-danger-soft border-danger",
    },
  },
  defaultVariants: { tone: "success" },
})

const iconVariants = cva(
  "inline-flex size-9 items-center justify-center rounded-full font-display font-black text-xl",
  {
    variants: {
      tone: {
        success: "bg-success text-bg-deep",
        error: "bg-danger text-bg-deep",
      },
    },
    defaultVariants: { tone: "success" },
  },
)

type FeedbackStripProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof stripVariants> & {
    title: React.ReactNode
    body?: React.ReactNode
    action?: React.ReactNode
    secondary?: React.ReactNode
  }

function FeedbackStrip({
  className,
  tone = "success",
  title,
  body,
  action,
  secondary,
  ...props
}: FeedbackStripProps) {
  const glyph = tone === "success" ? "✓" : "✕"
  return (
    <div
      data-slot="feedback-strip"
      data-tone={tone}
      className={cn(stripVariants({ tone }), className)}
      {...props}
    >
      <div className="mb-3 flex items-center gap-3">
        <span className={cn(iconVariants({ tone }))}>{glyph}</span>
        <div
          className={cn(
            "font-display font-bold text-2xl",
            tone === "success" ? "text-success" : "text-danger",
          )}
        >
          {title}
        </div>
      </div>
      {body ? (
        <div
          className={cn(
            "mb-3.5 font-sans font-semibold opacity-85",
            tone === "success" ? "text-success" : "text-danger",
          )}
        >
          {body}
        </div>
      ) : null}
      <div className="flex gap-2.5">
        {secondary}
        {action}
      </div>
    </div>
  )
}

export { FeedbackStrip, stripVariants }
export type { FeedbackStripProps }
