import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — inline info / warn / success / danger panel.
   Tinted soft background, colored border, icon disc on the left.
   Use for in-context hints (NOT for toast-style transient feedback —
   use FeedbackStrip for the post-attempt bottom panel). */
const calloutVariants = cva(
  [
    "grid grid-cols-[auto_1fr] gap-3.5",
    "p-5",
    "rounded-md border-2",
  ].join(" "),
  {
    variants: {
      tone: {
        info: "bg-primary-soft border-primary text-ink-1",
        success: "bg-success-soft border-success text-ink-1",
        warn: "bg-warn-soft border-warn text-ink-1",
        danger: "bg-danger-soft border-danger text-ink-1",
      },
    },
    defaultVariants: { tone: "info" },
  },
)

const calloutIconVariants = cva(
  "inline-flex size-9 items-center justify-center rounded-sm font-display font-black text-lg",
  {
    variants: {
      tone: {
        info: "bg-primary text-primary-foreground",
        success: "bg-success text-track-skills-ink",
        warn: "bg-warn text-track-skills-ink",
        danger: "bg-danger text-white",
      },
    },
    defaultVariants: { tone: "info" },
  },
)

type CalloutProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof calloutVariants> & {
    eyebrow?: React.ReactNode
    icon?: React.ReactNode
  }

function Callout({
  className,
  tone = "info",
  eyebrow,
  icon,
  children,
  ...props
}: CalloutProps) {
  return (
    <div
      data-slot="callout"
      className={cn(calloutVariants({ tone }), className)}
      {...props}
    >
      <div className={cn(calloutIconVariants({ tone }))}>{icon ?? "i"}</div>
      <div>
        {eyebrow ? (
          <div className="mb-1.5 font-display font-bold text-[11px] uppercase tracking-[0.12em]">
            {eyebrow}
          </div>
        ) : null}
        <div className="font-sans font-semibold leading-relaxed text-ink-1">
          {children}
        </div>
      </div>
    </div>
  )
}

export { Callout, calloutVariants }
export type { CalloutProps }
