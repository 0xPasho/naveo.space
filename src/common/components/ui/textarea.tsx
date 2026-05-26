import * as React from "react"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — multiline text field.
   Same sunken+inset language as Input, taller. */
function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full min-h-24 rounded-md border-2 border-line-strong bg-bg-sunken px-4 py-3",
        "font-sans font-semibold text-base text-ink-1 placeholder:text-ink-3 placeholder:font-medium",
        "shadow-elev-inset outline-none resize-y transition-[border-color,box-shadow] duration-fast ease-out",
        "focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary-soft",
        "disabled:pointer-events-none disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/30",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
