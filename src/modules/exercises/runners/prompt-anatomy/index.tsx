"use client"

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { ExerciseQuestion } from "@/common/components/exercise-question"
import { Eyebrow, FeedbackStrip } from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
import type { ExerciseAnatomy } from "@/modules/content/types"

import type { AnatomyPayload, AttemptResult } from "../../types"

type Props = {
  exercise: ExerciseAnatomy
  value: AnatomyPayload
  onChange: (next: AnatomyPayload) => void
  result: AttemptResult | null
}

const emptyPayload = (): AnatomyPayload => ({
  kind: "prompt-anatomy",
  assignments: {},
})

// Droppable id used by the bank zone. Anything starting with `slot:` is a
// part slot; everything else (i.e. this) means "return to bank".
const BANK_ID = "__anatomy-bank__"
const slotDroppableId = (partId: string) => `slot:${partId}`
const labelDraggableId = (label: string) => `label:${label}`

type ChipResult = "correct" | "wrong" | "neutral"

const chipResultClass = (state: ChipResult): string => {
  if (state === "correct") {
    return "bg-success-soft border-success text-ink-1"
  }
  if (state === "wrong") {
    return "bg-danger-soft border-danger text-ink-1"
  }
  return "bg-bg-raised border-line-strong text-ink-1"
}

function DraggableLabel({
  label,
  showResult,
  correct,
  locked,
}: {
  label: string
  showResult: boolean
  // For chips currently in a slot: green/red after submit.
  correct: boolean | null
  locked: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: labelDraggableId(label),
    disabled: locked,
  })
  const state: ChipResult =
    showResult && correct === true
      ? "correct"
      : showResult && correct === false
        ? "wrong"
        : "neutral"
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...(locked ? {} : listeners)}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border-2 px-3.5 py-1.5",
        "font-display font-bold text-xs uppercase tracking-[0.12em]",
        "shadow-[0_3px_0_0_rgba(0,0,0,0.5)] transition-[transform,box-shadow] duration-fast ease-out",
        locked ? "cursor-default" : "cursor-grab active:cursor-grabbing active:translate-y-[3px] active:shadow-none",
        chipResultClass(state),
      )}
      style={{ opacity: isDragging ? 0.3 : 1 }}
    >
      <span className="inline-block size-1.5 rounded-full bg-current opacity-70" />
      {label}
    </button>
  )
}

function DroppableSlot({
  partId,
  empty,
  children,
}: {
  partId: string
  empty: boolean
  children: React.ReactNode
}) {
  const { isOver, setNodeRef } = useDroppable({ id: slotDroppableId(partId) })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[52px] items-center gap-2 rounded-md border-2 px-3 py-2",
        "transition-[border-color,background-color] duration-fast ease-out",
        empty
          ? "border-dashed border-line-strong bg-bg-sunken"
          : "border-line-strong bg-bg-raised",
        isOver && "border-primary bg-primary-soft",
      )}
    >
      {children}
    </div>
  )
}

function BankZone({ children }: { children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: BANK_ID })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-md border-2 border-dashed bg-bg-sunken p-3",
        "transition-[border-color] duration-fast ease-out",
        isOver ? "border-primary" : "border-line-strong",
      )}
    >
      {children}
    </div>
  )
}

export function PromptAnatomyRunner({ exercise, value, onChange, result }: Props) {
  const t = useTranslations("lessons.anatomy")
  const showResult = Boolean(result)
  const passed = Boolean(result?.passed)

  const labels = useMemo(
    () =>
      Array.from(new Set(exercise.parts.map((p) => p.label))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [exercise.parts],
  )

  const wrongPartIds = useMemo(() => {
    if (!result) return new Set<string>()
    const r = result.checks.find((c) => c.id === "labels-correct")
    if (!r || r.passed || !r.reason?.startsWith("wrong:")) return new Set<string>()
    return new Set(r.reason.replace("wrong:", "").split(","))
  }, [result])

  // partId -> label
  const assignments = value.assignments
  // label -> partId (inverse, so we can find a label's current home)
  const partByLabel = useMemo(() => {
    const m = new Map<string, string>()
    for (const [partId, label] of Object.entries(assignments)) {
      if (label) m.set(label, partId)
    }
    return m
  }, [assignments])

  const labelsInBank = labels.filter((l) => !partByLabel.has(l))

  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id)
    if (id.startsWith("label:")) setActiveLabel(id.slice("label:".length))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLabel(null)
    const { active, over } = event
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)
    if (!activeId.startsWith("label:")) return
    const label = activeId.slice("label:".length)

    const next = { ...assignments }
    // Strip this label from its current slot (if any).
    for (const [pid, l] of Object.entries(next)) {
      if (l === label) delete next[pid]
    }

    if (overId === BANK_ID) {
      onChange({ kind: "prompt-anatomy", assignments: next })
      return
    }
    if (!overId.startsWith("slot:")) return
    const targetPartId = overId.slice("slot:".length)
    // Displace whatever label was sitting in the target slot — it returns to
    // the bank automatically (no entry in `next`).
    next[targetPartId] = label
    onChange({ kind: "prompt-anatomy", assignments: next })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>{t("kind")}</Eyebrow>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          {t("label")}
        </span>
      </div>
      <ExerciseQuestion text={t("question")} />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <BankZone>
          {labelsInBank.length === 0 ? (
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-ink-3">
              {t("bank")}
            </span>
          ) : (
            labelsInBank.map((label) => (
              <DraggableLabel
                key={label}
                label={label}
                showResult={false}
                correct={null}
                locked={passed}
              />
            ))
          )}
        </BankZone>

        <div className="flex flex-col gap-2">
          {exercise.parts.map((part) => {
            const chosen = assignments[part.id]
            const isWrong = wrongPartIds.has(part.id)
            // After a pass we know every assignment is correct; mark
            // individual chips green. Before submit / on fail (only red
            // chips highlighted), neutral chips just render as "placed".
            const chipCorrect =
              showResult && chosen
                ? passed
                  ? true
                  : isWrong
                    ? false
                    : null
                : null
            return (
              <div
                key={part.id}
                className="flex flex-col gap-2 rounded-md border-2 border-line-soft bg-bg-surface p-3"
              >
                <DroppableSlot partId={part.id} empty={!chosen}>
                  {chosen ? (
                    <DraggableLabel
                      label={chosen}
                      showResult={showResult}
                      correct={chipCorrect}
                      locked={passed}
                    />
                  ) : (
                    <span className="font-mono text-xs uppercase tracking-[0.12em] text-ink-3">
                      {t("slotEmpty")}
                    </span>
                  )}
                </DroppableSlot>
                <pre className="m-0 whitespace-pre-line font-mono text-xs leading-relaxed text-ink-2">
                  {part.text}
                </pre>
              </div>
            )
          })}
        </div>

        <DragOverlay>
          {activeLabel ? (
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border-2 px-3.5 py-1.5",
                "font-display font-bold text-xs uppercase tracking-[0.12em]",
                "bg-bg-raised border-line-strong text-ink-1 shadow-elev-3 cursor-grabbing",
              )}
            >
              <span className="inline-block size-1.5 rounded-full bg-current opacity-70" />
              {activeLabel}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {showResult ? (
        <FeedbackStrip
          tone={passed ? "success" : "error"}
          title={passed ? t("passed") : t("failed")}
        />
      ) : null}
    </div>
  )
}

PromptAnatomyRunner.empty = emptyPayload
PromptAnatomyRunner.isComplete = (
  exercise: ExerciseAnatomy,
  value: AnatomyPayload,
): boolean => exercise.parts.every((p) => Boolean(value.assignments[p.id]))
