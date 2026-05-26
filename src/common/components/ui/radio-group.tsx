"use client"

import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — radio group + radio item.
   Sunken disc with a chunky primary mint dot when checked. */
function RadioGroup({
  className,
  ...props
}: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid gap-2", className)}
      {...props}
    />
  )
}

function RadioItem({
  className,
  ...props
}: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-item"
      className={cn(
        "peer inline-flex size-5 shrink-0 items-center justify-center",
        "rounded-full border-2 border-line-strong bg-bg-sunken",
        "shadow-elev-inset transition-[background-color,border-color,box-shadow] duration-fast ease-out",
        "outline-none focus-visible:ring-4 focus-visible:ring-primary-soft",
        "data-[checked]:border-primary",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-indicator"
        className="block size-2.5 rounded-full bg-primary"
      />
    </RadioPrimitive.Root>
  )
}

export { RadioGroup, RadioItem }
