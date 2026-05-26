"use client"

import { Field as FieldPrimitive } from "@base-ui/react/field"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — form label.
   Uses @base-ui Field.Label so it associates with the nearest Field.Control
   automatically. Fredoka caps eyebrow style. */
function Label({
  className,
  ...props
}: FieldPrimitive.Label.Props) {
  return (
    <FieldPrimitive.Label
      data-slot="label"
      className={cn(
        "font-display font-bold text-[11px] uppercase tracking-[0.12em] text-ink-3",
        "peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export { Label }
