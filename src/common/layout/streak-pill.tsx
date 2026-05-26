"use client"

import { Check, Flame, Shield, X, Zap } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  Button,
  HudPill,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { cn } from "@/common/lib/utils"

type Props = {
  streak: number
  atRisk: boolean
  freezes: number
}

export function StreakPill({ streak, atRisk, freezes }: Props) {
  const t = useTranslations("common.hud.streakPopover")

  return (
    <Popover>
      <PopoverTrigger
        aria-label={t("openLabel")}
        className={cn(
          "rounded-full outline-none focus-visible:ring-4 focus-visible:ring-primary-soft transition-opacity",
          atRisk && "animate-pulse",
        )}
      >
        <HudPill
          kind="streak"
          icon={<Flame className="size-3.5" strokeWidth={2.5} />}
          value={streak}
        />
      </PopoverTrigger>
      <PopoverContent sideOffset={10} className="w-80">
        <header className="flex items-center gap-3 pb-3">
          <div className="inline-flex size-10 items-center justify-center rounded-sm bg-stat-streak shadow-[0_3px_0_0_var(--stat-streak-shadow)]">
            <Flame className="size-5 text-track-evals-ink" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-ink-3">
              {t("eyebrow")}
            </span>
            <span className="font-display font-bold text-lg leading-none tracking-tight text-stat-streak">
              {t("count", { days: streak })}
            </span>
          </div>
        </header>
        <div className="-mx-4 border-t border-line-soft" />
        <ul className="flex flex-col gap-2 pt-3">
          <PopoverRule kind="yes" icon={<Check className="size-3" strokeWidth={3} />}>
            {t("rules.advance")}
          </PopoverRule>
          <PopoverRule kind="yes" icon={<Check className="size-3" strokeWidth={3} />}>
            {t("rules.check")}
          </PopoverRule>
          <PopoverRule kind="yes" icon={<Zap className="size-3" strokeWidth={3} />}>
            {t("rules.daily")}
          </PopoverRule>
          <PopoverRule kind="no" icon={<X className="size-3" strokeWidth={3} />}>
            {t("rules.justOpen")}
          </PopoverRule>
          {freezes > 0 ? (
            <PopoverRule kind="yes" icon={<Shield className="size-3" strokeWidth={3} />}>
              {t("freezes", { count: freezes })}
            </PopoverRule>
          ) : null}
        </ul>
        {atRisk ? (
          <div className="mt-3 flex flex-col gap-2 rounded-md border-2 border-danger/40 bg-danger-soft/60 px-3 py-2.5">
            <p className="font-sans text-xs font-bold leading-snug text-ink-1">
              {t("atRiskNudge")}
            </p>
            <Button
              size="sm"
              className="w-full"
              render={<Link href="/practice/daily" />}
            >
              <Zap className="size-3.5" strokeWidth={2.5} />
              {t("atRiskCta")}
            </Button>
          </div>
        ) : null}
        <footer className="mt-3 border-t border-line-soft pt-3 font-sans text-xs font-semibold text-ink-3">
          {t("footer")}
        </footer>
      </PopoverContent>
    </Popover>
  )
}

function PopoverRule({
  kind,
  icon,
  children,
}: {
  kind: "yes" | "no"
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-2.5 font-sans text-sm font-semibold",
        kind === "yes" ? "text-ink-1" : "text-ink-3",
      )}
    >
      <span
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-full",
          kind === "yes" ? "bg-success/20 text-success" : "bg-danger/15 text-danger",
        )}
      >
        {icon}
      </span>
      {children}
    </li>
  )
}
