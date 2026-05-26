"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check } from "lucide-react"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — chunky checkbox.
   Sunken inset well when unchecked, primary mint fill when checked. */
function Checkbox({
  className,
  ...props
}: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer inline-flex size-5 shrink-0 items-center justify-center",
        "rounded-sm border-2 border-line-strong bg-bg-sunken",
        "shadow-elev-inset transition-[background-color,border-color,box-shadow] duration-fast ease-out",
        "outline-none focus-visible:ring-4 focus-visible:ring-primary-soft",
        "data-[checked]:bg-primary data-[checked]:border-primary",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-primary-foreground"
      >
        <Check className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
