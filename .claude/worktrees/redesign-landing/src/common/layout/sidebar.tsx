"use client"

import { useTranslations } from "next-intl"

import { Link, usePathname } from "@/common/i18n/navigation"
import { PLAYER_STATS_PLACEHOLDER } from "@/modules/users/placeholder-stats"

type Item = {
  id: string
  // Translation key under common.sidebar.items.*
  labelKey: string
  // Glyph rendered to the left of the label (mono character).
  glyph: string
  // Route this nav item links to.
  href: string
  // Optional badge value (e.g. count of pending items).
  badge?: string
}

const ONBOARD: Item[] = [
  { id: "missionPath", labelKey: "missionPath", glyph: "▲", href: "/tracks" },
  {
    id: "practice",
    labelKey: "practice",
    glyph: "↻",
    href: "/practice",
    badge: "3",
  },
  { id: "crew", labelKey: "crew", glyph: "★", href: "/crew" },
  { id: "workbench", labelKey: "workbench", glyph: "≣", href: "/workbench" },
]

const BRIDGE: Item[] = [
  { id: "leaderboard", labelKey: "leaderboard", glyph: "♛", href: "/leaderboard" },
  { id: "shop", labelKey: "shop", glyph: "◆", href: "/shop" },
  { id: "profile", labelKey: "profile", glyph: "○", href: "/perfil" },
]

const PLACEHOLDER_STREAK_DAYS = PLAYER_STATS_PLACEHOLDER.streak

type Props = {
  // When `true`, the bottom "DAILY" streak card is hidden — for compact /
  // shorter-page contexts. Defaults to false (full sidebar).
  compact?: boolean
  // Real streak from gamification.service. Falls back to the placeholder
  // when not provided (anon view, marketing pages).
  streakDays?: number
}

// Sidebar — left-rail navigation. Used by pages that opt in (catalog, course
// detail). Active state is derived from current pathname. Items without a
// route render as visual placeholders until those features land.
export function Sidebar({
  compact = false,
  streakDays = PLACEHOLDER_STREAK_DAYS,
}: Props) {
  const t = useTranslations("common.sidebar")
  const pathname = usePathname()
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <nav className="sidebar">
      <div className="side-section">{t("sections.onboard")}</div>
      {ONBOARD.map((item) => (
        <SidebarItem
          key={item.id}
          item={item}
          label={t(`items.${item.labelKey}`)}
          active={isActive(item.href)}
        />
      ))}
      <div className="side-section" style={{ marginTop: 8 }}>
        {t("sections.bridge")}
      </div>
      {BRIDGE.map((item) => (
        <SidebarItem
          key={item.id}
          item={item}
          label={t(`items.${item.labelKey}`)}
          active={isActive(item.href)}
        />
      ))}
      {!compact ? (
        <div style={{ marginTop: "auto", paddingTop: 24 }}>
          <div className="side-section">{t("daily.label")}</div>
          <div
            style={{
              padding: 12,
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img
                src="/icons/streak-flame.svg"
                alt=""
                style={{ width: 20, height: 20 }}
              />
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: "var(--forge-orange)",
                }}
              >
                {t("daily.streakTitle", { days: streakDays })}
              </div>
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "var(--fg-dim)",
              }}
            >
              {t("daily.streakBody")}
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  )
}

function SidebarItem({
  item,
  label,
  active,
}: {
  item: Item
  label: string
  active: boolean
}) {
  const inner = (
    <>
      <span className="glyph">{item.glyph}</span>
      <span>{label}</span>
      {item.badge ? <span className="badge">{item.badge}</span> : null}
    </>
  )
  const className = "side-item" + (active ? " active" : "")
  return (
    <Link href={item.href} className={className}>
      {inner}
    </Link>
  )
}
