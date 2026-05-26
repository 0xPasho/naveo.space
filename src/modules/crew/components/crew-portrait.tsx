import { cn } from "@/common/lib/utils"

import type { CrewExpression, CrewSlug } from "../types"
import { CrewCharacter } from "./crew-character"

type Props = {
  slug: CrewSlug
  expression?: CrewExpression
  size?: number
  className?: string
  title?: string
}

// Hero variant — adds a soft radial halo behind the character and a ground
// drop-shadow. Replaces the inline `style={{ filter: "drop-shadow(...)" }}`
// pattern used in dashboard/mascot-greet, coming-soon-view, lesson-complete.
export function CrewPortrait({
  slug,
  expression = "neutral",
  size = 168,
  className,
  title,
}: Props) {
  return (
    <div
      className={cn("crew-portrait", className)}
      style={{ width: size, height: size }}
    >
      <CrewCharacter
        slug={slug}
        expression={expression}
        size="full"
        title={title}
      />
    </div>
  )
}
