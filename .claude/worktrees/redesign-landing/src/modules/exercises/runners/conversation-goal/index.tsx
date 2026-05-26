"use client"

import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

import type { ExerciseConversationGoal } from "@/modules/content/types"

import { sendChatTurn } from "../../actions"
import type { AttemptResult, ChatMessage, ConversationGoalPayload } from "../../types"

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

const personaInitials = (name: string): string => {
  const trimmed = name.trim()
  if (!trimmed) return "AI"
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

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
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [turnError, setTurnError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Seed the transcript with the persona's opener if state is empty.
  // Defensive: if the runner mounts before StepShell sets the seeded
  // value, we propagate the opener up.
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
  const canSend = !sending && !submitting && draft.trim().length > 0 && turnsLeft > 0
  const personaName = exercise.personaName ?? t("defaultPersonaName")
  const botInitials = personaInitials(personaName)

  const onSend = async () => {
    if (!canSend) return
    const userMsg: ChatMessage = { role: "user", content: draft.trim() }
    const next: ConversationGoalPayload = {
      kind: "conversation-goal",
      transcript: [...value.transcript, userMsg],
    }
    onChange(next)
    setDraft("")
    setSending(true)
    setTurnError(null)
    try {
      const res = await sendChatTurn({
        ...stepRef,
        locale,
        transcript: next.transcript,
      })
      if (res.ok) {
        onChange({
          kind: "conversation-goal",
          transcript: [...next.transcript, res.reply],
        })
      } else {
        setTurnError(t(`errors.${res.error}` as never) ?? t("errors.model_error"))
      }
    } catch {
      setTurnError(t("errors.network"))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="exer-head">
        <span className="kind">{tConvo("kind")}</span>
        <span className="lab">{tConvo("label")}</span>
      </div>

      <div className="cg-goal">
        <span className="lab">{t("goalLabel")}</span>
        <div style={{ fontSize: 13, color: "var(--fg)", whiteSpace: "pre-line" }}>
          {exercise.goal}
        </div>
        <span className="progress">
          {t("turnsLeft", { count: turnsLeft })}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="cg-stream"
        style={{ maxHeight: 320 }}
      >
        {value.transcript.length === 0 ? (
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--fg-muted)" }}>
            {t("emptyTranscript")}
          </div>
        ) : (
          value.transcript.map((m, i) => (
            <div
              key={i}
              className={"cg-msg " + (m.role === "user" ? "you" : "vega")}
            >
              <div className="av">{m.role === "user" ? "TU" : botInitials}</div>
              <div className="b" style={{ whiteSpace: "pre-line" }}>{m.content}</div>
            </div>
          ))
        )}
        {sending ? (
          <div className="cg-msg vega">
            <div className="av">{botInitials}</div>
            <div
              className="b"
              style={{ opacity: 0.65, fontStyle: "italic" }}
            >
              {t("typing", { name: personaName })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="cg-input-row">
        <input
          className="cg-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              onSend()
            }
          }}
          placeholder={
            turnsLeft > 0
              ? t("inputPlaceholder")
              : t("noTurnsLeft")
          }
          disabled={turnsLeft === 0 || submitting}
        />
        <button
          type="button"
          className="cg-send"
          onClick={onSend}
          disabled={!canSend}
          aria-label={t("send")}
          style={!canSend ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
        >
          {sending ? "…" : "↑"}
        </button>
      </div>

      {turnError ? (
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: "var(--destructive, #f87171)",
          }}
        >
          {turnError}
        </div>
      ) : null}

      {result ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--fg-dim)",
            }}
          >
            {t("evaluation")}
          </span>
          {result.checks.map((c) => (
            <div
              key={c.id}
              style={{
                borderRadius: 10,
                border: c.passed
                  ? "1px solid var(--crew-green)"
                  : "1px solid var(--mission-magenta)",
                background: c.passed
                  ? "oklch(0.72 0.16 145 / 12%)"
                  : "oklch(0.66 0.22 340 / 10%)",
                padding: "8px 12px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--brand-cyan)",
                  letterSpacing: "0.08em",
                }}
              >
                {c.passed ? "✓ " : "× "}
                {c.id}
              </div>
              {c.reason ? (
                <div style={{ fontSize: 13, color: "var(--fg)", marginTop: 2 }}>
                  {c.reason}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </>
  )
}

ConversationGoalRunner.empty = emptyPayload
ConversationGoalRunner.isComplete = (
  exercise: ExerciseConversationGoal,
  value: ConversationGoalPayload,
): boolean => {
  // Need at least 1 user message + 1 assistant response.
  const userTurns = value.transcript.filter((m) => m.role === "user").length
  const assistantTurns = value.transcript.filter((m) => m.role === "assistant").length
  void exercise
  return userTurns >= 1 && assistantTurns >= 1
}
