import { getLocale } from "next-intl/server"

import { Sidebar } from "@/common/layout/sidebar"
import type { ContentLocale } from "@/modules/content/types"
import { hasPendingDailyQuest } from "@/modules/daily-quest/service"
import { getXpSnapshot } from "@/modules/gamification/service"
import { getPracticeRail } from "@/modules/practice/service"
import { getOrCreateUser } from "@/modules/users/service"
import { currentUser } from "@/server/auth"

type Props = {
  compact?: boolean
}

// Server wrapper around <Sidebar>. Fetches the real practice queue count and
// current streak so the client Sidebar can render them without each page
// duplicating the wiring. For anon viewers, falls back to the Sidebar's
// built-in placeholders.
export async function SidebarServer({ compact = false }: Props) {
  const clerkUser = await currentUser()
  if (!clerkUser) {
    return <Sidebar compact={compact} />
  }
  const locale = (await getLocale()) as ContentLocale
  const user = await getOrCreateUser(clerkUser.id)
  const [rail, snap, dailyPending] = await Promise.all([
    getPracticeRail(user.id, locale),
    getXpSnapshot(user.id),
    hasPendingDailyQuest(user.id),
  ])
  return (
    <Sidebar
      compact={compact}
      streakDays={snap.dailyStreak}
      practiceCount={rail.total}
      dailyPending={dailyPending}
    />
  )
}
