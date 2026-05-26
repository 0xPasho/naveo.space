import { getTranslations, setRequestLocale } from "next-intl/server"

import { SignInPrompt } from "@/common/components/sign-in-prompt"
import { GlobalPath } from "@/modules/catalog/components/global-path"
import { getCatalog } from "@/modules/catalog/service"
import type { ContentLocale } from "@/modules/content/types"
import { currentUser } from "@/server/auth"

type Props = {
  params: Promise<{ locale: ContentLocale }>
}

// `/dashboard/path` — fleet map of all tracks. Renders the GlobalPath
// zig-zag with each track as a chunky world card.
export default async function PathDashboardPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("bridge")

  const clerkUser = await currentUser()

  if (!clerkUser) {
    return (
      <SignInPrompt
        eyebrow={t("anon.status")}
        heading={t("anon.heading")}
        body={t("anon.body")}
        exploreHref="/tracks"
        exploreLabel={t("anon.browseTracks")}
      />
    )
  }

  const catalog = await getCatalog(clerkUser.id, locale)

  return <GlobalPath catalog={catalog} />
}
