import { getTranslations } from "next-intl/server"

import { Link } from "@/common/i18n/navigation"

import type { SyllabusItem } from "../types"

type Props = {
  trackSlug: string
  item: SyllabusItem
  expanded?: boolean
}

// One row of the syllabus list. Layout matches the design's .syl-row:
// rail (state-coded number circle + spine) + .syl-card (kind label / steps /
// title / desc / progress bar / action). The "current" row gets a chunky
// XP-gold pulsing number; "done" rows get a green check; "locked" gets a
// padlock; "boss" gets a mission-target glyph.
export async function SyllabusRow({ trackSlug, item, expanded = false }: Props) {
  const tRow = await getTranslations("tracks.detail.syllabus.row")
  const tKind = await getTranslations("tracks.detail.syllabus.kind")

  const status = item.status

  const kindLabel = tKind(item.kind)

  const action = renderAction(status, item, tRow)

  const numCell = (() => {
    if (status === "done") return "✓"
    if (status === "current")
      return <img src="/icons/xp-bolt.svg" alt="" style={{ width: 20, height: 20 }} />
    if (status === "locked")
      return <img src="/icons/lock.svg" alt="" style={{ width: 20, height: 20 }} />
    if (item.isBoss)
      return (
        <img
          src="/icons/mission-target.svg"
          alt=""
          style={{ width: 20, height: 20 }}
        />
      )
    return item.index
  })()

  const pctLabel = (() => {
    if (item.pct === 100) return tRow("cleared")
    if (item.pct === 0) {
      if (status === "current") return tRow("upNext")
      if (status === "locked") return tRow("locked")
    }
    return tRow("pct", { pct: item.pct })
  })()

  const cardOpenClass = expanded ? " open" : ""

  return (
    <li className={"syl-row " + status + cardOpenClass}>
      <div className="syl-rail">
        <div className="syl-num">{numCell}</div>
        <div className="syl-spine" />
      </div>

      <div className="syl-card">
        <div className="syl-head">
          <div className="syl-meta">
            <span className="syl-kind">{kindLabel}</span>
            <span className="syl-steps">
              {tRow("stepsAndXp", { steps: item.stepsTotal, xp: item.xp })}
            </span>
          </div>
          <h3 className="syl-title">{item.title}</h3>
          {item.desc ? <p className="syl-desc">{item.desc}</p> : null}

          <div className="syl-bar-row">
            <div className="progress slim">
              <b style={{ width: `${item.pct}%` }} />
            </div>
            <span className="syl-pct">{pctLabel}</span>
          </div>
        </div>

        <div className="syl-action">{action}</div>

        {expanded ? <ExpandedPanel xp={item.xp} /> : null}
      </div>
    </li>
  )

  function renderAction(
    s: SyllabusItem["status"],
    it: SyllabusItem,
    tr: typeof tRow,
  ) {
    const href = `/tracks/${trackSlug}/${it.courseSlug}`
    if (s === "done") {
      return (
        <>
          <div className="syl-stars">★★★</div>
          <Link href={href} className="btn btn-ghost btn-sm">
            {tr("replay")}
          </Link>
        </>
      )
    }
    if (s === "current") {
      return (
        <Link href={href} className="btn btn-cta">
          {tr("resume")}
        </Link>
      )
    }
    if (s === "active") {
      return (
        <Link href={href} className="btn btn-cyan btn-sm">
          {tr("continue")}
        </Link>
      )
    }
    if (it.isBoss) {
      return <span className="syl-tag boss">{tr("tagBoss")}</span>
    }
    return <span className="syl-tag">{tr("tagLocked")}</span>
  }
}

async function ExpandedPanel({ xp }: { xp: number }) {
  const t = await getTranslations("tracks.detail.syllabus.expanded")
  const doItems = t.raw("doItems") as string[]
  const unlockItemsRaw = t.raw("unlockItems") as string[]
  const unlockItems = unlockItemsRaw.map((s) =>
    s.replace("{xp}", String(xp)),
  )
  const unlockIcons = ["xp-bolt", "star", "mission-target"]

  return (
    <div className="syl-expanded">
      <div className="syl-exp-grid">
        <div>
          <div className="exp-h">{t("youllDo")}</div>
          <ul className="exp-list">
            {doItems.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="exp-h">{t("youllUnlock")}</div>
          <ul className="exp-list">
            {unlockItems.map((line, i) => (
              <li key={i}>
                <img
                  src={`/icons/${unlockIcons[i] ?? "star"}.svg`}
                  alt=""
                />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
