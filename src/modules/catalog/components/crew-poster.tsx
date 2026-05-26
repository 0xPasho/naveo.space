import type { CSSProperties } from "react"

import { CrewCharacter } from "@/modules/crew"
import { cn } from "@/common/lib/utils"

type Props = {
  mascot: "vega" | "atlas" | "echo" | "forge" | "orbit" | "hex"
  label: string
  color: string
}

// Tarot-style crew dossier poster. Top ribbon with rank label, framed
// mascot silhouette underneath. The accent (`color`) is sourced from the
// catalog data (runtime-computed); it's threaded through a `--poster-accent`
// custom property so the rest of the styling stays in Tailwind utilities.
export function CrewPoster({ mascot, label, color }: Props) {
  return (
    <div
      className="relative flex w-full flex-col overflow-hidden rounded-xl border-2 border-line-strong bg-bg-sunken shadow-elev-3"
      style={{ ["--poster-accent" as never]: color } as CSSProperties}
    >
      <div className="flex items-center justify-center gap-2 border-b-2 border-line-strong bg-[color-mix(in_oklab,var(--poster-accent)_14%,transparent)] px-3 py-1.5 font-display font-bold text-[11px] uppercase tracking-[0.16em] text-[var(--poster-accent)]">
        <span className="size-1.5 rounded-full bg-[var(--poster-accent)]" />
        <span>{label}</span>
        <span className="size-1.5 rounded-full bg-[var(--poster-accent)]" />
      </div>
      <div className="relative grid h-56 place-items-center bg-bg-deep p-3 md:aspect-[3/4] md:h-auto">
        <CrewCharacter
          slug={mascot}
          size={236}
          title={mascot}
          className="h-[82%] max-h-[236px] w-auto max-w-[72%] scale-x-[0.78]"
        />
        <CornerBracket position="tl" />
        <CornerBracket position="tr" />
        <CornerBracket position="bl" />
        <CornerBracket position="br" />
      </div>
    </div>
  )
}

function CornerBracket({
  position,
}: {
  position: "tl" | "tr" | "bl" | "br"
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute size-3 border-[var(--poster-accent)]",
        position === "tl" && "left-2 top-2 border-l-2 border-t-2",
        position === "tr" && "right-2 top-2 border-r-2 border-t-2",
        position === "bl" && "left-2 bottom-2 border-l-2 border-b-2",
        position === "br" && "right-2 bottom-2 border-r-2 border-b-2",
      )}
    />
  )
}
