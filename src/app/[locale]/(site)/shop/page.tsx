import { setRequestLocale } from "next-intl/server"

import type { ContentLocale } from "@/modules/content/types"
import { ShopView } from "@/modules/shop/shop-view"
import { currentUser } from "@/server/auth"

type Props = {
  params: Promise<{ locale: ContentLocale }>
  // Stripe Checkout redirects back with `?gems=success&session_id=…` on
  // payment, or `?gems=cancel` if the user backs out. ShopView reads it
  // to show a confirmation or cancellation banner. Webhook is what
  // actually credits the gems — the banner is just acknowledgement copy.
  searchParams: Promise<{ gems?: string }>
}

export default async function ShopPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { gems } = await searchParams
  setRequestLocale(locale)

  const checkoutStatus =
    gems === "success" ? "success" : gems === "cancel" ? "cancel" : null

  const clerkUser = await currentUser()
  return (
    <ShopView
      userId={clerkUser?.id ?? null}
      checkoutStatus={checkoutStatus}
    />
  )
}
