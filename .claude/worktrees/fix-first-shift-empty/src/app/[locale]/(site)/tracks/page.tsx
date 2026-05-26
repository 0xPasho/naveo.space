import { getTranslations, setRequestLocale } from "next-intl/server"

import "@/modules/catalog/styles.css"

import { SidebarShell } from "@/common/layout/sidebar-shell"
import type { ContentLocale } from "@/modules/content/types"
import { CategoryChipRow } from "@/modules/catalog/components/category-chip-row"
import { CourseCard } from "@/modules/catalog/components/course-card"
import { SummaryTiles } from "@/modules/catalog/components/summary-tiles"
import { getCatalog } from "@/modules/catalog/service"
import { resolveContentLocale } from "@/modules/content/service"
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
  const contentLocale = await resolveContentLocale(locale)
  const catalog = await getCatalog(userId, contentLocale)

  return (
    <SidebarShell>
      <header className="catalog-header">
          <div>
            <div className="catalog-eyebrow">
              {t("eyebrow", { count: catalog.courses.length })}
            </div>
            <h1 className="catalog-title">
              {t("headingLead")} <em>{t("headingAccent")}</em>
            </h1>
            <p className="catalog-sub">{t("subheading")}</p>
          </div>
          <SummaryTiles summary={catalog.summary} />
        </header>

        <CategoryChipRow chips={catalog.chips} active="all" />

        {catalog.courses.length === 0 ? (
          <p className="catalog-empty">{t("empty")}</p>
        ) : (
          <div className="catalog-grid">
            {catalog.courses.map((course, i) => (
              <CourseCard key={course.slug} course={course} primary={i === 0} />
            ))}
          </div>
        )}

      <div className="catalog-foot">
        <button type="button" className="btn btn-cyan btn-load">
          {t("loadMore")}
        </button>
        <span className="catalog-hint">
          {t("hint")} <b>{t("hintCta")}</b>
        </span>
      </div>
    </SidebarShell>
  )
}
