import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — chunky 3D lesson path node.
   Duolingo-style: solid color disc + icon + chunky drop shadow.
   No inner gradient sheen (was too "AI-slop"). Active state pops with a
   glow ring + the START badge above. Locked nodes are dead-grayscale. */
type LessonNodeState = "locked" | "available" | "active" | "done"
type LessonNodeTrack =
  | "prompting"
  | "mcp"
  | "skills"
  | "agents"
  | "tooling"
  | "evals"

const nodeVariants = cva(
  "relative inline-flex items-center justify-center rounded-full transition-[transform,box-shadow] duration-fast ease-out active:translate-y-1.5 active:shadow-none",
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
      state: {
        locked:
          "!bg-bg-raised !text-ink-4 !shadow-[0_6px_0_0_rgba(0,0,0,0.5)] grayscale opacity-50 cursor-not-allowed active:translate-y-0 active:shadow-[0_6px_0_0_rgba(0,0,0,0.5)]",
        available: "",
        active: "",
        done: "",
      },
    },
    defaultVariants: { track: "prompting", state: "available" },
  },
)

type LessonNodeProps = Omit<
  React.HTMLAttributes<HTMLButtonElement>,
  "children"
> &
  VariantProps<typeof nodeVariants> & {
    state?: LessonNodeState
    track?: LessonNodeTrack
    label?: React.ReactNode
    size?: number
    icon?: React.ReactNode
  }

/* Ring color per track — used by the active state's halo. */
const RING_COLOR: Record<LessonNodeTrack, string> = {
  prompting: "ring-track-prompting/40",
  mcp: "ring-track-mcp/40",
  skills: "ring-track-skills/40",
  agents: "ring-track-agents/40",
  tooling: "ring-track-tooling/40",
  evals: "ring-track-evals/40",
}

function LessonNode({
  className,
  state = "available",
  track = "prompting",
  label,
  size = 80,
  icon,
  ...props
}: LessonNodeProps) {
  const ring =
    state === "active" ? `ring-8 ring-offset-2 ring-offset-bg-deep ${RING_COLOR[track]}` : ""

  return (
    <div className="inline-flex flex-col items-center gap-1.5">
      {state === "active" ? (
        <div className="relative mb-1 rounded-xs bg-white px-3 py-1 font-display font-bold text-[13px] text-bg-deep shadow-elev-1">
          START
          <div className="absolute left-1/2 top-full size-0 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-white" />
        </div>
      ) : null}
      <button
        data-slot="lesson-node"
        data-state={state}
        data-track={track}
        className={cn(nodeVariants({ track, state }), ring, className)}
        style={{ width: size, height: size }}
        disabled={state === "locked"}
        {...props}
      >
        <span className="relative" style={{ fontSize: size * 0.4 }}>
          {icon}
        </span>
      </button>
      {label ? (
        <div className="font-display font-bold text-xs text-ink-3">{label}</div>
      ) : null}
    </div>
  )
}

export { LessonNode, nodeVariants }
export type { LessonNodeProps, LessonNodeState, LessonNodeTrack }
