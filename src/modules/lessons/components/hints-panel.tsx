"use client"

import { Heart, Lightbulb } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"

import {
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Eyebrow,
} from "@/common/components/ui"
import { useRouter } from "@/common/i18n/navigation"
import { CrewCharacter } from "@/modules/crew"
import { useHint as consumeHint } from "@/modules/progress/actions"

type StepRef = {
  trackSlug: string
  courseSlug: string
  stepSlug: string
}

type Props = {
  hints: string[]
  stepRef: StepRef
  locale: "es" | "en"
  // When the runner already has a passing result the alumno doesn't need to
  // pay for hints anymore — revealing one becomes free. We pass this flag
  // from StepShell so the panel can skip the server roundtrip + dialog.
  alreadyPassed?: boolean
}

// Progressive hint reveal. Each reveal costs 1 heart server-side. To prevent
// users from mistaking the hint button for the footer's "Siguiente" Next
// button — both share the word "siguiente" — every PAID reveal goes through
// a confirmation dialog that explicitly states the cost. When the step is
// already passed (alreadyPassed), hints are free and skip the dialog.
export function HintsPanel({ hints, stepRef, locale, alreadyPassed }: Props) {
  const t = useTranslations("lessons.hints")
  const router = useRouter()
  const [revealed, setRevealed] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [, startTransition] = useTransition()
  const total = hints.length
  const remaining = total - revealed

  // Reveal the next hint locally + spend a heart server-side. Caller must
  // have already passed any confirmation flow for paid reveals.
  const performReveal = () => {
    const nextIndex = revealed
    if (nextIndex >= total) return
    setRevealed((r) => r + 1)
    if (alreadyPassed) return
    startTransition(async () => {
      try {
        await consumeHint({ ...stepRef, locale, hintIndex: nextIndex })
        router.refresh()
      } catch {
        // ignore — best-effort
      }
    })
  }

  // Free reveals (alreadyPassed) skip the dialog. Paid reveals open the
  // confirmation so the user can never spend a heart without seeing the cost.
  const handleRevealClick = () => {
    if (alreadyPassed) {
      performReveal()
      return
    }
    setConfirmOpen(true)
  }

  const onConfirm = () => {
    setConfirmOpen(false)
    performReveal()
  }

  const dialog = (
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart
              className="size-5 text-stat-heart"
              fill="currentColor"
              strokeWidth={2}
            />
            {t("confirm.title")}
          </DialogTitle>
          <DialogDescription>{t("confirm.body")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmOpen(false)}
          >
            {t("confirm.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            autoFocus={false}
          >
            <Heart className="size-4" fill="currentColor" strokeWidth={2} />
            {t("confirm.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (revealed === 0) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-2 self-start">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRevealClick}
            className="normal-case tracking-normal"
          >
            <Lightbulb className="size-4 text-stat-xp" />
            <span>{t("opener")}</span>
            <Chip tone="xp" className="ml-1">
              {total}
            </Chip>
          </Button>
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-stat-heart">
            <Heart className="size-3" fill="currentColor" strokeWidth={2} />
            {alreadyPassed ? t("free") : t("openerCost")}
          </span>
        </div>
        {dialog}
      </>
    )
  }

  return (
    <>
      <section className="space-y-3 rounded-md border-2 border-line-strong bg-bg-raised p-4">
        <div className="flex items-center justify-between">
          <Eyebrow className="inline-flex items-center gap-2 text-track-prompting/80">
            <Lightbulb className="size-3.5" />
            {t("heading")}
          </Eyebrow>
          <span className="font-mono text-xs text-ink-3 tabular-nums">
            {revealed} / {total}
          </span>
        </div>

        <div className="flex items-start gap-3">
          <CrewCharacter slug="vega" expression="curious" size={56} flat />

          <ol className="flex-1 space-y-2 text-sm leading-relaxed">
            {hints.slice(0, revealed).map((h, i) => (
              <li key={i} className="flex gap-2 text-ink-1">
                <span className="mt-0.5 inline-block min-w-[1.25rem] font-mono text-xs text-ink-3 tabular-nums">
                  {i + 1}.
                </span>
                <span>{h}</span>
              </li>
            ))}
          </ol>
        </div>

        {remaining > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRevealClick}
              className="normal-case tracking-normal"
            >
              <Lightbulb className="size-4 text-stat-xp" />
              {t("show", { remaining })}
            </Button>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-stat-heart">
              <Heart className="size-3" fill="currentColor" strokeWidth={2} />
              {alreadyPassed ? t("free") : t("showCost")}
            </span>
          </div>
        ) : (
          <p className="text-xs text-ink-3">{t("exhausted")}</p>
        )}
      </section>
      {dialog}
    </>
  )
}
