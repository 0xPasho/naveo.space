import type { CSSProperties } from "react"

import type { CourseBadge } from "@/modules/progress/types"

type Props = {
  badges: CourseBadge[]
  emptyLabel: string
  formatDate: (d: Date) => string
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

const GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: 12,
}

const CARD_STYLE: CSSProperties = {
  position: "relative",
  background: "var(--card-raised)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 14,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
  overflow: "hidden",
}

const RIBBON_STYLE: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 3,
  background: "var(--brand-gold)",
}

const GLOW_STYLE: CSSProperties = {
  position: "absolute",
  top: -40,
  left: "50%",
  transform: "translateX(-50%)",
  width: 140,
  height: 100,
  background:
    "radial-gradient(50% 60% at 50% 100%, var(--brand-gold), transparent 70%)",
  opacity: 0.18,
  pointerEvents: "none",
}

const DISC_STYLE: CSSProperties = {
  position: "relative",
  width: 56,
  height: 56,
  borderRadius: "50%",
  border: "2px solid oklch(.78 .14 80 / .55)",
  background: "oklch(.78 .14 80 / .12)",
  color: "var(--brand-gold)",
  display: "grid",
  placeItems: "center",
  fontWeight: 700,
  fontSize: 20,
  fontFamily: "var(--font-sans)",
}

const TITLE_STYLE: CSSProperties = {
  position: "relative",
  margin: 0,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "-.01em",
  textAlign: "center",
  color: "var(--fg)",
  width: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}

const DATE_STYLE: CSSProperties = {
  position: "relative",
  margin: 0,
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  letterSpacing: ".12em",
  textTransform: "uppercase",
  color: "var(--fg-dim)",
}

export function BadgesGallery({ badges, emptyLabel, formatDate }: Props) {
  if (badges.length === 0) {
    return <p style={EMPTY_STYLE}>{emptyLabel}</p>
  }

  return (
    <div style={GRID_STYLE}>
      {badges.map((b) => {
        const initial = b.courseTitle.slice(0, 1).toUpperCase()
        return (
          <article key={b.courseSlug} style={CARD_STYLE}>
            <span style={RIBBON_STYLE} aria-hidden />
            <span style={GLOW_STYLE} aria-hidden />
            <span style={DISC_STYLE} aria-hidden>
              {initial}
            </span>
            <p style={TITLE_STYLE} title={b.courseTitle}>
              {b.courseTitle}
            </p>
            <p style={DATE_STYLE}>{formatDate(b.earnedAt)}</p>
          </article>
        )
      })}
    </div>
  )
}
