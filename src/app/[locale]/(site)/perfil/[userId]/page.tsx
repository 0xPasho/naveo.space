import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { ProfileScreen } from "@/app/[locale]/(site)/perfil/page"
import type { ContentLocale } from "@/modules/content/types"
import { currentUser } from "@/server/auth"

type Props = {
  params: Promise<{ locale: ContentLocale; userId: string }>
}

export default async function PublicProfilePage({ params }: Props) {
  const { locale, userId } = await params
  setRequestLocale(locale)
  const viewer = await currentUser()

  // Profile data (badges, streak, last 50 attempts, real name) is not public.
  // Unauthenticated requests are 404'd rather than redirected so attackers
  // cannot enumerate Clerk user ids. Signed-in viewers can only see their own
  // profile through this route; the canonical self-view lives at `/perfil`.
  if (!viewer) notFound()
  if (viewer.id !== userId) notFound()

  return (
    <ProfileScreen
      locale={locale}
      profileUserId={userId}
      viewerUserId={viewer.id}
      current={viewer}
    />
  )
}
