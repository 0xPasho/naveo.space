import { getTranslations, setRequestLocale } from "next-intl/server"

import { Eyebrow } from "@/common/components/ui"
import { SidebarShell } from "@/common/layout/sidebar-shell"
import type { ContentLocale } from "@/modules/content/types"
import { CourseCard } from "@/modules/catalog/components/course-card"
import { SummaryTiles } from "@/modules/catalog/components/summary-tiles"
import { getCatalog } from "@/modules/catalog/service"
import { currentUser } from "@/server/auth"

type Props = {
  params: Promise<{ locale: ContentLocale }>
}

export default async function TracksPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("tracks.list")

  const clerkUser = await currentUser()
  const userId = clerkUser?.id ?? null
  const catalog = await getCatalog(userId, locale)

  return (
    <SidebarShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 pb-12 pt-6 md:px-8">
        <header className="grid items-start gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <Eyebrow className="text-primary">
              {t("eyebrow", { count: catalog.courses.length })}
            </Eyebrow>
            <h1 className="mt-2 font-display font-bold text-4xl leading-tight tracking-tight text-ink-1 md:text-5xl">
              {t("headingLead")}{" "}
              <span className="text-stat-xp">{t("headingAccent")}</span>
            </h1>
            <p className="mt-3 max-w-[60ch] font-sans font-semibold text-base leading-relaxed text-ink-2">
              {t("subheading")}
            </p>
          </div>
          <SummaryTiles summary={catalog.summary} />
        </header>

        <div className="flex flex-col gap-4">
          {catalog.courses.map((course, i) => (
            <CourseCard key={course.slug} course={course} primary={i === 0} />
          ))}
        </div>
      </div>
    </SidebarShell>
  )
}
