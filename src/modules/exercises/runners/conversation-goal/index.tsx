"use client"

import { useUser } from "@clerk/nextjs"
import { ArrowUp } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

import { ChatMessage as ChatMessageBubble } from "@/common/components/chat-message"
import { ExerciseMarkdown } from "@/common/components/exercise-markdown"
import {
  Button,
  Eyebrow,
  Input,
  RubricCheck,
} from "@/common/components/ui"
import type { ExerciseConversationGoal } from "@/modules/content/types"

import { sendChatTurn } from "../../actions"
import type {
  AttemptResult,
  ChatMessage,
  ConversationGoalPayload,
} from "../../types"

type Props = {
  exercise: ExerciseConversationGoal
  value: ConversationGoalPayload
  onChange: (next: ConversationGoalPayload) => void
  result: AttemptResult | null
  // True while the FINAL evaluation (Comprobar) is running. Per-turn sends
  // use their own internal `sending` state.
  submitting: boolean
  // Step ref needed for the per-turn server action.
  stepRef: { trackSlug: string; courseSlug: string; stepSlug: string }
  locale: string
}

const initialTranscript = (exercise: ExerciseConversationGoal): ChatMessage[] =>
  exercise.personaOpener
    ? [{ role: "assistant", content: exercise.personaOpener }]
    : []

const emptyPayload = (
  exercise?: ExerciseConversationGoal,
): ConversationGoalPayload => ({
  kind: "conversation-goal",
  transcript: exercise ? initialTranscript(exercise) : [],
})

export function ConversationGoalRunner({
  exercise,
  value,
  onChange,
  result,
  submitting,
  stepRef,
  locale,
}: Props) {
  const t = useTranslations("lessons.conversation")
  const tConvo = useTranslations("lessons.convo")
  const { user } = useUser()
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [turnError, setTurnError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Seed the transcript with the persona's opener if state is empty.
  useEffect(() => {
    if (value.transcript.length === 0 && exercise.personaOpener) {
      onChange({
        kind: "conversation-goal",
        transcript: initialTranscript(exercise),
      })
    }
  }, [exercise, value.transcript.length, onChange])

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [value.transcript.length, sending])

  const userTurns = value.transcript.filter((m) => m.role === "user").length
  const turnsLeft = exercise.maxTurns - userTurns
  const canSend =
    !sending && !submitting && draft.trim().length > 0 && turnsLeft > 0
  const personaName = exercise.personaName ?? t("defaultPersonaName")
  const personaSlug = exercise.personaSlug

  const onSend = async () => {
    if (!canSend) return
    const trimmed = draft.trim()
    const userMsg: ChatMessage = { role: "user", content: trimmed }
    const optimisticTranscript = [...value.transcript, userMsg]
    onChange({ kind: "conversation-goal", transcript: optimisticTranscript })
    setDraft("")
    setSending(true)
    setTurnError(null)
    try {
      const res = await sendChatTurn({
        ...stepRef,
        locale,
        transcript: optimisticTranscript,
      })
      if (res.ok) {
        onChange({
          kind: "conversation-goal",
          transcript: [...optimisticTranscript, res.reply],
        })
        return
      }
      onChange({ kind: "conversation-goal", transcript: value.transcript })
      setDraft(trimmed)
      const knownErrors = [
        "rate_limited",
        "model_error",
        "unauthorized",
        "invalid_input",
        "not_found",
        "wrong_kind",
        "max_turns_exceeded",
      ] as const
      type KnownError = (typeof knownErrors)[number]
      const isKnown = (e: string): e is KnownError =>
        (knownErrors as readonly string[]).includes(e)
      setTurnError(
        isKnown(res.error)
          ? t(`errors.${res.error}`)
          : t("errors.model_error"),
      )
    } catch {
      onChange({ kind: "conversation-goal", transcript: value.transcript })
      setDraft(trimmed)
      setTurnError(t("errors.network"))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>{tConvo("kind")}</Eyebrow>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          {tConvo("label")}
        </span>
      </div>

      <div className="flex flex-col gap-2 rounded-md border-2 border-line-soft bg-bg-raised p-4">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow className="text-stat-xp">{t("goalLabel")}</Eyebrow>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
            {t("turnsLeft", { count: turnsLeft })}
          </span>
        </div>
        <ExerciseMarkdown
          text={exercise.goal}
          className="font-sans text-sm font-semibold leading-relaxed text-ink-1"
        />
      </div>

      <div
        ref={scrollRef}
        className="flex max-h-[360px] flex-col gap-3 overflow-y-auto rounded-md border-2 border-line-soft bg-bg-sunken p-4"
      >
        {value.transcript.length === 0 ? (
          <div className="text-center font-mono text-xs uppercase tracking-[0.12em] text-ink-3">
            {t("emptyTranscript")}
          </div>
        ) : (
          value.transcript.map((m, i) => (
            <ChatMessageBubble
              key={i}
              role={m.role}
              content={m.content}
              userImageUrl={user?.imageUrl}
              userName={user?.firstName ?? user?.username ?? null}
              personaSlug={personaSlug}
              personaName={personaName}
            />
          ))
        )}
        {sending ? (
          <ChatMessageBubble
            role="assistant"
            content={t("typing", { name: personaName })}
            personaSlug={personaSlug}
            personaName={personaName}
            pending
          />
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              onSend()
            }
          }}
          placeholder={
            turnsLeft > 0 ? t("inputPlaceholder") : t("noTurnsLeft")
          }
          disabled={turnsLeft === 0 || submitting}
        />
        <Button
          type="button"
          size="icon"
          onClick={onSend}
          disabled={!canSend}
          aria-label={t("send")}
        >
          {sending ? (
            <span className="font-display font-bold">…</span>
          ) : (
            <ArrowUp className="size-4" strokeWidth={2.5} />
          )}
        </Button>
      </div>

      {turnError ? (
        <div className="font-sans text-xs font-semibold text-danger">
          {turnError}
        </div>
      ) : null}

      {result ? (
        <div className="flex flex-col gap-2">
          <Eyebrow>{t("evaluation")}</Eyebrow>
          {result.checks.map((c) => (
            <RubricCheck
              key={c.id}
              state={c.passed ? "passed" : "failed"}
              label={c.id}
              hint={c.reason ?? undefined}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

ConversationGoalRunner.empty = emptyPayload
ConversationGoalRunner.isComplete = (
  exercise: ExerciseConversationGoal,
  value: ConversationGoalPayload,
): boolean => {
  // Need at least 1 user message + 1 assistant response.
  const userTurns = value.transcript.filter((m) => m.role === "user").length
  const assistantTurns = value.transcript.filter(
    (m) => m.role === "assistant",
  ).length
  void exercise
  return userTurns >= 1 && assistantTurns >= 1
}
