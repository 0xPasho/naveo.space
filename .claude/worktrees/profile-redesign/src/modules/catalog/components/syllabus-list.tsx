import { getTranslations } from "next-intl/server"

import type { SyllabusItem } from "../types"
import { SyllabusRow } from "./syllabus-row"

type Props = {
  trackSlug: string
  items: SyllabusItem[]
  duration: string
}

// "Course content" syllabus list. Header + ordered list of SyllabusRow. The
// "current" row is rendered with the expanded "you'll do / you'll unlock"
// panel — the design only shows the expansion on the up-next step.
export async function SyllabusList({ trackSlug, items, duration }: Props) {
  const t = await getTranslations("tracks.detail.syllabus")
  const lessons = items.filter((i) => !i.isBoss).length
  const capstones = items.filter((i) => i.isBoss).length

  return (
    <section className="syllabus">
      <div className="syllabus-head">
        <h2 className="section-h">{t("heading")}</h2>
        <span className="syllabus-meta">
          {t("metaSummary", { lessons, capstones, duration })}
        </span>
      </div>
      <ol className="syllabus-list">
        {items.map((item) => (
          <SyllabusRow
            key={item.courseSlug}
            trackSlug={trackSlug}
            item={item}
            expanded={item.status === "current"}
          />
        ))}
      </ol>
    </section>
  )
}
