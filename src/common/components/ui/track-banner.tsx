import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — track unit banner.
   The chunky colored header on a track home: section/unit eyebrow +
   title + an optional "Guide" button on the right divider. */
type TrackBannerTrack =
  | "prompting"
  | "mcp"
  | "skills"
  | "agents"
  | "tooling"
  | "evals"

const bannerVariants = cva(
  "flex items-stretch overflow-hidden rounded-xl",
  {
    variants: {
      track: {
        prompting:
          "bg-track-prompting text-track-prompting-ink shadow-[0_6px_0_0_var(--track-prompting-shadow)]",
        mcp: "bg-track-mcp text-white shadow-[0_6px_0_0_var(--track-mcp-shadow)]",
        skills:
          "bg-track-skills text-track-skills-ink shadow-[0_6px_0_0_var(--track-skills-shadow)]",
        agents:
          "bg-track-agents text-white shadow-[0_6px_0_0_var(--track-agents-shadow)]",
        tooling:
          "bg-track-tooling text-track-tooling-ink shadow-[0_6px_0_0_var(--track-tooling-shadow)]",
        evals:
          "bg-track-evals text-white shadow-[0_6px_0_0_var(--track-evals-shadow)]",
      },
    },
    defaultVariants: { track: "prompting" },
  },
)

const dividerVariants = cva("w-px self-stretch", {
  variants: {
    track: {
      prompting: "bg-track-prompting-shadow",
      mcp: "bg-track-mcp-shadow",
      skills: "bg-track-skills-shadow",
      agents: "bg-track-agents-shadow",
      tooling: "bg-track-tooling-shadow",
      evals: "bg-track-evals-shadow",
    },
  },
  defaultVariants: { track: "prompting" },
})

type TrackBannerProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof bannerVariants> & {
    eyebrow?: React.ReactNode
    title: React.ReactNode
    action?: React.ReactNode
    track?: TrackBannerTrack
  }

function TrackBanner({
  className,
  track = "prompting",
  eyebrow,
  title,
  action,
  ...props
}: TrackBannerProps) {
  return (
    <div
      data-slot="track-banner"
      data-track={track}
      className={cn(bannerVariants({ track }), className)}
      {...props}
    >
      <div className="flex-1 px-6 py-5">
        {eyebrow ? (
          <div className="font-display font-bold text-[12px] uppercase tracking-[0.14em] opacity-75">
            {eyebrow}
          </div>
        ) : null}
        <div className="mt-1 font-display font-bold text-xl leading-tight tracking-tight">
          {title}
        </div>
      </div>
      {action ? (
        <>
          <div className={cn(dividerVariants({ track }))} />
          <div className="flex items-center justify-center px-4">{action}</div>
        </>
      ) : null}
    </div>
  )
}

export { TrackBanner, bannerVariants }
export type { TrackBannerProps, TrackBannerTrack }
