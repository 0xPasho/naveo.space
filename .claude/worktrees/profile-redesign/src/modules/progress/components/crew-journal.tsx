import type { CSSProperties } from "react"
import { Check } from "lucide-react"

import { Link } from "@/common/i18n/navigation"
import { timeAgo } from "@/common/lib/format"
import type { JournalEntry } from "@/modules/progress/types"

type Props = {
  entries: JournalEntry[]
  locale?: string
  emptyLabel: string
}

const EMPTY_STYLE: CSSProperties = {
  margin: 0,
  padding: "14px 16px",
  background: "var(--card-sunk)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 13,
  color: "var(--fg-muted)",
}

const LIST_STYLE: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: "none",
  background: "var(--card-sunk)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  overflow: "hidden",
}

const ROW_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: "12px 14px",
}

const ICON_STYLE: CSSProperties = {
  marginTop: 2,
  flexShrink: 0,
  width: 22,
  height: 22,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "oklch(.78 .14 80 / .15)",
  color: "var(--brand-gold)",
  border: "1px solid oklch(.78 .14 80 / .35)",
}

const TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontSize: 13,
  fontWeight: 600,
  color: "var(--fg)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
}

const SUB_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  letterSpacing: ".12em",
  textTransform: "uppercase",
  color: "var(--fg-dim)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
}

const TIME_STYLE: CSSProperties = {
  flexShrink: 0,
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  letterSpacing: ".12em",
  textTransform: "uppercase",
  color: "var(--fg-dim)",
  fontFeatureSettings: '"tnum"',
}

export function CrewJournal({ entries, locale = "es", emptyLabel }: Props) {
  if (entries.length === 0) {
    return <p style={EMPTY_STYLE}>{emptyLabel}</p>
  }

  return (
    <ul style={LIST_STYLE}>
      {entries.map((e, i) => {
        const href = `/tracks/${e.trackSlug}/${e.courseSlug}/${e.stepSlug}`
        const itemStyle: CSSProperties = {
          borderTop: i ? "1px solid var(--border)" : "0",
        }
        return (
          <li key={e.stepId} style={itemStyle}>
            <Link
              href={href}
              style={{
                display: "block",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={ROW_STYLE}>
                <span style={ICON_STYLE} aria-hidden>
                  <Check className="size-3" />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={TITLE_STYLE}>{e.stepTitle}</p>
                  <p style={SUB_STYLE}>{e.courseTitle}</p>
                </div>
                <span style={TIME_STYLE}>
                  {timeAgo(e.completedAt, locale)}
                </span>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
