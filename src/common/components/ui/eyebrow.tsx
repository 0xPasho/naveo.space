import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — caps eyebrow label.
   Recurring typographic pattern across the canvas: Fredoka 700, 11px,
   uppercase, tight tracking, ink-3. */
function Eyebrow({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="eyebrow"
      className={cn(
        "font-display font-bold text-[11px] uppercase tracking-[0.16em] text-ink-3",
        className,
      )}
      {...props}
    />
  )
}

export { Eyebrow }
