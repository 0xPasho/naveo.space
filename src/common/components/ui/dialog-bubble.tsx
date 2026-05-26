import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — tutor speech bubble with a tail pointing at a mascot.
   Tail direction defaults to "left" (mascot is on the left). */
const bubbleVariants = cva(
  "relative inline-block max-w-[420px] break-words rounded-xl border-2 px-5 py-4 font-sans font-bold text-base leading-snug shadow-elev-3",
  {
    variants: {
      tone: {
        neutral: "bg-bg-surface border-line-strong text-ink-1",
        primary: "bg-primary border-primary text-primary-foreground",
        success: "bg-success border-success text-track-skills-ink",
        warn: "bg-warn border-warn text-track-skills-ink",
        danger: "bg-danger border-danger text-white",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
)

const tailVariants = cva(
  "absolute top-6 size-4 rotate-45",
  {
    variants: {
      tone: {
        neutral: "bg-bg-surface",
        primary: "bg-primary",
        success: "bg-success",
        warn: "bg-warn",
        danger: "bg-danger",
      },
      tailSide: {
        left: "-left-2 border-l-2 border-b-2 border-line-strong",
        right: "-right-2 border-t-2 border-r-2 border-line-strong",
      },
    },
    defaultVariants: { tone: "neutral", tailSide: "left" },
  },
)

type DialogBubbleProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof bubbleVariants> & {
    tailSide?: "left" | "right"
  }

function DialogBubble({
  className,
  tone = "neutral",
  tailSide = "left",
  children,
  ...props
}: DialogBubbleProps) {
  return (
    <div className="relative inline-block max-w-full">
      <div
        data-slot="dialog-bubble"
        className={cn(bubbleVariants({ tone }), className)}
        {...props}
      >
        {children}
      </div>
      <span className={cn(tailVariants({ tone, tailSide }))} aria-hidden />
    </div>
  )
}

export { DialogBubble, bubbleVariants }
export type { DialogBubbleProps }
