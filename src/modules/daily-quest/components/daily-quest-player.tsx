"use client"

import { CheckCircle2, Loader2, RotateCcw } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

import { Button, Callout } from "@/common/components/ui"
import { Link, useRouter } from "@/common/i18n/navigation"
import { cn } from "@/common/lib/utils"
import type { ContentLocale, Exercise } from "@/modules/content/types"
import { MCPDebugRunner } from "@/modules/exercises/runners/mcp-debug"
import { PromptABRunner } from "@/modules/exercises/runners/prompt-AB"
import { PromptAnatomyRunner } from "@/modules/exercises/runners/prompt-anatomy"
import { PromptTagFillRunner } from "@/modules/exercises/runners/prompt-tag-fill"
import { SlotFillDndRunner } from "@/modules/exercises/runners/slot-fill-dnd"
import { StepOrderDndRunner } from "@/modules/exercises/runners/step-order-dnd"
import { ToolDescriptionRunner } from "@/modules/exercises/runners/tool-description"
import { WiringDndRunner } from "@/modules/exercises/runners/wiring-dnd"
import type {
  AttemptResult,
  ExercisePayload,
} from "@/modules/exercises/types"

import { runDailyQuest, runDailyQuestScene } from "../actions"

type Props = {
  questId: string
  locale: ContentLocale
  scenes: Exercise[]
  initialPassed: boolean
  // UTC ISO yyyy-mm-dd of today's assignment. Scoped into the localStorage
  // key so refreshing the page mid-quest restores progress only for THIS
  // day, and tomorrow's quest gets a fresh slate without us having to
  // explicitly purge yesterday's row.
  date: string
  // Live hearts at page-load time. Used to gate Comprobar when the wallet
  // is empty (same as the lesson player's `outOfHearts` guard). Already-
  // passed dailies stay free to replay, so the gate only applies when
  // `initialPassed=false`.
  hearts: number
}

// ---- Mid-quest persistence --------------------------------------------
// The walker keeps currentIdx + payloads + sceneResults in React state.
// Without persistence, a tab close or refresh wipes everything and the
// user starts from scene 0. localStorage by (questId, date) restores the
// in-flight state cheaply. Cleared on commit success and on replay so a
// finished quest can't get accidentally restored.

const STORAGE_PREFIX = "naveo:daily-progress"
const storageKey = (questId: string, date: string) =>
  `${STORAGE_PREFIX}:${questId}:${date}`

type PersistedState = {
  currentIdx: number
  payloads: (ExercisePayload | null)[]
  sceneResults: (AttemptResult | null)[]
}

const loadPersisted = (
  key: string,
  scenes: Exercise[],
): PersistedState | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedState
    const expectedLen = scenes.length
    // Defensive: refuse stale data with a different scene count (quest
    // content was reauthored). Fresh state is safer than mismatched.
    if (
      parsed.payloads?.length !== expectedLen ||
      parsed.sceneResults?.length !== expectedLen
    ) {
      return null
    }
    // Refuse the restore if any persisted payload's `kind` no longer
    // matches the scene at that index. This happens when a daily quest is
    // re-authored mid-day (same questId, same date, but a scene's kind
    // changed). Without this check the Runner's value/kind mismatch
    // dispatch returns null and the exercise area renders empty — looks
    // exactly like a flicker where content vanishes on refresh.
    for (let i = 0; i < expectedLen; i++) {
      const p = parsed.payloads[i]
      if (p && p.kind !== scenes[i]!.kind) return null
    }
    // Clamp currentIdx to a valid scene index.
    const currentIdx =
      typeof parsed.currentIdx === "number" &&
      parsed.currentIdx >= 0 &&
      parsed.currentIdx < expectedLen
        ? parsed.currentIdx
        : 0
    return { ...parsed, currentIdx }
  } catch {
    return null
  }
}

const savePersisted = (key: string, state: PersistedState) => {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(state))
  } catch {
    // localStorage full / disabled / private mode. Silent.
  }
}

const clearPersisted = (key: string) => {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

// Starter payload for each supported daily-quest kind. Mirrors step-shell
// but trimmed to deterministic kinds only.
const initialPayloadFor = (exercise: Exercise): ExercisePayload | null => {
  switch (exercise.kind) {
    case "prompt-anatomy":
      return PromptAnatomyRunner.empty()
    case "prompt-AB":
      return PromptABRunner.empty()
    case "prompt-tag-fill":
      return PromptTagFillRunner.empty()
    case "tool-description":
      return ToolDescriptionRunner.empty(exercise)
    case "mcp-debug":
      return MCPDebugRunner.empty()
    case "step-order-dnd":
      return StepOrderDndRunner.empty(exercise)
    case "slot-fill-dnd":
      return SlotFillDndRunner.empty()
    case "wiring-dnd":
      return WiringDndRunner.empty()
    default:
      return null
  }
}

const isComplete = (exercise: Exercise, payload: ExercisePayload): boolean => {
  if (exercise.kind !== payload.kind) return false
  switch (exercise.kind) {
    case "prompt-anatomy":
      return PromptAnatomyRunner.isComplete(exercise, payload as never)
    case "prompt-AB":
      return PromptABRunner.isComplete(exercise, payload as never)
    case "prompt-tag-fill":
      return PromptTagFillRunner.isComplete(exercise, payload as never)
    case "tool-description":
      return ToolDescriptionRunner.isComplete(exercise, payload as never)
    case "mcp-debug":
      return MCPDebugRunner.isComplete(exercise, payload as never)
    case "step-order-dnd":
      return StepOrderDndRunner.isComplete(exercise, payload as never)
    case "slot-fill-dnd":
      return SlotFillDndRunner.isComplete(exercise, payload as never)
    case "wiring-dnd":
      return WiringDndRunner.isComplete(exercise, payload as never)
    default:
      return false
  }
}

// Build the array of starter payloads once for all scenes. Some runners'
// .empty() needs the exercise to seed (e.g., step-order-dnd uses the steps
// array as the shuffle source), so we can't share a single empty value.
const buildInitialPayloads = (scenes: Exercise[]): (ExercisePayload | null)[] =>
  scenes.map(initialPayloadFor)

export function DailyQuestPlayer({
  questId,
  locale,
  scenes,
  initialPassed,
  date,
  hearts,
}: Props) {
  const t = useTranslations("practice.daily")
  const tLessons = useTranslations("lessons")
  const router = useRouter()
  const storeKey = storageKey(questId, date)

  // ---- Local state -------------------------------------------------------
  // `currentIdx` is the scene the player is on. `payloads[i]` is the user's
  // current answer to scene i. `sceneResults[i]` is the latest local
  // validate() outcome for scene i (null = not yet attempted).
  //
  // IMPORTANT: state is initialized with fresh values, NOT from
  // localStorage. Reading localStorage in the lazy initializer would
  // produce a different tree on the client than on the server (localStorage
  // is undefined during SSR), which throws "Hydration failed because the
  // server rendered HTML didn't match the client" and tears the daily
  // quest tree. localStorage is read inside a `useEffect` below, after the
  // initial paint, so the first render matches the server output and the
  // restore happens on the next commit.
  const [currentIdx, setCurrentIdx] = useState(0)
  const [payloads, setPayloads] = useState<(ExercisePayload | null)[]>(() =>
    buildInitialPayloads(scenes),
  )
  const [sceneResults, setSceneResults] = useState<(AttemptResult | null)[]>(
    () => scenes.map(() => null),
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // True once the server has confirmed the quest as a whole completed in
  // this session (covers replays where initialPassed was already true).
  const [committed, setCommitted] = useState(false)
  const [xpAwarded, setXpAwarded] = useState(0)
  // Bumps every time the user submits a scene so animate-attempt-* re-fires.
  const [attemptTick, setAttemptTick] = useState(0)
  // `hydrated` flips true after the post-mount restore effect runs. The
  // save effect waits on this so it doesn't overwrite persisted state with
  // the fresh state on the very first render.
  const [hydrated, setHydrated] = useState(false)
  // True once the user explicitly clicks "Repetir" on the success card for
  // an already-passed quest. Without this, the showSuccess condition keeps
  // firing on every render because `initialPassed` stays true across the
  // replay reset, trapping the user on the success card.
  const [replaying, setReplaying] = useState(false)

  // Restore in-flight progress from localStorage after mount. This is the
  // post-mount half of a hydration-safe persistence pattern: SSR renders
  // the fresh initial state (no localStorage on the server), the client
  // hydrates with that same fresh state to avoid a tree mismatch, then
  // this effect applies any persisted snapshot on the next commit.
  // setState inside the effect is intentional here — the React docs
  // explicitly allow it for syncing with an external store on mount, and
  // alternatives (useSyncExternalStore) require a stable snapshot we don't
  // have. The ESLint rule errs on the side of avoiding cascading renders,
  // which doesn't apply to a one-shot restore.
  useEffect(() => {
    if (initialPassed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHydrated(true)
      return
    }
    const persisted = loadPersisted(storeKey, scenes)
    if (persisted) {
      // The restored payloads may still hold the FAILING-payload from the
      // user's last attempt at a scene they were retrying. That's expected
      // and not a kind mismatch (kinds are validated inside loadPersisted).
      // Treat the restored snapshot as authoritative for in-flight progress.
      setCurrentIdx(persisted.currentIdx)
      setPayloads(persisted.payloads)
      setSceneResults(persisted.sceneResults)
    } else {
      // Either nothing was persisted or the snapshot was rejected as
      // stale (length / kind mismatch, corrupted JSON). Drop the storage
      // row so we don't keep re-loading and re-rejecting it on every
      // mount.
      clearPersisted(storeKey)
    }
    setHydrated(true)
    // `scenes` is read inside loadPersisted but intentionally excluded
    // from deps: the array identity is unstable across parent re-renders
    // (the page resolves a fresh quest object each request) yet its
    // content is pinned by storeKey (questId + date) — depending on
    // `scenes` would loop the effect every render and re-restore the
    // localStorage snapshot on top of the user's live state. Length is
    // tracked as a coarse signal in case the quest is re-authored.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeKey, initialPassed, scenes.length])

  const total = scenes.length
  const onLastScene = currentIdx === total - 1
  const exercise = scenes[currentIdx]
  const payload = payloads[currentIdx] ?? null
  const result = sceneResults[currentIdx]
  const scenePassed = result?.passed === true
  const sceneFailed = result !== null && result.passed === false
  // Live hearts tracked locally so we don't need a router.refresh after each
  // scene Comprobar — the server action returns the updated wallet and we
  // mirror it here. The HUD pill still reads from the server via the
  // revalidatePath inside the action. Sync from prop when the server-side
  // value shifts (router.refresh after replay / regen / shop purchase) using
  // the React "derived state" pattern instead of an effect: cheaper than a
  // cascading-render effect and gets flagged by the lint rule anyway.
  const [liveHearts, setLiveHearts] = useState(hearts)
  const [seenPropHearts, setSeenPropHearts] = useState(hearts)
  if (seenPropHearts !== hearts) {
    setSeenPropHearts(hearts)
    setLiveHearts(hearts)
  }
  // 0-hearts guard mirrors the lesson player: only applies when the quest
  // is NOT already passed today. Replays of a cleared daily stay free.
  const blockedByHearts = !initialPassed && liveHearts <= 0
  const ready =
    payload !== null &&
    !submitting &&
    isComplete(exercise, payload) &&
    !blockedByHearts

  // All scenes confirmed passed locally → safe to commit to the server.
  const allLocalPassed = sceneResults.every((r) => r?.passed === true)

  // Persist in-flight progress on every meaningful change. Gated on
  // `hydrated` so the very first render — when state is still the fresh
  // initial values — doesn't overwrite the persisted snapshot before the
  // restore effect has had a chance to run. We deliberately do NOT persist
  // `committed` or `xpAwarded` — those reflect server state and are
  // re-derived from `initialPassed` on next page load via the assignment
  // row.
  useEffect(() => {
    if (!hydrated) return
    if (committed || initialPassed) return
    savePersisted(storeKey, { currentIdx, payloads, sceneResults })
  }, [
    hydrated,
    committed,
    initialPassed,
    storeKey,
    currentIdx,
    payloads,
    sceneResults,
  ])

  // Focus the scene container whenever the player advances to a new scene.
  // Lets keyboard users tab into the new exercise without re-tabbing from
  // the top, and triggers AT announcement of the scene region.
  const sceneRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    sceneRef.current?.focus()
  }, [currentIdx])

  // ---- Handlers ----------------------------------------------------------

  const updateCurrentPayload = (next: ExercisePayload) => {
    setPayloads((prev) => {
      const out = prev.slice()
      out[currentIdx] = next
      return out
    })
    // Editing after a fail clears the fail so the runner stops looking red.
    if (result && !result.passed) {
      setSceneResults((prev) => {
        const out = prev.slice()
        out[currentIdx] = null
        return out
      })
    }
  }

  const onCheck = async () => {
    if (!payload || !ready) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await runDailyQuestScene({
        questId,
        locale,
        sceneIndex: currentIdx,
        payload,
      })
      if (!res.ok) {
        setError(t(`errors.${res.error}` as const))
        return
      }
      setSceneResults((prev) => {
        const out = prev.slice()
        // Server validate() only returns `{passed}` — the local UI doesn't
        // surface per-check feedback for daily scenes, so an empty `checks`
        // array is fine here.
        out[currentIdx] = { passed: res.passed, checks: [] }
        return out
      })
      setLiveHearts(res.hearts)
      setAttemptTick((c) => c + 1)
    } catch {
      setError(t("errors.network"))
    } finally {
      setSubmitting(false)
    }
  }

  const onContinue = () => {
    if (!scenePassed) return
    if (!onLastScene) {
      setCurrentIdx((i) => Math.min(i + 1, total - 1))
      return
    }
    void commit()
  }

  const commit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const finalPayloads = payloads.filter(
        (p): p is ExercisePayload => p !== null,
      )
      if (finalPayloads.length !== total) {
        setError(t("errors.invalid_input"))
        return
      }
      const res = await runDailyQuest({
        questId,
        locale,
        payloads: finalPayloads,
      })
      if (!res.ok) {
        setError(t(`errors.${res.error}` as const))
        return
      }
      if (!res.passed) {
        // Server replayed validation and disagreed with the client. Reset
        // results for any scene the server flagged, so the user can retry.
        setSceneResults(
          res.sceneResults.map((sr) => ({ passed: sr.passed, checks: [] })),
        )
        const firstFailed = res.sceneResults.findIndex((sr) => !sr.passed)
        if (firstFailed >= 0) setCurrentIdx(firstFailed)
        return
      }
      setCommitted(true)
      setXpAwarded(res.xpAwarded)
      // Quest is locked in server-side; drop in-flight progress so a
      // refresh doesn't accidentally restore the just-finished state into
      // a confusing replay.
      clearPersisted(storeKey)
      router.refresh()
    } catch {
      setError(t("errors.network"))
    } finally {
      setSubmitting(false)
    }
  }

  const onReplay = () => {
    setPayloads(buildInitialPayloads(scenes))
    setSceneResults(scenes.map(() => null))
    setCurrentIdx(0)
    setCommitted(false)
    setXpAwarded(0)
    setError(null)
    setReplaying(true)
    // The save effect would persist this fresh state on next render but
    // only after committed flips false, so explicitly clear once here too
    // to keep the storage strictly aligned with what the user sees.
    clearPersisted(storeKey)
  }

  // ---- Render ------------------------------------------------------------

  // Success state: full quest cleared (committed this session OR initially
  // already passed and the user hasn't opted into a replay yet).
  const showSuccess =
    committed ||
    (initialPassed &&
      !replaying &&
      currentIdx === 0 &&
      !sceneResults.some((r) => r?.passed))

  if (showSuccess) {
    return (
      <SuccessCard
        xpAwarded={xpAwarded}
        replayLabel={t("successCard.replay")}
        backLabel={t("footer.back")}
        titleText={
          committed ? t("successCard.titleFresh") : t("successCard.titleReplay")
        }
        bodyText={t("successCard.body", { count: total })}
        onReplay={onReplay}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <ProgressBar
        current={currentIdx + 1}
        total={total}
        progressLabel={t("progress", {
          current: currentIdx + 1,
          total,
        })}
      />

      <div
        key={`${currentIdx}-${attemptTick}`}
        ref={sceneRef}
        tabIndex={-1}
        role="group"
        aria-label={t("progress", { current: currentIdx + 1, total })}
        className={cn(
          "rounded-md outline-none focus-visible:ring-4 focus-visible:ring-primary-soft",
          attemptTick > 0 && scenePassed && "animate-attempt-pass",
          attemptTick > 0 && sceneFailed && "animate-attempt-shake",
        )}
      >
        {payload ? (
          <Runner
            exercise={exercise}
            value={payload}
            onChange={updateCurrentPayload}
            result={result}
          />
        ) : null}
      </div>

      {blockedByHearts ? (
        <Callout tone="danger" eyebrow={tLessons("zeroHearts.label")}>
          {tLessons.rich("zeroHearts.body", {
            workbench: (chunks) => (
              <Link
                href="/workbench"
                className="text-track-prompting underline underline-offset-2"
              >
                {chunks}
              </Link>
            ),
          })}
        </Callout>
      ) : null}

      {error ? (
        <p className="rounded-md border-2 border-danger bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}

      <footer className="flex items-center justify-between gap-3 border-t-2 border-line-soft pt-4">
        <Button
          render={<Link href="/practice" />}
          nativeButton={false}
          variant="outline"
          size="sm"
        >
          {t("footer.back")}
        </Button>
        <div className="flex items-center gap-3">
          {scenePassed ? (
            <Button
              type="button"
              onClick={onContinue}
              disabled={submitting}
              variant={onLastScene ? "default" : "track-tooling"}
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {onLastScene
                ? t("footer.finish")
                : t("footer.continue")}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onCheck}
              disabled={!ready}
              variant={sceneFailed ? "destructive" : "default"}
            >
              {sceneFailed
                ? t("footer.retry")
                : tLessons("footer.checkAnswer")}
            </Button>
          )}
          {allLocalPassed && !onLastScene ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
              {t("footer.allClearedHint")}
            </span>
          ) : null}
        </div>
      </footer>
    </div>
  )
}

// Progress bar across the top: filled blocks for cleared scenes, current
// scene as the leading edge, future scenes faded. Mirrors the Duolingo-style
// lesson progress strip. The visible label doubles as the ARIA label; the
// underlying segments are decorative (aria-hidden) and the parent carries
// `role="progressbar"` with current/total.
function ProgressBar({
  current,
  total,
  progressLabel,
}: {
  current: number
  total: number
  progressLabel: string
}) {
  return (
    <div
      className="flex flex-col gap-1.5"
      role="progressbar"
      aria-label={progressLabel}
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      <div className="flex items-center justify-between">
        <span
          aria-live="polite"
          className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3"
        >
          {progressLabel}
        </span>
      </div>
      <div className="flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => {
          const isDone = i < current - 1
          const isNow = i === current - 1
          return (
            <span
              key={i}
              className={cn(
                "h-2 flex-1 rounded-full bg-bg-sunken",
                isDone && "bg-success",
                isNow && "bg-primary",
              )}
            />
          )
        })}
      </div>
    </div>
  )
}

// Success card after the user clears the whole quest. Generic "you did it"
// celebration — no narrative outro yet (Phase 2). Shows XP if it was a
// fresh first-of-day pass, hides it on a replay (which grants 0 XP).
function SuccessCard({
  xpAwarded,
  replayLabel,
  backLabel,
  titleText,
  bodyText,
  onReplay,
}: {
  xpAwarded: number
  replayLabel: string
  backLabel: string
  titleText: string
  bodyText: string
  onReplay: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-success text-bg-deep shadow-elev-3">
        <CheckCircle2 className="size-9" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="font-display font-bold text-2xl leading-tight tracking-tight text-ink-1">
          {titleText}
        </h2>
        <p className="max-w-[40ch] font-sans text-sm font-semibold text-ink-3">
          {bodyText}
        </p>
        {xpAwarded > 0 ? (
          <span className="mt-1 font-mono text-base font-bold tabular-nums text-stat-xp">
            +{xpAwarded} XP
          </span>
        ) : null}
      </div>
      <div className="flex flex-row items-center gap-3">
        <Button variant="outline" size="sm" onClick={onReplay}>
          <RotateCcw className="size-3.5" strokeWidth={2.5} />
          {replayLabel}
        </Button>
        <Button
          render={<Link href="/practice" />}
          nativeButton={false}
          size="sm"
        >
          {backLabel}
        </Button>
      </div>
    </div>
  )
}

// Polymorphic dispatch for daily-quest-supported kinds. Each runner owns
// its own typing; the kind/value-kind alignment is enforced by the early
// return.
function Runner(props: {
  exercise: Exercise
  value: ExercisePayload
  onChange: (next: ExercisePayload) => void
  result: AttemptResult | null
}) {
  const { exercise, value, onChange, result } = props
  switch (exercise.kind) {
    case "prompt-anatomy":
      if (value.kind !== "prompt-anatomy") return null
      return (
        <PromptAnatomyRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
        />
      )
    case "prompt-AB":
      if (value.kind !== "prompt-AB") return null
      return (
        <PromptABRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
        />
      )
    case "prompt-tag-fill":
      if (value.kind !== "prompt-tag-fill") return null
      return (
        <PromptTagFillRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
        />
      )
    case "tool-description":
      if (value.kind !== "tool-description") return null
      return (
        <ToolDescriptionRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
        />
      )
    case "mcp-debug":
      if (value.kind !== "mcp-debug") return null
      return (
        <MCPDebugRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
        />
      )
    case "step-order-dnd":
      if (value.kind !== "step-order-dnd") return null
      return (
        <StepOrderDndRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
        />
      )
    case "slot-fill-dnd":
      if (value.kind !== "slot-fill-dnd") return null
      return (
        <SlotFillDndRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
        />
      )
    case "wiring-dnd":
      if (value.kind !== "wiring-dnd") return null
      return (
        <WiringDndRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
        />
      )
    default:
      return null
  }
}
