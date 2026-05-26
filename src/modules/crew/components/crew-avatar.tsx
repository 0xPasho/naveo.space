import { cn } from "@/common/lib/utils"

import type { CrewSlug } from "../types"
import { CrewCharacter } from "./crew-character"

type Props = {
  slug: CrewSlug
  size?: number
  // "thinking" swaps the expression so chat surfaces can flag "reply in
  // flight" without re-rendering the wrapping component.
  state?: "idle" | "thinking"
  className?: string
  title?: string
}

// Small round chip — fixed border, fixed background. Replaces the
// `<img src="/cast/...svg" />` pattern in chat-message and tutor-drawer.
export function CrewAvatar({
  slug,
  size = 40,
  state = "idle",
  className,
  title,
}: Props) {
  return (
    <span
      className={cn("crew-avatar", className)}
      style={{ width: size, height: size }}
      aria-hidden={title ? undefined : true}
    >
      <CrewCharacter
        slug={slug}
        expression={state === "thinking" ? "thinking" : "neutral"}
        size="full"
        flat
        title={title}
      />
    </span>
  )
}
