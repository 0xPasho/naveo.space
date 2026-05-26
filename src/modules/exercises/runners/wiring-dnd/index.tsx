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
import { useState } from "react"

import { ExerciseQuestion } from "@/common/components/exercise-question"
import { Eyebrow, FeedbackStrip } from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
import type { ExerciseWiringDnd } from "@/modules/content/types"

import type { AttemptResult, WiringDndPayload } from "../../types"

type Props = {
  exercise: ExerciseWiringDnd
  value: WiringDndPayload
  onChange: (next: WiringDndPayload) => void
  result: AttemptResult | null
}

const emptyPayload = (): WiringDndPayload => ({
  kind: "wiring-dnd",
  connections: [],
})

const edgeKey = (e: { from: string; to: string }) => `${e.from}→${e.to}`

type TargetState = "neutral" | "all-correct" | "has-wrong" | "missing"

function DraggableSource({
  id,
  label,
  detail,
  locked,
}: {
  id: string
  label: string
  detail?: string
  locked: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `src:${id}`,
    disabled: locked,
  })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...(locked ? {} : listeners)}
      className={cn(
        "flex flex-col gap-1 rounded-md border-2 border-line-strong bg-bg-raised p-3",
        "shadow-[0_3px_0_0_rgba(0,0,0,0.5)] transition-[transform,box-shadow] duration-fast ease-out",
        locked
          ? "cursor-default"
          : "cursor-grab active:cursor-grabbing active:translate-y-[3px] active:shadow-none",
      )}
      style={{ opacity: isDragging ? 0.3 : 1 }}
    >
      <div className="font-display font-bold text-sm text-ink-1">{label}</div>
      {detail ? (
        <div className="font-sans text-xs font-semibold text-ink-3">{detail}</div>
      ) : null}
    </div>
  )
}

function DroppableTarget({
  id,
  label,
  detail,
  connections,
  result,
  locked,
  removeLabel,
  onRemove,
}: {
  id: string
  label: string
  detail?: string
  connections: { sourceId: string; sourceLabel: string }[]
  result: TargetState
  locked: boolean
  removeLabel: string
  onRemove: (sourceId: string) => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `tgt:${id}` })

  const stateClass =
    result === "all-correct"
      ? "border-success bg-success-soft"
      : result === "has-wrong" || result === "missing"
        ? "border-danger bg-danger-soft"
        : isOver
          ? "border-primary bg-primary-soft"
          : "border-line-strong bg-bg-surface"

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2 rounded-md border-2 p-3",
        "transition-[border-color,background-color] duration-fast ease-out",
        stateClass,
      )}
    >
      <div className="font-display font-bold text-sm text-ink-1">{label}</div>
      {detail ? (
        <div className="font-sans text-xs font-semibold text-ink-3">{detail}</div>
      ) : null}
      {connections.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {connections.map((c) =>
            locked ? (
              <span
                key={c.sourceId}
                className="inline-flex items-center gap-1 rounded-full bg-bg-raised px-2.5 py-1 font-display font-bold text-[10px] uppercase tracking-[0.12em] text-ink-1"
              >
                {c.sourceLabel}
              </span>
            ) : (
              <button
                key={c.sourceId}
                type="button"
                onClick={() => onRemove(c.sourceId)}
                aria-label={`${removeLabel} · ${c.sourceLabel}`}
                title={removeLabel}
                className="inline-flex items-center gap-1.5 rounded-full bg-bg-raised px-2.5 py-1 font-display font-bold text-[10px] uppercase tracking-[0.12em] text-ink-1 hover:bg-bg-deep"
              >
                <span>{c.sourceLabel}</span>
                <span aria-hidden className="text-ink-3">
                  ×
                </span>
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  )
}

export function WiringDndRunner({
  exercise,
  value,
  onChange,
  result,
}: Props) {
  const t = useTranslations("lessons.wiringDnd")
  const tShared = useTranslations("lessons.assemble")
  const showResult = Boolean(result)
  const passed = Boolean(result?.passed)

  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  const sourceById = new Map(exercise.sources.map((s) => [s.id, s]))
  const targetById = new Map(exercise.targets.map((t) => [t.id, t]))
  const expected = new Set(exercise.correctConnections.map(edgeKey))

  const connectionsByTarget = new Map<string, string[]>()
  for (const conn of value.connections) {
    const list = connectionsByTarget.get(conn.to) ?? []
    list.push(conn.from)
    connectionsByTarget.set(conn.to, list)
  }

  const targetResultState = (targetId: string): TargetState => {
    if (!showResult) return "neutral"
    const actualFrom = connectionsByTarget.get(targetId) ?? []
    const expectedFrom = exercise.correctConnections
      .filter((c) => c.to === targetId)
      .map((c) => c.from)
    const actualSet = new Set(actualFrom)
    const expectedSet = new Set(expectedFrom)
    const allMatch =
      actualSet.size === expectedSet.size &&
      [...expectedSet].every((id) => actualSet.has(id))
    if (allMatch) return "all-correct"
    const hasExtra = [...actualSet].some((id) => !expectedSet.has(id))
    if (hasExtra) return "has-wrong"
    return "missing"
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)
    if (!activeIdStr.startsWith("src:") || !overIdStr.startsWith("tgt:")) return
    const from = activeIdStr.slice(4)
    const to = overIdStr.slice(4)
    const key = edgeKey({ from, to })
    if (value.connections.some((c) => edgeKey(c) === key)) return
    onChange({
      kind: "wiring-dnd",
      connections: [...value.connections, { from, to }],
    })
  }

  const removeConnection = (from: string, to: string) => {
    if (passed) return
    onChange({
      kind: "wiring-dnd",
      connections: value.connections.filter(
        (c) => !(c.from === from && c.to === to),
      ),
    })
  }

  const activeSourceId = activeId?.startsWith("src:")
    ? activeId.slice(4)
    : null
  const activeSource = activeSourceId ? sourceById.get(activeSourceId) : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>{t("kind")}</Eyebrow>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          {t("label")}
        </span>
      </div>

      <ExerciseQuestion text={exercise.task} />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Eyebrow>{t("sources")}</Eyebrow>
            {exercise.sources.map((s) => (
              <DraggableSource
                key={s.id}
                id={s.id}
                label={s.label}
                detail={s.detail}
                locked={passed}
              />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Eyebrow>{t("targets")}</Eyebrow>
            {exercise.targets.map((tgt) => {
              const connectedFromIds = connectionsByTarget.get(tgt.id) ?? []
              const connections = connectedFromIds.map((sourceId) => ({
                sourceId,
                sourceLabel: sourceById.get(sourceId)?.label ?? sourceId,
              }))
              return (
                <DroppableTarget
                  key={tgt.id}
                  id={tgt.id}
                  label={tgt.label}
                  detail={tgt.detail}
                  connections={connections}
                  result={targetResultState(tgt.id)}
                  locked={passed}
                  removeLabel={t("removeConnection")}
                  onRemove={(sourceId) => removeConnection(sourceId, tgt.id)}
                />
              )
            })}
          </div>
        </div>

        {value.connections.length > 0 ? (
          <div className="flex flex-col gap-2 rounded-md border-2 border-line-soft bg-bg-surface p-3">
            <Eyebrow>{t("connections")}</Eyebrow>
            <ul className="flex flex-col gap-1.5">
              {value.connections.map((c) => {
                const isCorrect = expected.has(edgeKey(c))
                const toneClass = !showResult
                  ? "text-ink-1"
                  : isCorrect
                    ? "text-success"
                    : "text-danger"
                return (
                  <li
                    key={edgeKey(c)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md border-2 border-line-strong bg-bg-raised px-3 py-1.5",
                      "font-sans text-sm font-semibold",
                      toneClass,
                    )}
                  >
                    <span>
                      {sourceById.get(c.from)?.label ?? c.from}
                      <span className="px-1 text-ink-3"> → </span>
                      {targetById.get(c.to)?.label ?? c.to}
                    </span>
                    {!showResult ? (
                      <button
                        type="button"
                        className="font-mono text-base text-ink-3 hover:text-ink-1"
                        onClick={() => removeConnection(c.from, c.to)}
                        aria-label={t("removeConnection")}
                      >
                        ×
                      </button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

        <DragOverlay>
          {activeSource ? (
            <div
              className={cn(
                "flex flex-col gap-1 rounded-md border-2 border-line-strong bg-bg-raised p-3",
                "shadow-elev-3 cursor-grabbing",
              )}
            >
              <div className="font-display font-bold text-sm text-ink-1">
                {activeSource.label}
              </div>
              {activeSource.detail ? (
                <div className="font-sans text-xs font-semibold text-ink-3">
                  {activeSource.detail}
                </div>
              ) : null}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {showResult ? (
        <FeedbackStrip
          tone={passed ? "success" : "error"}
          title={passed ? tShared("passed") : tShared("failed")}
        />
      ) : null}
    </div>
  )
}

WiringDndRunner.empty = emptyPayload
WiringDndRunner.isComplete = (
  exercise: ExerciseWiringDnd,
  payload: WiringDndPayload,
): boolean => {
  return payload.connections.length > 0
}
