import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — placeholder crew avatar.
   Until real illustrations land, the mascot is a labeled track-colored
   disc with two simple eyes and a tiny insignia. Each crew member maps
   to a track color (subject to change once art is final). */
type MascotCrew = "vega" | "atlas" | "echo" | "forge"

const mascotVariants = cva(
  "relative inline-flex items-center justify-center rounded-[42%_42%_46%_46%_/_50%_50%_42%_42%] before:pointer-events-none before:absolute before:inset-[7%] before:rounded-[inherit] before:bg-gradient-to-b before:from-white/20 before:to-transparent",
  {
    variants: {
      crew: {
        vega:
          "bg-track-skills shadow-[0_var(--mascot-drop)_0_0_var(--track-skills-shadow)]",
        atlas:
          "bg-track-mcp shadow-[0_var(--mascot-drop)_0_0_var(--track-mcp-shadow)]",
        echo:
          "bg-track-prompting shadow-[0_var(--mascot-drop)_0_0_var(--track-prompting-shadow)]",
        forge:
          "bg-track-evals shadow-[0_var(--mascot-drop)_0_0_var(--track-evals-shadow)]",
      },
    },
    defaultVariants: { crew: "vega" },
  },
)

const crewLabel: Record<MascotCrew, string> = {
  vega: "Vega",
  atlas: "Atlas",
  echo: "Echo",
  forge: "Forge",
}

type MascotProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof mascotVariants> & {
    size?: number
    showLabel?: boolean
  }

function Mascot({
  className,
  crew,
  size = 96,
  showLabel = true,
  ...props
}: MascotProps) {
  const resolvedCrew: MascotCrew = crew ?? "vega"
  const eye = size * 0.12
  const drop = Math.max(4, Math.round(size * 0.07))
  return (
    <div
      className="inline-flex flex-col items-center gap-2"
      style={{ ["--mascot-drop" as string]: `${drop}px` }}
    >
      <div
        data-slot="mascot"
        data-crew={resolvedCrew}
        className={cn(mascotVariants({ crew: resolvedCrew }), className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <div
          className="relative flex"
          style={{ gap: size * 0.16, marginTop: size * 0.04 }}
        >
          <span
            className="block rounded-full bg-bg-deep"
            style={{ width: eye, height: eye * 1.25 }}
          />
          <span
            className="block rounded-full bg-bg-deep"
            style={{ width: eye, height: eye * 1.25 }}
          />
        </div>
        <span
          className="absolute rounded-full bg-stat-xp"
          style={{
            top: size * 0.18,
            right: size * 0.18,
            width: size * 0.1,
            height: size * 0.1,
            boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.3)",
          }}
        />
      </div>
      {showLabel ? (
        <div className="font-display font-bold text-[13px] uppercase tracking-wide text-ink-3">
          {crewLabel[resolvedCrew]}
        </div>
      ) : null}
    </div>
  )
}

export { Mascot, mascotVariants }
export type { MascotProps, MascotCrew }
