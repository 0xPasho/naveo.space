import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — celebration / stat tile.
   `variant="fill"` (default) — saturated chunky background, used for the
   lesson-complete row in the player. `variant="outline"` — bg-bg-surface
   with a colored border + caps label + big tabular number, used for the
   profile stats strip and similar QUIETER displays (closer to Duolingo's
   "TOTAL XP / GREAT / SPEEDY" tile row). */
const tileVariants = cva(
  "flex w-full flex-col items-center gap-1.5 rounded-xl px-5 py-5 text-center",
  {
    variants: {
      variant: {
        fill: "",
        outline: "border-2 bg-bg-surface",
      },
      tone: {
        xp: "",
        streak: "",
        heart: "",
        gem: "",
        success: "",
        prompting: "",
        mcp: "",
        skills: "",
        agents: "",
        tooling: "",
        evals: "",
      },
    },
    compoundVariants: [
      /* Fill (saturated) */
      { variant: "fill", tone: "xp", className: "bg-stat-xp text-track-skills-ink shadow-[0_6px_0_0_var(--stat-xp-shadow)]" },
      { variant: "fill", tone: "streak", className: "bg-stat-streak text-track-evals-ink shadow-[0_6px_0_0_var(--stat-streak-shadow)]" },
      { variant: "fill", tone: "heart", className: "bg-stat-heart text-white shadow-[0_6px_0_0_var(--stat-heart-shadow)]" },
      { variant: "fill", tone: "gem", className: "bg-stat-gem text-track-prompting-ink shadow-[0_6px_0_0_var(--stat-gem-shadow)]" },
      { variant: "fill", tone: "success", className: "bg-success text-track-skills-ink shadow-[0_6px_0_0_var(--success-shadow)]" },
      { variant: "fill", tone: "prompting", className: "bg-track-prompting text-track-prompting-ink shadow-[0_6px_0_0_var(--track-prompting-shadow)]" },
      { variant: "fill", tone: "mcp", className: "bg-track-mcp text-white shadow-[0_6px_0_0_var(--track-mcp-shadow)]" },
      { variant: "fill", tone: "skills", className: "bg-track-skills text-track-skills-ink shadow-[0_6px_0_0_var(--track-skills-shadow)]" },
      { variant: "fill", tone: "agents", className: "bg-track-agents text-white shadow-[0_6px_0_0_var(--track-agents-shadow)]" },
      { variant: "fill", tone: "tooling", className: "bg-track-tooling text-track-tooling-ink shadow-[0_6px_0_0_var(--track-tooling-shadow)]" },
      { variant: "fill", tone: "evals", className: "bg-track-evals text-white shadow-[0_6px_0_0_var(--track-evals-shadow)]" },
      /* Outline (bordered, quieter) */
      { variant: "outline", tone: "xp", className: "border-stat-xp/50 text-stat-xp" },
      { variant: "outline", tone: "streak", className: "border-stat-streak/50 text-stat-streak" },
      { variant: "outline", tone: "heart", className: "border-stat-heart/50 text-stat-heart" },
      { variant: "outline", tone: "gem", className: "border-stat-gem/50 text-stat-gem" },
      { variant: "outline", tone: "success", className: "border-success/50 text-success" },
      { variant: "outline", tone: "prompting", className: "border-track-prompting/50 text-track-prompting" },
      { variant: "outline", tone: "mcp", className: "border-track-mcp/50 text-track-mcp" },
      { variant: "outline", tone: "skills", className: "border-track-skills/50 text-track-skills" },
      { variant: "outline", tone: "agents", className: "border-track-agents/50 text-track-agents" },
      { variant: "outline", tone: "tooling", className: "border-track-tooling/50 text-track-tooling" },
      { variant: "outline", tone: "evals", className: "border-track-evals/50 text-track-evals" },
    ],
    defaultVariants: { variant: "fill", tone: "xp" },
  },
)

type StatTileProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof tileVariants> & {
    label: React.ReactNode
    value: React.ReactNode
    icon?: React.ReactNode
  }

function StatTile({
  className,
  variant,
  tone,
  label,
  value,
  icon,
  ...props
}: StatTileProps) {
  return (
    <div
      data-slot="stat-tile"
      className={cn(tileVariants({ variant, tone }), className)}
      {...props}
    >
      {icon ? (
        <span
          className={cn(
            "inline-flex size-7 items-center justify-center",
            variant === "outline" ? "" : "opacity-80",
          )}
        >
          {icon}
        </span>
      ) : null}
      <span
        className={cn(
          "font-display font-bold text-[11px] uppercase tracking-[0.14em]",
          variant === "outline" ? "opacity-100" : "opacity-70",
        )}
      >
        {label}
      </span>
      <span className="font-display font-bold text-4xl tracking-tight leading-none">
        {value}
      </span>
    </div>
  )
}

export { StatTile, tileVariants }
export type { StatTileProps }
