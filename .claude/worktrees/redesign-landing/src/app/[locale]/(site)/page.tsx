import { setRequestLocale } from "next-intl/server"

import { redirect } from "@/common/i18n/navigation"
import { currentUser } from "@/server/auth"
import type { ContentLocale } from "@/modules/content/types"
import { HomeView } from "@/modules/home/home-view"

type Props = {
  params: Promise<{ locale: ContentLocale }>
}

export default async function Home({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  // Logged-in users skip marketing — they have a personalized Bridge waiting.
  const clerkUser = await currentUser()
  if (clerkUser) {
    redirect({ href: "/dashboard", locale })
  }

  return <HomeView />
}
