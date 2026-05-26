"use client"

import { SignInButton } from "@clerk/nextjs"
import { Gem } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"

import { Button, Chip } from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
import { purchaseShopItemAction } from "@/modules/economy/actions"
import type { ShopItemSlug } from "@/modules/economy/data"

type Props = {
  slug: ShopItemSlug
  cost: number
  disabled?: boolean
  // Localized name comes from the parent (server-side translation is
  // cheaper and keeps this component small).
  name: string
  iconSrc: string
  // Number of times the user already bought this item today (UTC).
  // 0 hides the badge. >=1 renders "Comprado hoy ×N".
  todayCount?: number
  // Anon users get the Clerk sign-in modal instead of a buggy server
  // action call. Defaults to true so signed-in users keep the existing
  // purchase flow.
  signedIn?: boolean
}

export function ShopItemCard({
  slug,
  cost,
  disabled = false,
  name,
  iconSrc,
  todayCount = 0,
  signedIn = true,
}: Props) {
  const t = useTranslations("shop")
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const [feedback, setFeedback] = useState<
    | null
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
  >(null)

  const buttonLabel = pending
    ? t("buyPending")
    : disabled
      ? t("alreadyFull")
      : t("buy", { cost })

  const onPurchase = () => {
    if (pending || disabled) return
    setFeedback(null)
    startTransition(async () => {
      const res = await purchaseShopItemAction({ slug })
      if (res.ok) {
        setFeedback({ kind: "success", message: t("feedback.success", { name }) })
        router.refresh()
      } else {
        const messageKey =
          res.error === "insufficient_gems"
            ? "feedback.insufficientGems"
            : res.error === "already_full"
              ? "feedback.alreadyFull"
              : res.error === "unauthorized"
                ? "feedback.unauthorized"
                : "feedback.invalidInput"
        setFeedback({ kind: "error", message: t(messageKey) })
      }
    })
  }

  return (
    <article
      id={`shop-item-${slug}`}
      className="flex flex-col items-center gap-3 rounded-xl border-2 border-line-soft bg-bg-surface p-5 shadow-elev-3"
    >
      <div className="grid size-20 place-items-center rounded-md border-2 border-line-strong bg-bg-raised">
        <Image
          src={iconSrc}
          alt=""
          width={64}
          height={64}
          className="size-16 object-contain"
        />
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className="font-display font-bold text-base tracking-tight text-ink-1">
          {name}
        </span>
        {todayCount > 0 ? (
          <Chip tone="success">
            {t("badge.boughtToday", { count: todayCount })}
          </Chip>
        ) : null}
      </div>
      {feedback ? (
        <div
          className={cn(
            "font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-center",
            feedback.kind === "success" ? "text-success" : "text-danger",
          )}
        >
          {feedback.message}
        </div>
      ) : null}
      {signedIn ? (
        <Button
          type="button"
          onClick={onPurchase}
          disabled={pending || disabled}
          variant={disabled ? "ghost" : "default"}
          className="mt-auto w-full"
        >
          {!disabled ? <Gem className="size-4" strokeWidth={2.5} /> : null}
          {buttonLabel}
        </Button>
      ) : (
        <SignInButton mode="modal">
          <Button type="button" variant="default" className="mt-auto w-full">
            <Gem className="size-4" strokeWidth={2.5} />
            {t("buy", { cost })}
          </Button>
        </SignInButton>
      )}
    </article>
  )
}
