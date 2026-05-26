import { Star } from "lucide-react"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — N-of-M star rating.
   Display-only. Filled stars use stat-xp gold; empty stars use ink-4.
   Used on lesson-complete / debrief screens. */
type StarRatingProps = {
  value: number
  max?: number
  size?: number
  className?: string
}

function StarRating({
  value,
  max = 3,
  size = 32,
  className,
}: StarRatingProps) {
  return (
    <div
      data-slot="star-rating"
      role="img"
      aria-label={`${value} of ${max} stars`}
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < value
        return (
          <Star
            key={i}
            strokeWidth={2.5}
            style={{ width: size, height: size }}
            className={cn(
              "transition-colors duration-base ease-out",
              filled
                ? "fill-stat-xp text-stat-xp drop-shadow-[0_3px_0_var(--stat-xp-shadow)]"
                : "fill-bg-sunken text-ink-4",
            )}
          />
        )
      })}
    </div>
  )
}

export { StarRating }
export type { StarRatingProps }
