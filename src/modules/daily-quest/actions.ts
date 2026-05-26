"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { currentUser } from "@/server/auth"
import { db } from "@/server/db"
import { checkAndIncrement } from "@/server/rate-limit"
import { LocaleSchema } from "@/modules/content/lib"
import { getDailyQuestById } from "@/modules/content/service"
import type { ContentLocale } from "@/modules/content/types"
import { getWallet, spendHeart } from "@/modules/economy/service"
import { DAILY_RUN_LIMIT } from "@/modules/exercises/data"
import { ExercisePayloadSchema, validate } from "@/modules/exercises/lib"
import type { ExerciseDefinition } from "@/modules/exercises/lib"
import { awardXp, recordActivity } from "@/modules/gamification/service"
import { getOrCreateUser } from "@/modules/users/service"

import { DAILY_QUEST_SUPPORTED_KINDS, DAILY_QUEST_XP_PASS } from "./data"
import { markDailyQuestPassed } from "./service"
import type { RunDailyQuestResult, RunDailyQuestSceneResult } from "./types"

const InputSchema = z.object({
  questId: z.string().min(1),
  locale: LocaleSchema,
  // Ordered list of payloads, one per scene in `quest.frontMatter.scenes`.
  // The client walks the quest locally and only invokes this action once,
  // at the end, with every scene's final payload. Length must match
  // scenes.length on the server — otherwise the request is malformed.
  payloads: z.array(ExercisePayloadSchema).min(1).max(8),
})

export type RunDailyQuestInput = z.infer<typeof InputSchema>

export async function runDailyQuest(
  input: RunDailyQuestInput,
): Promise<RunDailyQuestResult> {
  const parsed = InputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const clerkUser = await currentUser()
  if (!clerkUser) return { ok: false, error: "unauthorized" }

  const user = await getOrCreateUser(clerkUser.id)

  const limit = await checkAndIncrement(user.id, DAILY_RUN_LIMIT)
  if (!limit.ok) return { ok: false, error: "invalid_input" }

  const quest = await getDailyQuestById(
    parsed.data.questId,
    parsed.data.locale as ContentLocale,
  )
  if (!quest) return { ok: false, error: "not_found" }

  const scenes = quest.frontMatter.scenes
  if (parsed.data.payloads.length !== scenes.length) {
    return { ok: false, error: "scene_count_mismatch" }
  }

  // Guard: every scene must use a supported deterministic kind. The
  // frontmatter loader already validates this via DailyFrontmatterSchema,
  // but a runtime check protects against schema drift.
  for (const scene of scenes) {
    if (!DAILY_QUEST_SUPPORTED_KINDS.has(scene.kind)) {
      return { ok: false, error: "unsupported_kind" }
    }
  }

  // Anti-cheat: the user must have THIS quest assigned for today. Prevents
  // a client from posting an arbitrary daily quest id and farming XP off
  // quests they weren't supposed to see yet.
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const assignment = await db.dailyQuestAssignment.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
  })
  if (!assignment || assignment.questId !== quest.id) {
    return { ok: false, error: "wrong_quest" }
  }

  // Re-validate every scene server-side. Same deterministic validator the
  // client used; we don't trust the "passed" flag the client computed.
  const sceneResults: { passed: boolean }[] = scenes.map((scene, i) => {
    const exercise = scene as ExerciseDefinition
    const payload = parsed.data.payloads[i]
    const result = validate(exercise, payload)
    return { passed: result.passed }
  })
  const allPassed = sceneResults.every((r) => r.passed)

  // Record a single Attempt for the whole quest. `stepId` carries the
  // daily piece id (e.g. "daily:correccion-quirurgica"); `payload` stores
  // the full array so we can audit later. `passed` reflects the AGGREGATE
  // outcome of the quest, not any single scene.
  await db.attempt.create({
    data: {
      userId: user.id,
      stepId: quest.id,
      stepLocale: quest.locale,
      payload: { kind: "daily-quest-batch", payloads: parsed.data.payloads } as never,
      results: sceneResults as never,
      passed: allPassed,
    },
  })

  // Streak bumps on any submission, idempotent same-day. Even a failed
  // quest counts as "the user showed up." Best-effort.
  recordActivity(user.id, "daily-quest").catch((err) => {
    console.error("[streak] runDailyQuest → recordActivity failed", err)
  })

  let xpAwarded = 0
  if (allPassed) {
    const pass = await markDailyQuestPassed(user.id, quest.id)
    if (pass?.firstPassOfDay) {
      xpAwarded = DAILY_QUEST_XP_PASS
      await awardXp({
        userId: user.id,
        amount: xpAwarded,
        source: "daily-quest",
      }).catch((err) => {
        console.error("[xp] awardXp(daily-quest) failed", err)
      })
    }
  }

  revalidatePath("/", "layout")

  return { ok: true, passed: allPassed, xpAwarded, sceneResults }
}

// Per-scene Comprobar for the daily quest. Mirrors `exercise-fail` heart
// spend semantics from the lesson player (modules/exercises/service.ts):
// validate server-side, decrement 1 heart if the scene failed AND the
// user hasn't already cleared today's daily. Already-passed daily quests
// stay free to replay — same shape as already-cleared lesson steps.
const SceneInputSchema = z.object({
  questId: z.string().min(1),
  locale: LocaleSchema,
  sceneIndex: z.number().int().min(0).max(7),
  payload: ExercisePayloadSchema,
})

export type RunDailyQuestSceneInput = z.infer<typeof SceneInputSchema>

export async function runDailyQuestScene(
  input: RunDailyQuestSceneInput,
): Promise<RunDailyQuestSceneResult> {
  const parsed = SceneInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const clerkUser = await currentUser()
  if (!clerkUser) return { ok: false, error: "unauthorized" }

  const user = await getOrCreateUser(clerkUser.id)

  const limit = await checkAndIncrement(user.id, DAILY_RUN_LIMIT)
  if (!limit.ok) return { ok: false, error: "invalid_input" }

  const quest = await getDailyQuestById(
    parsed.data.questId,
    parsed.data.locale as ContentLocale,
  )
  if (!quest) return { ok: false, error: "not_found" }

  const scenes = quest.frontMatter.scenes
  if (parsed.data.sceneIndex >= scenes.length) {
    return { ok: false, error: "invalid_input" }
  }
  const scene = scenes[parsed.data.sceneIndex]!
  if (!DAILY_QUEST_SUPPORTED_KINDS.has(scene.kind)) {
    return { ok: false, error: "unsupported_kind" }
  }
  if (scene.kind !== parsed.data.payload.kind) {
    return { ok: false, error: "invalid_input" }
  }

  // Anti-cheat: user must have THIS quest assigned for today.
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const assignment = await db.dailyQuestAssignment.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
  })
  if (!assignment || assignment.questId !== quest.id) {
    return { ok: false, error: "wrong_quest" }
  }
  const alreadyPassedToday = assignment.passed

  // Refuse the attempt up front when the wallet is empty AND the user
  // hasn't already cleared the daily today. Same guard the lesson player
  // applies in step-shell so the user never burns into negative hearts.
  if (!alreadyPassedToday) {
    const wallet = await getWallet(user.id)
    if (wallet.hearts <= 0) {
      return { ok: false, error: "no_hearts" }
    }
  }

  const result = validate(scene as ExerciseDefinition, parsed.data.payload)

  if (!result.passed && !alreadyPassedToday) {
    await spendHeart({ userId: user.id, reason: "exercise-fail" }).catch(
      (err) => {
        console.error("[hearts] spendHeart(daily-quest-fail) failed", err)
      },
    )
  }

  const walletAfter = await getWallet(user.id)
  // Reflect the heart change in the HUD on the next render.
  revalidatePath("/", "layout")

  return { ok: true, passed: result.passed, hearts: walletAfter.hearts }
}
