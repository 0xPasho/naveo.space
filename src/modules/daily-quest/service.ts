import "server-only"

import crypto from "node:crypto"
import { cache } from "react"

import { db } from "@/server/db"
import {
  getDailyQuestById,
  listDailyQuests,
} from "@/modules/content/service"
import type { ContentLocale, DailyQuest } from "@/modules/content/types"

import { DAILY_QUEST_SUPPORTED_KINDS } from "./data"
import type { AssignedDailyQuest } from "./types"

// Truncate a JS Date to UTC midnight of the same calendar day. Used as the
// PK for DailyQuestAssignment so two activities on the same UTC day collide
// into one row regardless of the time-of-day they fired.
const toUtcDay = (d: Date): Date => {
  const out = new Date(d)
  out.setUTCHours(0, 0, 0, 0)
  return out
}

const isoDay = (d: Date): string =>
  toUtcDay(d).toISOString().slice(0, 10)

// Union of `teaches` slugs across every step the user has marked completed
// in this locale. Used to bias daily-quest assignment toward concepts the
// user has actually seen in a lesson — "show me practice on what I already
// learned," not "throw random advanced topics at me." A user with zero
// completed steps gets back an empty set; the caller's fallback path picks
// from the full pool so a brand-new user still gets a daily.
async function getUserKnownConcepts(
  userId: string,
  locale: ContentLocale,
): Promise<Set<string>> {
  const completed = await db.progress.findMany({
    where: { userId, stepLocale: locale, status: "completed" },
    select: { stepId: true },
  })
  if (completed.length === 0) return new Set()

  const stepIds = completed.map((p) => p.stepId)
  const pieces = await db.contentPiece.findMany({
    where: { id: { in: stepIds }, locale, type: "step" },
    select: { frontMatter: true },
  })

  const out = new Set<string>()
  for (const p of pieces) {
    const fm = p.frontMatter as { teaches?: string[] }
    for (const slug of fm.teaches ?? []) out.add(slug)
  }
  return out
}

// Deterministic pick: hash(userId + dayIso) % eligibleSize. Same user on
// the same day always lands on the same index, so reloading /practice
// doesn't reassign a different quest mid-day.
//
// Eligibility pipeline:
//   1. Drop quests with any unsupported scene kind (defensive).
//   2. Prefer quests whose `teaches` slugs overlap with what the user has
//      already encountered in a completed step. Quests with NO `teaches`
//      are treated as foundational and stay eligible for everyone.
//   3. If step 2 leaves zero candidates (brand-new user, or tagging drift
//      where no quest matches any known concept), fall back to the full
//      supported pool so the user still gets a daily.
//
// Repeat practice is intentional — we don't exclude previously-completed
// quests. The deterministic hash naturally spreads picks across the pool.
const pickQuest = (
  userId: string,
  dayIso: string,
  pool: DailyQuest[],
  knownConcepts: Set<string>,
): DailyQuest | null => {
  const supported = pool.filter((q) =>
    q.frontMatter.scenes.every((scene) =>
      DAILY_QUEST_SUPPORTED_KINDS.has(scene.kind),
    ),
  )
  if (supported.length === 0) return null

  const preferred = supported.filter((q) => {
    const teaches = q.frontMatter.teaches ?? []
    if (teaches.length === 0) return true
    return teaches.some((slug) => knownConcepts.has(slug))
  })
  const eligible = preferred.length > 0 ? preferred : supported

  const hash = crypto
    .createHash("sha256")
    .update(`${userId}|${dayIso}`)
    .digest()
  const idx = hash.readUInt32BE(0) % eligible.length
  return eligible[idx]
}

// Get (or lazily create) the user's daily-quest assignment for today.
// Idempotent within a UTC day: repeat calls return the same assignment.
// Returns null when there are zero daily quests in the locale's pool — the
// UI should hide the daily card in that case.
//
// Wrapped in `cache()` so the practice page, daily route, dashboard,
// sidebar, and HUD all share one query within a single request. Without it
// each surface would round-trip to Postgres independently. Cache scope is
// the request — server actions and the next render get a fresh read, so a
// flip from `passed: false` to `passed: true` after `runDailyQuest` is
// reflected on the next render.
export const getOrAssignDailyQuest = cache(
  async (
    userId: string,
    locale: ContentLocale,
  ): Promise<AssignedDailyQuest | null> => {
    const today = toUtcDay(new Date())
    const todayIso = isoDay(today)

    // First pass: try to honor an existing assignment. If the quest the
    // row points to has been deleted/renamed in content we clear the row
    // and fall through to a fresh pick. The fall-through is iterative
    // (not recursive) because this function is wrapped in `cache()` — a
    // recursive call to the cached wrapper would await its own in-flight
    // promise and deadlock. The loop covers at most two iterations:
    // existing-but-stale → fresh pick.
    let existing = await db.dailyQuestAssignment.findUnique({
      where: { userId_date: { userId, date: today } },
    })

    if (existing) {
      // Resolve the quest in the CURRENT locale first. Daily content has
      // the same id/slug across locales (e.g. `daily:vago-vs-especifico`
      // exists in both es and en), so a user who switches language mid-day
      // sees their assigned quest translated. Falls back to the original
      // assignment locale if the current locale doesn't have that quest,
      // and only then drops the row so the fresh-pick path below runs.
      const quest =
        (await getDailyQuestById(existing.questId, locale)) ??
        (await getDailyQuestById(
          existing.questId,
          existing.questLocale as ContentLocale,
        ))
      if (quest) {
        return {
          quest,
          date: todayIso,
          passed: existing.passed,
          completedAt: existing.completedAt,
        }
      }
      await db.dailyQuestAssignment.delete({
        where: { userId_date: { userId, date: today } },
      })
      existing = null
    }

    const [pool, knownConcepts] = await Promise.all([
      listDailyQuests(locale),
      getUserKnownConcepts(userId, locale),
    ])
    const pick = pickQuest(userId, todayIso, pool, knownConcepts)
    if (!pick) return null

    await db.dailyQuestAssignment.create({
      data: {
        userId,
        date: today,
        questId: pick.id,
        questLocale: pick.locale,
      },
    })

    return {
      quest: pick,
      date: todayIso,
      passed: false,
      completedAt: null,
    }
  },
)

// Cheap "is the user's daily for today still open?" check used by surfaces
// (sidebar badge, HUD nudges) that need to nudge the user toward the daily
// without paying for a full pool fetch + content load. A row exists only
// AFTER the user has been assigned, so a missing row means "not yet
// assigned" — also surfaceable as pending. Returns false only when the row
// exists AND passed=true.
//
// `cache()`-wrapped: the sidebar runs in every page layout and the HUD
// runs in every authenticated layout; without caching this issues one
// extra query per render. The select={passed} variant doesn't share state
// with getOrAssignDailyQuest's full-row read — each is cached on its own.
export const hasPendingDailyQuest = cache(async (userId: string): Promise<boolean> => {
  const today = toUtcDay(new Date())
  const row = await db.dailyQuestAssignment.findUnique({
    where: { userId_date: { userId, date: today } },
    select: { passed: true },
  })
  if (!row) return true
  return !row.passed
})

// Mark today's assignment as passed. Idempotent: once `passed=true`, this is
// a no-op (subsequent failures don't downgrade it). Used by runDailyQuest
// after a successful validate() pass.
export async function markDailyQuestPassed(
  userId: string,
  questId: string,
): Promise<{ firstPassOfDay: boolean } | null> {
  const today = toUtcDay(new Date())
  const row = await db.dailyQuestAssignment.findUnique({
    where: { userId_date: { userId, date: today } },
  })
  if (!row || row.questId !== questId) return null
  if (row.passed) return { firstPassOfDay: false }

  await db.dailyQuestAssignment.update({
    where: { userId_date: { userId, date: today } },
    data: { passed: true, completedAt: new Date() },
  })
  return { firstPassOfDay: true }
}
