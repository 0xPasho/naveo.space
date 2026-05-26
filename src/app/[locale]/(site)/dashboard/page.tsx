import { getTranslations, setRequestLocale } from "next-intl/server"

import { SignInPrompt } from "@/common/components/sign-in-prompt"
import { CoursePath } from "@/modules/catalog/components/course-path"
import { CoursePathAside } from "@/modules/catalog/components/course-path-aside"
import {
  getCourseDetail,
  getTrackPathNodes,
} from "@/modules/catalog/service"
import type { ContentLocale } from "@/modules/content/types"
import { DashboardPathHeader } from "@/modules/dashboard/components/dashboard-path-header"
import { MascotGreet } from "@/modules/dashboard/components/mascot-greet"
import { ThreeUp } from "@/modules/dashboard/components/three-up"
import { getDashboard } from "@/modules/dashboard/service"
import { currentUser } from "@/server/auth"

type Props = {
  params: Promise<{ locale: ContentLocale }>
}

export default async function BridgePage({ params }: Props) {
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

  const greetingName =
    clerkUser.firstName ??
    clerkUser.username ??
    t("defaultGreetingName")

  const dashboard = await getDashboard({
    userId: clerkUser.id,
    locale,
    greetingName,
  })

  const activeTrackSlug = dashboard.continueAt?.next.trackSlug ?? null
  const [activeDetail, activePathNodes] = activeTrackSlug
    ? await Promise.all([
        getCourseDetail(clerkUser.id, activeTrackSlug, locale),
        getTrackPathNodes(clerkUser.id, activeTrackSlug, locale),
      ])
    : [null, []]

  const showPath = Boolean(activeDetail && activePathNodes.length > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 pb-12 pt-6 md:px-8">
        <MascotGreet dashboard={dashboard} />
        <ThreeUp dashboard={dashboard} />
        {showPath && activeDetail ? (
          <section className="flex flex-col gap-6">
            <DashboardPathHeader detail={activeDetail} />
            <CoursePath
              detail={activeDetail}
              nodes={activePathNodes}
              hideHeader
            />
          </section>
        ) : null}
      </section>
      <aside className="hidden border-l-2 border-line-strong bg-transparent lg:block">
        {showPath && activeDetail ? (
          <div className="sticky top-0 max-h-[calc(100dvh-64px)] overflow-y-auto p-6">
            <CoursePathAside detail={activeDetail} />
          </div>
        ) : null}
      </aside>
    </div>
  )
}
