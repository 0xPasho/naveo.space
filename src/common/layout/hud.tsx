import { Show, SignInButton, SignUpButton } from "@clerk/nextjs"
import Image from "next/image"
import { getLocale, getTranslations } from "next-intl/server"

import { Button } from "@/common/components/ui"
import { SidebarTrigger } from "@/common/components/ui/sidebar"
import { Link } from "@/common/i18n/navigation"
import { GemsPill } from "@/common/layout/gems-pill"
import { HeartsPill } from "@/common/layout/hearts-pill"
import { HudRouteLabel } from "@/common/layout/hud-route-label"
import { LanguageSwitcher } from "@/common/layout/language-switcher"
import { StreakPill } from "@/common/layout/streak-pill"
import { StreakSaveBanner } from "@/common/layout/streak-save-banner"
import { UserMenu } from "@/common/layout/user-menu"
import { XpPill } from "@/common/layout/xp-pill"
import { currentUser } from "@/server/auth"
import type { ContentLocale } from "@/modules/content/types"
import { HEART_REGEN_INTERVAL_MS, HEARTS_MAX_DEFAULT } from "@/modules/economy/data"
import { getWallet } from "@/modules/economy/service"
import { getXpSnapshot } from "@/modules/gamification/service"
import type { XpSnapshot } from "@/modules/gamification/types"
import { getOrCreateUser, getUserStats } from "@/modules/users/service"

// Hud — top bar shared across the (site) + (player) groups. 64px tall,
// transparent shell with a subtle colored rule; HUD pills + language + user
// menu stay on the right.

type Props = {
  showSidebarTrigger?: boolean
}

export async function Hud({ showSidebarTrigger = false }: Props = {}) {
  const t = await getTranslations("common")
  const clerkUser = await currentUser()
  let xp = 0
  let streak = 0
  let atRisk = false
  let gems = 0
  let hearts = HEARTS_MAX_DEFAULT
  let heartsMax = HEARTS_MAX_DEFAULT
  let nextHeartAt: string | null = null
  let freezes = 0
  let recentFreezeSave: XpSnapshot["recentFreezeSave"] = null
  if (clerkUser) {
    const locale = (await getLocale()) as ContentLocale
    const user = await getOrCreateUser(clerkUser.id)
    const [stats, xpSnap, wallet] = await Promise.all([
      getUserStats(user.id, locale),
      getXpSnapshot(user.id),
      getWallet(user.id),
    ])
    xp = stats.xp
    streak = xpSnap.dailyStreak
    atRisk = xpSnap.atRiskToday
    gems = wallet.gems
    hearts = wallet.hearts
    heartsMax = wallet.heartsMax
    nextHeartAt = wallet.nextHeartAt
    freezes = wallet.streakFreezes
    recentFreezeSave = xpSnap.recentFreezeSave
  }
  return (
    <header className="flex h-16 min-w-0 items-center gap-2 overflow-hidden border-b-2 border-line-strong bg-transparent px-3 md:gap-3 md:px-6">
      {/* Brand mark — only on mobile (the icon-only mark, to save width).
          On desktop, the wordmark lives at the top of the left Sidebar. */}
      <Link
        href="/dashboard"
        aria-label={t("hud.logoAlt")}
        className="inline-flex shrink-0 md:hidden"
      >
        <Image
          src="/icons/naveo/naveo-icon.svg"
          alt={t("hud.logoAlt")}
          width={32}
          height={32}
          className="size-8"
          priority
        />
      </Link>
      {showSidebarTrigger ? (
        <SidebarTrigger
          aria-label={t("sidebar.menuTrigger")}
          className="inline-flex size-9 items-center justify-center rounded-sm border-2 border-line-strong bg-bg-raised text-ink-2 outline-none transition-colors hover:text-ink-1 focus-visible:ring-4 focus-visible:ring-primary-soft md:hidden"
        />
      ) : null}
      <HudRouteLabel />
      <span className="flex-1" />
      <Show when="signed-in">
        <XpPill xp={xp} />
        <StreakPill streak={streak} atRisk={atRisk} freezes={freezes} />
        {/* Gems pill is desktop-only — hidden on phone widths to keep the
            HUD from overflowing. Accessible from the shop / dashboard. */}
        <div className="hidden md:contents">
          <GemsPill gems={gems} />
        </div>
        <HeartsPill
          hearts={hearts}
          heartsMax={heartsMax}
          nextHeartAt={nextHeartAt}
          regenIntervalMs={HEART_REGEN_INTERVAL_MS}
        />
        {recentFreezeSave ? (
          <StreakSaveBanner
            id={recentFreezeSave.id}
            count={recentFreezeSave.count}
          />
        ) : null}
      </Show>
      {/* Language switcher is desktop-only in the HUD; on mobile the same
          control is available inside the user menu (see UserMenu). */}
      <div className="hidden md:contents">
        <LanguageSwitcher />
      </div>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button variant="ghost" size="sm">
            {t("header.signIn")}
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button size="sm">{t("header.signUp")}</Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserMenu />
      </Show>
    </header>
  )
}
