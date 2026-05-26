"use client"

import { useTranslations } from "next-intl"

import { usePathname } from "@/common/i18n/navigation"

type RouteId =
  | "dashboard"
  | "missionPath"
  | "crew"
  | "practice"
  | "workbench"
  | "leaderboard"
  | "shop"
  | "profile"

const ROUTE_LABELS: Array<{
  match: (pathname: string) => boolean
  id: RouteId
  section: "onboard" | "bridge"
}> = [
  {
    id: "dashboard",
    section: "onboard",
    match: (p) => p === "/dashboard" || p.startsWith("/dashboard/"),
  },
  {
    id: "missionPath",
    section: "onboard",
    match: (p) => p === "/tracks" || p.startsWith("/tracks/"),
  },
  {
    id: "crew",
    section: "onboard",
    match: (p) => p === "/crew" || p.startsWith("/crew/"),
  },
  {
    id: "practice",
    section: "onboard",
    match: (p) => p === "/practice" || p.startsWith("/practice/"),
  },
  {
    id: "workbench",
    section: "onboard",
    match: (p) => p === "/workbench" || p.startsWith("/workbench/"),
  },
  {
    id: "leaderboard",
    section: "bridge",
    match: (p) => p === "/leaderboard" || p.startsWith("/leaderboard/"),
  },
  {
    id: "shop",
    section: "bridge",
    match: (p) => p === "/shop" || p.startsWith("/shop/"),
  },
  {
    id: "profile",
    section: "bridge",
    match: (p) => p === "/perfil" || p.startsWith("/perfil/"),
  },
]

export function HudRouteLabel() {
  const t = useTranslations("common.sidebar")
  const pathname = usePathname()
  const route =
    ROUTE_LABELS.find((item) => item.match(pathname)) ?? ROUTE_LABELS[0]

  return (
    <div className="hidden min-w-0 flex-col border-l-2 border-line-strong pl-3 md:flex">
      <span className="font-display text-[10px] font-bold uppercase leading-none tracking-[0.16em] text-primary">
        {t(`sections.${route.section}`)}
      </span>
      <span className="mt-1 truncate font-display text-sm font-bold leading-none tracking-tight text-ink-1">
        {t(`items.${route.id}`)}
      </span>
    </div>
  )
}
