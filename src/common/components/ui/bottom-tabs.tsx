"use client"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — chunky bottom tab bar (mobile primary nav).
   Icons stacked over caps labels. Active tab fills with primary-soft. */
type BottomTabItem<TId extends string = string> = {
  id: TId
  label: React.ReactNode
  icon: React.ReactNode
}

type BottomTabsProps<TId extends string> = {
  items: ReadonlyArray<BottomTabItem<TId>>
  active: TId
  onChange?: (id: TId) => void
  className?: string
}

function BottomTabs<TId extends string>({
  items,
  active,
  onChange,
  className,
}: BottomTabsProps<TId>) {
  return (
    <nav
      data-slot="bottom-tabs"
      className={cn(
        "flex w-full items-stretch gap-1 border-t-2 border-line-strong bg-bg-surface px-3.5 py-2.5",
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.id === active
        return (
          <button
            key={item.id}
            type="button"
            data-state={selected ? "active" : "inactive"}
            onClick={() => onChange?.(item.id)}
            className={cn(
              "group flex flex-1 flex-col items-center justify-center gap-1 rounded-sm px-1.5 py-2",
              "font-display font-bold text-[11px] uppercase tracking-wide outline-none",
              "transition-colors duration-fast ease-out",
              "focus-visible:ring-4 focus-visible:ring-primary-soft",
              selected
                ? "bg-primary-soft text-primary"
                : "text-ink-3 hover:text-ink-1",
            )}
          >
            <span className="size-7">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export { BottomTabs }
export type { BottomTabItem, BottomTabsProps }
