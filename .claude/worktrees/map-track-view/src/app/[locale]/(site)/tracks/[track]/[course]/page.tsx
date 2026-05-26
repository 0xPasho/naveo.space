import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import "@/modules/catalog/styles.css"

import { Link } from "@/common/i18n/navigation"
import { SidebarShell } from "@/common/layout/sidebar-shell"
import type { ContentLocale } from "@/modules/content/types"
import { CourseMap } from "@/modules/catalog/components/course-map"
import { CourseMapHeader } from "@/modules/catalog/components/course-map-header"
import { getCourseMap } from "@/modules/catalog/service"
import { currentUser } from "@/server/auth"

type Props = {
  params: Promise<{ locale: ContentLocale; track: string; course: string }>
}

// Course map page — Duolingo-style zigzag of all steps in this course. Replaces
// the prior redirect-to-first-step so the user has a tappable overview.
export default async function CoursePage({ params }: Props) {
  const { locale, track: trackSlug, course: courseSlug } = await params
  setRequestLocale(locale)

  const t = await getTranslations("tracks.detail")

  const clerkUser = await currentUser()
  const userId = clerkUser?.id ?? null
  const map = await getCourseMap(userId, trackSlug, courseSlug, locale)
  if (!map) notFound()

  return (
    <SidebarShell mainClass="detail-main">
      <Link href={`/tracks/${trackSlug}`} className="back-link">
        ← {t("backToTracks")}
      </Link>

      <CourseMapHeader map={map} />
      <CourseMap map={map} />
    </SidebarShell>
  )
}
