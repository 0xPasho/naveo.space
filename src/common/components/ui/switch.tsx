"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — toggle switch.
   Track slides from bg-raised (off) → primary mint (on). Thumb is a
   chunky white pill with the elev-1 drop. */
function Switch({
  className,
  ...props
}: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 border-line-strong",
        "bg-bg-raised transition-colors duration-fast ease-out",
        "outline-none focus-visible:ring-4 focus-visible:ring-primary-soft",
        "data-[checked]:bg-primary data-[checked]:border-primary",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-5 translate-x-0.5 rounded-full bg-white shadow-elev-1",
          "transition-transform duration-fast ease-out",
          "data-[checked]:translate-x-[22px]",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
