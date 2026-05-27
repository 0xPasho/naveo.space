"use client"

import {
  CircleUser,
  Flame,
  LayoutDashboard,
  Map,
  Repeat2,
  Store,
  Trophy,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"

import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/common/components/ui/sidebar"
import { Link, usePathname } from "@/common/i18n/navigation"
import { PLAYER_STATS_PLACEHOLDER } from "@/modules/users/placeholder-stats"

type Item = {
  id: string
  labelKey: string
  icon: LucideIcon
  href: string
}

const ONBOARD: Item[] = [
  { id: "dashboard", labelKey: "dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "missionPath", labelKey: "missionPath", icon: Map, href: "/tracks" },
  { id: "crew", labelKey: "crew", icon: Users, href: "/crew" },
  { id: "practice", labelKey: "practice", icon: Repeat2, href: "/practice" },
  { id: "workbench", labelKey: "workbench", icon: Wrench, href: "/workbench" },
]

const BRIDGE: Item[] = [
  { id: "leaderboard", labelKey: "leaderboard", icon: Trophy, href: "/leaderboard" },
  { id: "shop", labelKey: "shop", icon: Store, href: "/shop" },
  { id: "profile", labelKey: "profile", icon: CircleUser, href: "/perfil" },
]

const PLACEHOLDER_STREAK_DAYS = PLAYER_STATS_PLACEHOLDER.streak

type Props = {
  compact?: boolean
  streakDays?: number
  practiceCount?: number
  // True when the user has an unfinished daily quest for today. Surfaces as
  // a "•" hint dot on the Práctica nav item even if the failure queue is
  // empty, so the user knows there's something to do today.
  dailyPending?: boolean
}

// Sidebar — left rail navigation. Built on the shadcn Sidebar primitive
// (which inherits the Naveo Bridge sidebar-* tokens) plus Tailwind utilities
// directly on each Item. No legacy CSS classes.
export function Sidebar({
  compact = false,
  streakDays = PLACEHOLDER_STREAK_DAYS,
  practiceCount,
  dailyPending = false,
}: Props) {
  const t = useTranslations("common.sidebar")
  const tHud = useTranslations("common.hud")
  const tLegal = useTranslations("legal.footer")
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(href + "/")
  }
  const badgeFor = (id: string): string | undefined => {
    if (id !== "practice") return undefined
    const queue = practiceCount ?? 0
    // Daily quest counts as one pending item even when the failure queue is
    // empty, so a fresh user without past fails still sees "do your daily."
    const total = queue + (dailyPending ? 1 : 0)
    if (total <= 0) return undefined
    return String(total)
  }

  return (
    <ShadcnSidebar collapsible="offcanvas">
      <SidebarHeader className="px-3 pt-4 pb-2">
        <Link
          href="/dashboard"
          aria-label={tHud("logoAlt")}
          className="inline-flex w-fit items-center"
        >
          <Image
            src="/icons/naveo/naveo-wordmark.svg"
            alt={tHud("logoAlt")}
            width={148}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-display font-bold text-[10px] uppercase tracking-[0.16em] text-ink-3">
            {t("sections.onboard")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ONBOARD.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  label={t(`items.${item.labelKey}`)}
                  active={isActive(item.href)}
                  badge={badgeFor(item.id)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="font-display font-bold text-[10px] uppercase tracking-[0.16em] text-ink-3">
            {t("sections.bridge")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {BRIDGE.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  label={t(`items.${item.labelKey}`)}
                  active={isActive(item.href)}
                  badge={badgeFor(item.id)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-3 p-3">
        {!compact ? (
          <div>
            <div className="mb-2 font-display font-bold text-[10px] uppercase tracking-[0.16em] text-ink-3">
              {t("daily.label")}
            </div>
            <div className="rounded-md border-2 border-line-soft bg-bg-raised p-3">
              <div className="flex items-center gap-2 font-display font-bold text-sm text-ink-1">
                <Flame className="size-4 text-stat-streak" strokeWidth={2.5} />
                {t("daily.streakTitle", { days: streakDays })}
              </div>
              <p className="mt-1.5 font-sans text-xs font-semibold leading-relaxed text-ink-2">
                {t("daily.streakBody")}
              </p>
            </div>
          </div>
        ) : null}
        <nav
          aria-label={tLegal("terms")}
          className="flex flex-col gap-1 border-t-2 border-line-soft pt-3 font-sans text-xs font-semibold text-ink-3"
        >
          <Link
            href="/blog"
            onClick={() => setOpenMobile(false)}
            className="rounded-xs px-1 py-0.5 transition-colors hover:text-ink-1"
          >
            {tLegal("blog")}
          </Link>
          <Link
            href="/terms"
            onClick={() => setOpenMobile(false)}
            className="rounded-xs px-1 py-0.5 transition-colors hover:text-ink-1"
          >
            {tLegal("terms")}
          </Link>
          <Link
            href="/privacy"
            onClick={() => setOpenMobile(false)}
            className="rounded-xs px-1 py-0.5 transition-colors hover:text-ink-1"
          >
            {tLegal("privacy")}
          </Link>
        </nav>
      </SidebarFooter>
    </ShadcnSidebar>
  )
}

function SidebarItem({
  item,
  label,
  active,
  badge,
}: {
  item: Item
  label: string
  active: boolean
  badge?: string
}) {
  const Icon = item.icon
  const { setOpenMobile } = useSidebar()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={item.href} />}
        isActive={active}
        onClick={() => setOpenMobile(false)}
        tooltip={label}
        className="font-display font-bold tracking-tight"
      >
        <Icon className="size-4" strokeWidth={2} aria-hidden />
        <span>{label}</span>
      </SidebarMenuButton>
      {badge ? (
        <SidebarMenuBadge className="bg-danger/15 text-danger">
          {badge}
        </SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  )
}
