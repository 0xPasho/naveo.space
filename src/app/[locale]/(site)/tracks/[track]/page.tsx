import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { Link } from "@/common/i18n/navigation"
import { SidebarShell } from "@/common/layout/sidebar-shell"
import type { ContentLocale } from "@/modules/content/types"
import { CourseDetailHero } from "@/modules/catalog/components/course-detail-hero"
import { CoursePath } from "@/modules/catalog/components/course-path"
import { CoursePathAside } from "@/modules/catalog/components/course-path-aside"
import { LearnCard } from "@/modules/catalog/components/learn-card"
import {
  getCourseDetail,
  getTrackPathNodes,
} from "@/modules/catalog/service"
import { currentUser } from "@/server/auth"

type Props = {
  params: Promise<{ locale: ContentLocale; track: string }>
}

export default async function TrackPage({ params }: Props) {
  const { locale, track: trackSlug } = await params
  setRequestLocale(locale)
  const t = await getTranslations("tracks.detail")

  const clerkUser = await currentUser()
  const userId = clerkUser?.id ?? null
  const [detail, pathNodes] = await Promise.all([
    getCourseDetail(userId, trackSlug, locale),
    getTrackPathNodes(userId, trackSlug, locale),
  ])
  if (!detail) notFound()

  return (
    <SidebarShell mainClass="detail-main">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 overflow-x-hidden px-5 pb-12 pt-6 md:px-8">
        <Link
          href="/tracks"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3 transition-colors hover:text-ink-1"
        >
          <ArrowLeft className="size-3" strokeWidth={2.5} />
          {t("backToTracks")}
        </Link>

        <CourseDetailHero detail={detail} />
        <LearnCard signingOfficer={detail.signingOfficer} />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <CoursePath detail={detail} nodes={pathNodes} />
          <CoursePathAside detail={detail} />
        </div>
      </div>
    </SidebarShell>
  )
}
