import { getTranslations } from "next-intl/server"

import { Link } from "@/common/i18n/navigation"

import type { CourseMap, CourseMapNode } from "../types"

type Props = {
  map: CourseMap
}

// Duolingo-style vertical zigzag of all steps in a course. Status drives the
// node visual; locked nodes are not links. The current node carries the only
// inline tooltip so the eye lands on the actionable spot.
export async function CourseMap({ map }: Props) {
  const t = await getTranslations("tracks.map")

  return (
    <section className="course-map">
      <div className="course-map-rail" aria-hidden />
      <ol className="course-map-list">
        {map.nodes.map((node, i) => (
          <CourseMapNodeRow
            key={node.stepSlug}
            node={node}
            position={positionFor(i, map.nodes.length)}
            href={`/tracks/${map.trackSlug}/${map.courseSlug}/${node.stepSlug}`}
            currentLabel={t("current")}
            lockedLabel={t("locked")}
          />
        ))}
      </ol>
    </section>
  )
}

type Position = "left" | "center" | "right"

// 5-position zigzag, mirrors a standard Duolingo path: C L LL L C R RR R C ...
// We squash it to L C R for simplicity — keeps the page narrow and readable.
function positionFor(i: number, total: number): Position {
  if (i === 0 || i === total - 1) return "center"
  const m = i % 4
  if (m === 1) return "left"
  if (m === 3) return "right"
  return "center"
}

function CourseMapNodeRow({
  node,
  position,
  href,
  currentLabel,
  lockedLabel,
}: {
  node: CourseMapNode
  position: Position
  href: string
  currentLabel: string
  lockedLabel: string
}) {
  const inner = (
    <div className={`map-node ${node.status}${node.isBoss ? " boss" : ""}`}>
      <div className="ring2" />
      <NodeGlyph node={node} />
      {node.stars != null ? (
        <div className="stars">
          {"★".repeat(node.stars)}
          {"☆".repeat(3 - node.stars)}
        </div>
      ) : null}
      {node.status === "current" ? (
        <div className="map-node-tooltip">{currentLabel}</div>
      ) : null}
      <div className="map-node-label">
        <span className="idx">{String(node.index).padStart(2, "0")}</span>
        <span className="title">{node.title}</span>
      </div>
    </div>
  )

  const cls = `course-map-row ${position}`
  if (node.status === "locked") {
    return (
      <li className={cls} aria-label={lockedLabel}>
        {inner}
      </li>
    )
  }
  return (
    <li className={cls}>
      <Link href={href} className="course-map-link">
        {inner}
      </Link>
    </li>
  )
}

function NodeGlyph({ node }: { node: CourseMapNode }) {
  if (node.status === "done") {
    return (
      <span className="glyph check" aria-hidden>
        ✓
      </span>
    )
  }
  if (node.status === "locked") {
    return <img src="/icons/lock.svg" alt="" />
  }
  if (node.isBoss) {
    return <img src="/icons/mission-target.svg" alt="" />
  }
  if (node.status === "current") {
    return <img src="/icons/xp-bolt.svg" alt="" />
  }
  return <img src="/icons/star.svg" alt="" />
}
