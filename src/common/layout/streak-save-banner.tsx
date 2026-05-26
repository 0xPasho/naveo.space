"use client"

import { Shield, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState, useSyncExternalStore } from "react"

type Props = {
  // StreakFreezeTransaction.id of the consume event. Used as the
  // sessionStorage dedupe key so the same save can't replay on subsequent
  // navigations within the same tab.
  id: string
  // How many shields the consume burned.
  count: number
}

const STORAGE_KEY = "streak-save-seen"
const STORAGE_EVENT = "streak-save-seen-change"

const subscribe = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange)
  window.addEventListener(STORAGE_EVENT, onStoreChange)

  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener(STORAGE_EVENT, onStoreChange)
  }
}

const getServerSnapshot = () => false

const writeSeen = (id: string) => {
  window.sessionStorage.setItem(STORAGE_KEY, id)
}

const markSeen = (id: string) => {
  writeSeen(id)
  window.dispatchEvent(new Event(STORAGE_EVENT))
}

export function StreakSaveBanner({ id, count }: Props) {
  const t = useTranslations("common.hud.streakSaveBanner")
  const [dismissedId, setDismissedId] = useState<string | null>(null)
  const shouldShow = useSyncExternalStore(
    subscribe,
    () => window.sessionStorage.getItem(STORAGE_KEY) !== id,
    getServerSnapshot,
  )

  useEffect(() => {
    if (!shouldShow) return
    writeSeen(id)
  }, [id, shouldShow])

  const shown = shouldShow && dismissedId !== id

  if (!shown) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-[72px] z-[60] inline-flex -translate-x-1/2 items-center gap-2.5 rounded-full border-2 border-stat-streak/50 bg-bg-raised px-4 py-2.5 font-sans font-semibold text-sm text-ink-1 shadow-elev-3"
    >
      <Shield className="size-4 text-stat-streak" strokeWidth={2.5} aria-hidden />
      <span>{t("message", { count })}</span>
      <button
        type="button"
        onClick={() => {
          setDismissedId(id)
          markSeen(id)
        }}
        aria-label={t("dismiss")}
        className="inline-flex items-center text-ink-3 transition-colors hover:text-ink-1"
      >
        <X className="size-3.5" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  )
}
