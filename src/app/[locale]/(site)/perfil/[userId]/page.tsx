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

  return (
    <ProfileScreen
      locale={locale}
      profileUserId={userId}
      viewerUserId={viewer?.id ?? null}
      current={viewer}
    />
  )
}
