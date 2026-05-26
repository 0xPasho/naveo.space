"use client"

import { Dialog } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { useTranslations } from "next-intl"

import { timeAgo } from "@/common/lib/format"
import { cn } from "@/common/lib/utils"
import { CrewAvatar } from "@/modules/crew"
import type { ActivityEntry } from "@/modules/users/types"

type Props = {
  // Serializable entries. `createdAt` may arrive as a Date (server boundary
  // serialized) or an ISO string; we coerce defensively.
  entries: Array<Omit<ActivityEntry, "createdAt"> & { createdAt: Date | string }>
  locale: string
  mascots: readonly (
    | "vega"
    | "echo"
    | "atlas"
    | "forge"
    | "orbit"
    | "hex"
  )[]
}

// "Bitácora" — full activity log dialog. Triggered from the Activity card's
// header. Uses Base UI Dialog directly to preserve the existing API; styled
// inline with Tailwind utilities + Naveo Bridge tokens.
export function ActivityLogDialog({ entries, locale, mascots }: Props) {
  const t = useTranslations("profile.activity")
  return (
    <Dialog.Root>
      <Dialog.Trigger
        type="button"
        aria-haspopup="dialog"
        className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-primary outline-none transition-colors hover:text-primary/80 focus-visible:ring-4 focus-visible:ring-primary-soft"
      >
        {t("log")}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-bg-deep/70 backdrop-blur-[2px] data-[open]:animate-in data-[open]:fade-in-0 data-[closed]:animate-out data-[closed]:fade-out-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex w-full max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border-2 border-line-strong bg-bg-surface text-ink-1 shadow-elev-4 outline-none data-[open]:animate-in data-[open]:fade-in-0 data-[open]:zoom-in-95 data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95">
          <header className="flex items-start justify-between gap-3 border-b-2 border-line-soft p-5">
            <div>
              <Dialog.Title className="font-display font-bold text-xl tracking-tight leading-tight text-ink-1">
                {t("logTitle")}
              </Dialog.Title>
              <Dialog.Description className="mt-1 font-sans font-semibold text-sm text-ink-3">
                {t("logSubtitle", { n: entries.length })}
              </Dialog.Description>
            </div>
            <Dialog.Close
              type="button"
              aria-label={t("close")}
              className="inline-flex size-8 items-center justify-center rounded-sm text-ink-3 outline-none transition-colors hover:bg-bg-raised hover:text-ink-1 focus-visible:ring-4 focus-visible:ring-primary-soft"
            >
              <X aria-hidden className="size-4" strokeWidth={2.5} />
            </Dialog.Close>
          </header>
          <div className="max-h-[60vh] overflow-y-auto p-5">
            {entries.length === 0 ? (
              <p className="font-sans font-semibold text-sm text-ink-3">
                {t("empty")}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {entries.map((a, i) => {
                  const mascot = mascots[i % mascots.length]!
                  const verb = a.passed ? t("cleared") : t("failed")
                  const when =
                    a.createdAt instanceof Date
                      ? a.createdAt
                      : new Date(a.createdAt)
                  return (
                    <li
                      key={a.attemptId}
                      className={cn(
                        "flex items-center gap-3 rounded-sm border-2 border-line-soft bg-bg-raised px-3 py-2.5",
                        !a.passed && "border-danger/35 bg-danger-soft/40",
                      )}
                    >
                      <CrewAvatar slug={mascot} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="font-sans font-semibold text-sm text-ink-1">
                          <span
                            className={a.passed ? "text-success" : "text-danger"}
                          >
                            {verb}
                          </span>{" "}
                          <span className="font-bold">{a.stepTitle}</span>
                        </div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                          {timeAgo(when, locale)}
                        </div>
                      </div>
                      {a.xp > 0 ? (
                        <span className="font-mono text-xs font-bold tabular-nums text-stat-xp">
                          {t("xpUnit", { xp: a.xp })}
                        </span>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
