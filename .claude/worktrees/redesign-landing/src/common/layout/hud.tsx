import { Show, SignInButton, SignUpButton } from "@clerk/nextjs"
import { getLocale, getTranslations } from "next-intl/server"

import { Link } from "@/common/i18n/navigation"
import { LanguageSwitcher } from "@/common/layout/language-switcher"
import { UserMenu } from "@/common/layout/user-menu"
import { currentUser } from "@/server/auth"
import type { ContentLocale } from "@/modules/content/types"
import { HEARTS_MAX_DEFAULT } from "@/modules/economy/data"
import { getWallet } from "@/modules/economy/service"
import { getXpSnapshot } from "@/modules/gamification/service"
import { getOrCreateUser, getUserStats } from "@/modules/users/service"

// Hud — top bar shared across the (site) group. Mirrors the design's `.hud`:
// logo + spacer + 4 stat pills + avatar. XP/streak come from gamification;
// gems/hearts come from the live wallet for signed-in users.

export async function Hud() {
  const t = await getTranslations("common")
  const clerkUser = await currentUser()
  let xp = 0
  let streak = 0
  let atRisk = false
  let gems = 0
  let hearts = HEARTS_MAX_DEFAULT
  let heartsMax = HEARTS_MAX_DEFAULT
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
  }
  return (
    <header className="hud">
      <Link href="/dashboard" aria-label={t("hud.logoAlt")}>
        <img className="brand" src="/icons/logo-the-crew.svg" alt={t("hud.logoAlt")} />
      </Link>
      <span className="spacer" />
      <Show when="signed-in">
        <span className="hud-pill xp">
          <img src="/icons/xp-bolt.svg" alt="" />
          <span className="num">{xp.toLocaleString()}</span>
          <span className="lab">{t("hud.xpLabel")}</span>
        </span>
        <span
          className={"hud-pill streak" + (atRisk ? " at-risk" : "")}
          title={atRisk ? t("hud.streakAtRiskTitle") : undefined}
        >
          <img src="/icons/streak-flame.svg" alt="" />
          <span className="num">{streak}</span>
          <span className="lab">{t("hud.streakLabel")}</span>
        </span>
        <span className="hud-pill gem">
          <img src="/icons/gem.svg" alt="" />
          <span className="num">{gems}</span>
          <span className="lab">{t("hud.gemsLabel")}</span>
        </span>
        <span className="hud-pill hearts">
          {Array.from({ length: heartsMax }, (_, i) => (
            <img
              key={i}
              src={i < hearts ? "/icons/heart.svg" : "/icons/heart-empty.svg"}
              alt=""
            />
          ))}
        </span>
      </Show>
      <LanguageSwitcher />
      <Show when="signed-out">
        <SignInButton mode="modal">{t("header.signIn")}</SignInButton>
        <SignUpButton mode="modal">{t("header.signUp")}</SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserMenu />
      </Show>
    </header>
  )
}
