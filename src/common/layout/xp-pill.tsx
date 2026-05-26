"use client"

import { Bolt, Check } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  HudPill,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/common/components/ui"

type Props = {
  xp: number
}

export function XpPill({ xp }: Props) {
  const t = useTranslations("common.hud.xpPopover")

  return (
    <Popover>
      <PopoverTrigger
        aria-label={t("openLabel")}
        className="rounded-full outline-none focus-visible:ring-4 focus-visible:ring-primary-soft"
      >
        <HudPill
          kind="xp"
          icon={<Bolt className="size-3.5" strokeWidth={2.5} />}
          value={xp.toLocaleString()}
        />
      </PopoverTrigger>
      <PopoverContent sideOffset={10} className="w-80">
        <header className="flex items-center gap-3 pb-3">
          <div className="inline-flex size-10 items-center justify-center rounded-sm bg-stat-xp shadow-[0_3px_0_0_var(--stat-xp-shadow)]">
            <Bolt className="size-5 text-track-skills-ink" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-ink-3">
              {t("eyebrow")}
            </span>
            <span className="font-display font-bold text-lg leading-none tracking-tight text-stat-xp">
              {t("count", { xp })}
            </span>
          </div>
        </header>
        <div className="-mx-4 border-t border-line-soft" />
        <ul className="flex flex-col gap-2 pt-3">
          <PopoverRule yes>{t("rules.firstTry")}</PopoverRule>
          <PopoverRule yes>{t("rules.laterTry")}</PopoverRule>
          <PopoverRule yes>{t("rules.capstones")}</PopoverRule>
        </ul>
        <footer className="mt-3 border-t border-line-soft pt-3 font-sans text-xs font-semibold text-ink-3">
          {t("footer")}
        </footer>
      </PopoverContent>
    </Popover>
  )
}

function PopoverRule({
  yes,
  children,
}: {
  yes: boolean
  children: React.ReactNode
}) {
  return (
    <li
      className={
        "flex items-center gap-2.5 font-sans text-sm font-semibold " +
        (yes ? "text-ink-1" : "text-ink-3")
      }
    >
      <span
        className={
          "inline-flex size-5 shrink-0 items-center justify-center rounded-full " +
          (yes ? "bg-success/20 text-success" : "bg-bg-raised text-ink-3")
        }
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      {children}
    </li>
  )
}
