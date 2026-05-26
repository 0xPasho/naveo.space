import type { ContentLocale, DailyQuest } from "@/modules/content/types"

// One row of DailyQuestAssignment plus the loaded quest content. Returned by
// service.getOrAssignDailyQuest so callers (route, UI) get everything they
// need without a second query.
export type AssignedDailyQuest = {
  quest: DailyQuest
  date: string // ISO yyyy-mm-dd, UTC calendar day the assignment covers
  passed: boolean
  completedAt: Date | null
}

// Possible outcomes when invoking the runDailyQuest server action. The
// client walks the scenes locally (it validates each as the user clicks
// "Comprobar") and only calls the action ONCE with all payloads at the end
// of the quest. The server re-validates everything as anti-cheat. If all
// scenes pass server-side, the assignment is marked complete and XP is
// granted. If anything fails (mismatched count, failed validate, tampered
// payload), `passed: false` is returned and nothing is persisted.
export type RunDailyQuestResult =
  | {
      ok: true
      passed: boolean
      xpAwarded: number
      // Per-scene server-side validation outcome, same order as `payloads`.
      // Length matches scenes.length. Useful for the success card and for
      // detecting tamper attempts (a scene the client thought passed but the
      // server rejected).
      sceneResults: { passed: boolean }[]
    }
  | { ok: false; error: RunDailyQuestError }

export type RunDailyQuestError =
  | "unauthorized"
  | "not_found"
  | "invalid_input"
  | "wrong_quest" // payload referenced a quest the user wasn't assigned today
  | "unsupported_kind" // daily quests only support deterministic kinds
  | "scene_count_mismatch" // payload array length != scenes.length
  | "no_hearts" // wallet ran out before this attempt

// Per-scene attempt outcome. Issued by `runDailyQuestScene` on every
// individual Comprobar so the daily-quest player can mirror the
// lesson-player flow: validate server-side, spend a heart on fail,
// surface the updated wallet to the HUD.
export type RunDailyQuestSceneResult =
  | {
      ok: true
      passed: boolean
      // Hearts AFTER this attempt was applied (decremented on fail unless
      // the quest was already passed today). The UI uses it both to drive
      // the 0-hearts guard banner and to skip waiting on router.refresh.
      hearts: number
    }
  | { ok: false; error: RunDailyQuestError }

export type DailyQuestLocale = ContentLocale
