import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import "@/modules/catalog/styles.css"

import { Link } from "@/common/i18n/navigation"
import { SidebarShell } from "@/common/layout/sidebar-shell"
import type { ContentLocale } from "@/modules/content/types"
import { CourseDetailHero } from "@/modules/catalog/components/course-detail-hero"
import { LearnCard } from "@/modules/catalog/components/learn-card"
import { SyllabusList } from "@/modules/catalog/components/syllabus-list"
import { getCourseDetail } from "@/modules/catalog/service"
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
  const detail = await getCourseDetail(userId, trackSlug, locale)
  if (!detail) notFound()

  return (
    <SidebarShell mainClass="detail-main">
      <Link href="/tracks" className="back-link">
        ← {t("backToTracks")}
      </Link>

      <CourseDetailHero detail={detail} />
      <LearnCard signingOfficer={detail.signingOfficer} />
      <SyllabusList
        trackSlug={detail.trackSlug}
        items={detail.syllabus}
        duration={detail.duration}
      />
    </SidebarShell>
  )
}
