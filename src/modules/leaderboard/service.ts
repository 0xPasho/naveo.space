import "server-only"

import { clerkClient } from "@clerk/nextjs/server"

import { db } from "@/server/db"
import type { ContentLocale } from "@/modules/content/types"
import { getRealXpByUserInWindow } from "@/modules/gamification/service"

import type { MentorKey, OfficerRow } from "./types"

// Cap on how many officers we fetch from the DB. The design's table can
// hold a lot — but Clerk's getUserList paginates and we want to keep the
// leaderboard server-render quick. 100 is enough for the design's "50
// officers" framing and the "your rank #X of N" math.
const LEADERBOARD_LIMIT = 100

const MENTORS: readonly MentorKey[] = [
  "vega",
  "echo",
  "atlas",
  "forge",
  "orbit",
  "hex",
]

// Deterministic mentor pick from a userId — purely visual, no real
// mentor-assignment data yet. Hash bytes of the id mod 4.
function pickMentor(userId: string): MentorKey {
  let h = 0
  for (let i = 0; i < userId.length; i++) {
    h = (h * 31 + userId.charCodeAt(i)) >>> 0
  }
  return MENTORS[h % MENTORS.length]!
}

// UTC start-of-day for any Date.
const toUtcDay = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))

// Rolling-window leaderboard: rather than running a Monday-night cron to
// reset weekly state, we just window the last 7 days on every read. The
// previous window for rank-delta is the 7-day slice that ended where this
// one started. No scheduled job. Tradeoff: the "season closes in X"
// motivation goes away, replaced by a live "your activity" panel.
const WINDOW_DAYS = 7
const MS_PER_DAY = 24 * 60 * 60 * 1000

const windowStartFor = (now: Date): Date =>
  new Date(now.getTime() - WINDOW_DAYS * MS_PER_DAY)

const prevWindowStartFor = (now: Date): Date =>
  new Date(now.getTime() - 2 * WINDOW_DAYS * MS_PER_DAY)

export type LeaderboardData = {
  rows: OfficerRow[]
  // Total users considered (may include rows we couldn't pull a Clerk name
  // for — those still appear as "Officer ${shortId}").
  totalOfficers: number
  // Subset of rows that have weekly XP > 0; useful for the view to decide
  // whether to render the podium.
  activeCount: number
  // Top 3 by weekly XP, only when at least 3 users have weekly XP > 0.
  top3: OfficerRow[] | null
  // Movers — sorted by todayXp desc. Only populated when ≥2 users have
  // todayXp > 0.
  movers: OfficerRow[] | null
  // The viewer's row (already inside `rows`) — convenience pointer for the
  // status card. Null when the viewer hasn't been ranked yet.
  you: OfficerRow | null
  // XP gap to the rank immediately above the viewer this week, or null when
  // the viewer is already rank 1 / not in the ladder.
  xpToNext: number | null
  // Officer holding the rank above; null in the same cases.
  ahead: OfficerRow | null
}

export async function getLeaderboard(
  viewerId: string | null,
  locale: ContentLocale,
): Promise<LeaderboardData> {
  void locale

  // 1. Window: rolling 7-day slice ending now. "Today" is still UTC-day-
  //    truncated so the `todayXp` chip lines up with the HUD's daily count.
  const now = new Date()
  const windowStart = windowStartFor(now)
  const prevWindowStart = prevWindowStartFor(now)
  const todayStart = toUtcDay(now)

  // 2. Real XP per-user for: this window, this window excluding today (so
  //    we can derive today's XP by subtraction), and the previous 7-day
  //    window (for rank-delta). Each call replays xpForFrontmatter over
  //    Progress in the window — same formula awardXp uses, so the
  //    leaderboard matches Xp.total semantics. Locale is intentionally
  //    omitted: leaderboard XP is global across locales (a learner doing
  //    both es and en sees combined effort).
  const [windowById, beforeTodayById, prevById, xpRows] = await Promise.all([
    getRealXpByUserInWindow({ start: windowStart, endExclusive: now }),
    getRealXpByUserInWindow({ start: windowStart, endExclusive: todayStart }),
    getRealXpByUserInWindow({
      start: prevWindowStart,
      endExclusive: windowStart,
    }),
    db.xp.findMany({ select: { userId: true, dailyStreak: true } }),
  ])
  const streakById = new Map(xpRows.map((r) => [r.userId, r.dailyStreak]))

  // 3. Build the candidate user set: every user with weekly OR previous-week
  //    XP (so the rank-delta has both endpoints), plus the viewer if signed
  //    in. Then top up with registered users that have no XP this week so
  //    the table still shows a "rest of the fleet" tail when traffic is low.
  const userIds = new Set<string>()
  for (const id of windowById.keys()) userIds.add(id)
  for (const id of prevById.keys()) userIds.add(id)
  if (viewerId) userIds.add(viewerId)

  if (userIds.size < LEADERBOARD_LIMIT) {
    const filler = await db.user.findMany({
      select: { id: true },
      take: LEADERBOARD_LIMIT,
    })
    for (const u of filler) {
      if (userIds.size >= LEADERBOARD_LIMIT) break
      userIds.add(u.id)
    }
  }

  // 4. Cap at LEADERBOARD_LIMIT, ranking active users first so a popular
  //    week never pushes XP-earning users out of the slice. The viewer is
  //    always preserved — if they would be cut, swap them into the last
  //    slot so the status card still has data to render.
  const all = Array.from(userIds)
  all.sort((a, b) => {
    const aXp = windowById.get(a) ?? 0
    const bXp = windowById.get(b) ?? 0
    if (bXp !== aXp) return bXp - aXp
    const aPrev = prevById.get(a) ?? 0
    const bPrev = prevById.get(b) ?? 0
    return bPrev - aPrev
  })
  let ids = all.slice(0, LEADERBOARD_LIMIT)
  if (viewerId && !ids.includes(viewerId) && userIds.has(viewerId)) {
    ids = [...ids.slice(0, LEADERBOARD_LIMIT - 1), viewerId]
  }

  // 4. Bulk-fetch Clerk profiles for display name + handle. If Clerk fails,
  //    we degrade to short-id labels rather than failing the page.
  let clerkUsers: Array<{
    id: string
    firstName: string | null
    lastName: string | null
    username: string | null
    primaryEmailAddress?: { emailAddress: string | null } | null
  }> = []
  if (ids.length > 0) {
    try {
      const client = await clerkClient()
      const res = await client.users.getUserList({
        userId: ids,
        limit: LEADERBOARD_LIMIT,
      })
      clerkUsers = res.data.map((u) => ({
        id: u.id,
        firstName: u.firstName ?? null,
        lastName: u.lastName ?? null,
        username: u.username ?? null,
        primaryEmailAddress: u.primaryEmailAddress
          ? { emailAddress: u.primaryEmailAddress.emailAddress ?? null }
          : null,
      }))
    } catch {
      clerkUsers = []
    }
  }
  const clerkById = new Map(clerkUsers.map((u) => [u.id, u]))

  // 5. Build the unranked rows. `windowXp` = XP in the rolling 7-day slice,
  //    `prevWindowXp` = XP in the matching slice 7-14 days back (used only
  //    for rank-delta).
  type Unranked = {
    userId: string
    windowXp: number
    todayXp: number
    prevWindowXp: number
    streak: number
    name: string
    handle: string
    mentor: MentorKey
  }

  const unranked: Unranked[] = ids.map((id) => {
    const window = windowById.get(id) ?? 0
    const before = beforeTodayById.get(id) ?? 0
    const today = Math.max(0, window - before)
    const prev = prevById.get(id) ?? 0
    const streak = streakById.get(id) ?? 0
    const clerk = clerkById.get(id)
    const name =
      [clerk?.firstName, clerk?.lastName].filter(Boolean).join(" ").trim() ||
      clerk?.username ||
      clerk?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
      `Officer ${id.slice(-4).toUpperCase()}`
    const handle = "@" + (clerk?.username || id.slice(-6).toLowerCase())
    return {
      userId: id,
      windowXp: window,
      todayXp: today,
      prevWindowXp: prev,
      streak,
      name,
      handle,
      mentor: pickMentor(id),
    }
  })

  // 6. Rank by window XP desc, tie-break by streak desc, then by name.
  unranked.sort((a, b) => {
    if (b.windowXp !== a.windowXp) return b.windowXp - a.windowXp
    if (b.streak !== a.streak) return b.streak - a.streak
    return a.name.localeCompare(b.name)
  })

  // 7. Compute previous-window rank for delta. Same sort but on prevWindowXp.
  const prevSorted = [...unranked].sort((a, b) => {
    if (b.prevWindowXp !== a.prevWindowXp) return b.prevWindowXp - a.prevWindowXp
    return a.name.localeCompare(b.name)
  })
  const prevRankById = new Map<string, number>(
    prevSorted.map((u, i) => [u.userId, i + 1]),
  )

  const rows: OfficerRow[] = unranked.map((u, i) => {
    const rank = i + 1
    const prevRank = prevRankById.get(u.userId) ?? rank
    return {
      userId: u.userId,
      rank,
      name: u.userId === viewerId ? u.name : u.name,
      handle: u.handle,
      xp: u.windowXp,
      todayXp: u.todayXp,
      streak: u.streak,
      mentor: u.mentor,
      rankDelta: prevRank - rank,
      you: u.userId === viewerId,
    }
  })

  const activeCount = rows.filter((r) => r.xp > 0).length
  const moversByToday = [...rows]
    .filter((r) => r.todayXp > 0)
    .sort((a, b) => b.todayXp - a.todayXp)
    .slice(0, 5)

  const you = rows.find((r) => r.you) ?? null
  const ahead =
    you && you.rank > 1 ? rows.find((r) => r.rank === you.rank - 1) ?? null : null
  const xpToNext = you && ahead ? Math.max(0, ahead.xp - you.xp) : null

  return {
    rows,
    totalOfficers: rows.length,
    activeCount,
    top3: activeCount >= 3 ? rows.slice(0, 3) : null,
    movers: moversByToday.length >= 2 ? moversByToday : null,
    you,
    xpToNext,
    ahead,
  }
}
