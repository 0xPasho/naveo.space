import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — sunken text field with chunky inset.
   bg-sunken + elev-inset gives the "well" look; focus pops a 4px
   primary-soft halo around the border. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-md border-2 border-line-strong bg-bg-sunken px-4 py-3",
        "font-sans font-semibold text-base text-ink-1 placeholder:text-ink-3 placeholder:font-medium",
        "shadow-elev-inset outline-none transition-[border-color,box-shadow] duration-fast ease-out",
        "focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary-soft",
        "disabled:pointer-events-none disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/30",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-bold file:text-ink-1",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
