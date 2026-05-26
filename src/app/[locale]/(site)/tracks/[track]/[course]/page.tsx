import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { redirect } from "@/common/i18n/navigation"
import type { ContentLocale } from "@/modules/content/types"
import { getCourse, getTrack, listSteps } from "@/modules/content/service"

type Props = {
  params: Promise<{ locale: ContentLocale; track: string; course: string }>
}

// For Phase 1.3 the course page just redirects to the first step. A richer
// course landing (summary, hook, step list with progress) lands later.
export default async function CoursePage({ params }: Props) {
  const { locale, track: trackSlug, course: courseSlug } = await params
  setRequestLocale(locale)

  const [track, course, steps] = await Promise.all([
    getTrack(trackSlug, locale),
    getCourse(courseSlug, locale),
    listSteps(courseSlug, locale),
  ])

  if (!track || !course || course.trackSlug !== track.slug) notFound()
  if (steps.length === 0) notFound()

  redirect({
    href: `/tracks/${track.slug}/${course.slug}/${steps[0].slug}`,
    locale,
  })
}
