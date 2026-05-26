"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — segmented tabs.
   List sits in a chunky bg-raised container; active tab pops up with
   bg-bg-surface + elev-1. */
function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-md border-2 border-line-soft bg-bg-raised p-1",
        className,
      )}
      {...props}
    />
  )
}

function TabsTab({
  className,
  ...props
}: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-tab"
      className={cn(
        "inline-flex items-center justify-center rounded-sm px-4 py-1.5",
        "font-display font-bold text-xs uppercase tracking-wide text-ink-3 outline-none",
        "transition-[background-color,color,box-shadow] duration-fast ease-out",
        "hover:text-ink-1",
        "data-[selected]:bg-bg-surface data-[selected]:text-ink-1 data-[selected]:shadow-elev-1",
        "focus-visible:ring-4 focus-visible:ring-primary-soft",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  )
}

function TabsPanel({
  className,
  ...props
}: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-panel"
      className={cn("outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTab, TabsPanel }
