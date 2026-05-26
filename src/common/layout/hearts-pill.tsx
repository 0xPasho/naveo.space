"use client"

import { Check, Heart, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/common/components/ui"
import { useRouter } from "@/common/i18n/navigation"
import { cn } from "@/common/lib/utils"

type Props = {
  hearts: number
  heartsMax: number
  // ISO timestamp of the next regen tick. Null when the user is at max.
  nextHeartAt: string | null
  // How long one heart takes to regenerate. Used to compute the radial
  // progress on the regenerating heart.
  regenIntervalMs: number
}

const fmtCountdown = (ms: number): string => {
  const clamped = Math.max(0, ms)
  const totalSec = Math.ceil(clamped / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`
  return `${m}:${s.toString().padStart(2, "0")}`
}

const fmtInterval = (ms: number): string => {
  const totalMin = Math.round(ms / 60000)
  if (totalMin >= 60 && totalMin % 60 === 0) {
    return `${totalMin / 60} h`
  }
  if (totalMin >= 60) {
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return `${h} h ${m} min`
  }
  return `${totalMin} min`
}

export function HeartsPill({
  hearts,
  heartsMax,
  nextHeartAt,
  regenIntervalMs,
}: Props) {
  const t = useTranslations("common.hud.heartsPopover")
  const router = useRouter()
  const [now, setNow] = useState<number | null>(null)

  const nextTs = nextHeartAt ? new Date(nextHeartAt).getTime() : null
  const regening = nextTs !== null && hearts < heartsMax

  useEffect(() => {
    if (!regening || nextTs === null) return
    const tick = () => {
      const t = Date.now()
      setNow(t)
      if (t >= nextTs) router.refresh()
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [regening, nextTs, router])

  const msToNext =
    nextTs !== null && now !== null ? Math.max(0, nextTs - now) : null
  const nextInLabel = msToNext !== null ? fmtCountdown(msToNext) : null
  const growingIdx = regening ? hearts : -1

  return (
    <Popover>
      <PopoverTrigger
        aria-label={t("openLabel")}
        className="inline-flex items-center gap-2 rounded-full bg-stat-heart px-3 py-1 shadow-[0_3px_0_0_var(--stat-heart-shadow)] outline-none transition-transform focus-visible:ring-4 focus-visible:ring-primary-soft"
      >
        <Heart
          className={cn(
            "size-4 text-white md:hidden",
            hearts === 0 && !regening && "text-white/40",
            regening && "animate-pulse",
          )}
          fill={hearts > 0 || regening ? "currentColor" : "transparent"}
          strokeWidth={2}
        />
        <span className="hidden items-center gap-0.5 md:inline-flex">
          {Array.from({ length: heartsMax }, (_, i) => {
            const filled = i < hearts
            const growing = i === growingIdx
            return (
              <Heart
                key={i}
                className={cn(
                  "size-4 text-white",
                  !filled && !growing && "text-white/30",
                  growing && "animate-pulse",
                )}
                fill={filled || growing ? "currentColor" : "transparent"}
                strokeWidth={2}
              />
            )
          })}
        </span>
        <span className="font-display font-bold text-sm tabular-nums text-white">
          {hearts}/{heartsMax}
        </span>
      </PopoverTrigger>
      <PopoverContent sideOffset={10} className="w-80">
        <header className="flex items-center gap-3 pb-3">
          <div className="inline-flex size-10 items-center justify-center rounded-sm bg-stat-heart shadow-[0_3px_0_0_var(--stat-heart-shadow)]">
            <Heart className="size-5 text-white" fill="currentColor" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-ink-3">
              {t("eyebrow")}
            </span>
            <span className="font-display font-bold text-lg leading-none tracking-tight text-stat-heart">
              {t("count", { hearts, max: heartsMax })}
            </span>
            {regening && nextInLabel ? (
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">
                {t("nextIn", { time: nextInLabel })}
              </span>
            ) : !regening ? (
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-success">
                {t("full")}
              </span>
            ) : null}
          </div>
        </header>
        <div className="-mx-4 border-t border-line-soft" />
        <ul className="flex flex-col gap-2 pt-3">
          <PopoverRule kind="yes" icon={<Check className="size-3" strokeWidth={3} />}>
            {t("rules.budget", { max: heartsMax })}
          </PopoverRule>
          <PopoverRule kind="yes" icon={<Check className="size-3" strokeWidth={3} />}>
            {t("rules.regen", { interval: fmtInterval(regenIntervalMs) })}
          </PopoverRule>
          <PopoverRule kind="no" icon={<X className="size-3" strokeWidth={3} />}>
            {t("rules.passive")}
          </PopoverRule>
        </ul>
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
