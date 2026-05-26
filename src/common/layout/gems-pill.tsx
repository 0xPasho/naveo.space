"use client"

import { Check, Gem } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  HudPill,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/common/components/ui"

type Props = {
  gems: number
}

export function GemsPill({ gems }: Props) {
  const t = useTranslations("common.hud.gemsPopover")

  return (
    <Popover>
      <PopoverTrigger
        aria-label={t("openLabel")}
        className="rounded-full outline-none focus-visible:ring-4 focus-visible:ring-primary-soft"
      >
        <HudPill
          kind="gem"
          icon={<Gem className="size-3.5" strokeWidth={2.5} />}
          value={gems}
        />
      </PopoverTrigger>
      <PopoverContent sideOffset={10} className="w-80">
        <header className="flex items-center gap-3 pb-3">
          <div className="inline-flex size-10 items-center justify-center rounded-sm bg-stat-gem shadow-[0_3px_0_0_var(--stat-gem-shadow)]">
            <Gem className="size-5 text-track-prompting-ink" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-ink-3">
              {t("eyebrow")}
            </span>
            <span className="font-display font-bold text-lg leading-none tracking-tight text-stat-gem">
              {t("count", { gems })}
            </span>
          </div>
        </header>
        <div className="-mx-4 border-t border-line-soft" />
        <ul className="flex flex-col gap-2 pt-3">
          <PopoverYesRule>{t("rules.earnFirstTry")}</PopoverYesRule>
          <PopoverYesRule>{t("rules.earnCapstones")}</PopoverYesRule>
          <PopoverYesRule>{t("rules.spendShop")}</PopoverYesRule>
        </ul>
        <footer className="mt-3 border-t border-line-soft pt-3 font-sans text-xs font-semibold text-ink-3">
          {t("footer")}
        </footer>
      </PopoverContent>
    </Popover>
  )
}

function PopoverYesRule({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 font-sans text-sm font-semibold text-ink-1">
      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
        <Check className="size-3" strokeWidth={3} />
      </span>
      {children}
    </li>
  )
}
