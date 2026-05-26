"use client"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — top HUD bar across every authenticated screen.
   Brand mark | nav tabs (active = primary-soft) | HudPill row | avatar.
   Composes HudPill children directly; nav items are generic over their id. */
type TopHudNavItem<TId extends string = string> = {
  id: TId
  label: React.ReactNode
}

type TopHudProps<TId extends string> = {
  brand?: React.ReactNode
  nav: ReadonlyArray<TopHudNavItem<TId>>
  active: TId
  onNav?: (id: TId) => void
  /** HudPill primitives or any node, rendered in order to the right. */
  pills?: React.ReactNode
  /** Right-most slot (avatar, menu, etc.). */
  trailing?: React.ReactNode
  className?: string
}

function TopHud<TId extends string>({
  brand,
  nav,
  active,
  onNav,
  pills,
  trailing,
  className,
}: TopHudProps<TId>) {
  return (
    <header
      data-slot="top-hud"
      className={cn(
        "flex items-center gap-2.5 border-b-2 border-line-strong bg-bg-surface px-5 py-3",
        className,
      )}
    >
      {brand ? <div className="inline-flex items-center gap-2.5">{brand}</div> : null}

      <nav className="flex flex-1 justify-center gap-1">
        {nav.map((item) => {
          const selected = item.id === active
          return (
            <button
              key={item.id}
              type="button"
              data-state={selected ? "active" : "inactive"}
              onClick={() => onNav?.(item.id)}
              className={cn(
                "rounded-sm border-2 border-transparent px-4 py-2 font-display font-bold text-[13px] uppercase tracking-wide outline-none",
                "transition-colors duration-fast ease-out",
                "focus-visible:ring-4 focus-visible:ring-primary-soft",
                selected
                  ? "bg-primary-soft text-primary"
                  : "text-ink-2 hover:bg-bg-raised hover:text-ink-1",
              )}
            >
              {item.label}
            </button>
          )
        })}
      </nav>

      {pills ? <div className="flex items-center gap-2">{pills}</div> : null}

      {trailing ? <div className="ml-1.5">{trailing}</div> : null}
    </header>
  )
}

export { TopHud }
export type { TopHudNavItem, TopHudProps }
