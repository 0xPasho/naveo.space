"use client"

import { SignInButton } from "@clerk/nextjs"
import { Gem } from "lucide-react"
import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"

import { Button } from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
import { createGemCheckoutAction } from "@/modules/economy/actions"
import type { GemPackSlug } from "@/modules/economy/gem-packs"

type Props = {
  slug: GemPackSlug
  gems: number
  // USD price formatted by the parent so server-side formatting stays
  // consistent if we ever localize the currency display.
  priceLabel: string
  // Localized pack title. The accent banner ("popular" / "best") comes
  // through `badge` so we don't hardcode pack-specific copy in two places.
  name: string
  badge: "popular" | "best" | null
  // No active signed-in user → the button still renders but the action
  // returns `unauthorized`; we route the user to sign-in on that branch.
  signedIn: boolean
}

// Naveo Bridge gem-pack card. Every card carries a top banner row of
// identical height so the 3 cards stay flush along the top edge whether
// or not the card has a "popular" / "best" tag. Badged cards fill the
// banner with a solid track-tone bar; plain cards leave it as `bg-bg-deep`
// so the column still aligns but there is no visual emphasis. Earlier
// design used an absolutely positioned chip floating across the top
// border — the half-clipped pill read as a visual bug.
export function GemPackCard({
  slug,
  gems,
  priceLabel,
  name,
  badge,
  signedIn,
}: Props) {
  const t = useTranslations("shop.gems")
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<
    | null
    | { kind: "error"; message: string }
  >(null)

  const onBuy = () => {
    if (pending) return
    setFeedback(null)
    startTransition(async () => {
      const res = await createGemCheckoutAction({ slug })
      if (res.ok) {
        // Hard navigation to Stripe — `router.push` won't leave the app.
        window.location.assign(res.url)
        return
      }
      const messageKey =
        res.error === "stripe_not_configured"
          ? "feedback.comingSoon"
          : res.error === "unauthorized"
            ? "feedback.unauthorized"
            : "feedback.stripeError"
      setFeedback({ kind: "error", message: t(messageKey) })
    })
  }

  const bannerClass =
    badge === "best"
      ? "bg-stat-xp text-track-skills-ink"
      : badge === "popular"
        ? "bg-primary text-primary-foreground"
        : "bg-bg-deep text-transparent"

  const borderClass =
    badge === "best"
      ? "border-stat-xp/55"
      : badge === "popular"
        ? "border-primary/55"
        : "border-line-soft"

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border-2 bg-bg-surface shadow-elev-3",
        borderClass,
      )}
    >
      <div
        className={cn(
          "flex h-7 items-center justify-center font-display font-bold text-[11px] uppercase tracking-[0.16em]",
          bannerClass,
        )}
        aria-hidden={badge === null}
      >
        {badge ? t(`badge.${badge}`) : "·"}
      </div>

      <div className="flex flex-1 flex-col items-center gap-3 p-5">
        <div className="grid size-20 place-items-center rounded-md border-2 border-line-strong bg-bg-raised">
          <Gem className="size-12 text-stat-gem" strokeWidth={2.5} />
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <span className="font-display font-bold text-3xl tracking-tight text-ink-1 tabular-nums">
            {gems.toLocaleString()}
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
            {name}
          </span>
        </div>

        <span className="font-display font-bold text-2xl tracking-tight text-stat-gem tabular-nums">
          {priceLabel}
        </span>

        {feedback ? (
          <div className="text-center font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-danger">
            {feedback.message}
          </div>
        ) : null}

        {signedIn ? (
          <Button
            type="button"
            onClick={onBuy}
            disabled={pending}
            variant="default"
            className="mt-auto w-full"
          >
            <Gem className="size-4" strokeWidth={2.5} />
            {pending ? t("button.pending") : t("button.buy")}
          </Button>
        ) : (
          // Anon users: route the buy CTA straight to the Clerk sign-in
          // modal. Server action would just bounce with "unauthorized" and
          // leave the inline error chip showing instead of helping them act.
          <SignInButton mode="modal">
            <Button
              type="button"
              variant="default"
              className="mt-auto w-full"
            >
              <Gem className="size-4" strokeWidth={2.5} />
              {t("button.buy")}
            </Button>
          </SignInButton>
        )}
      </div>
    </article>
  )
}
