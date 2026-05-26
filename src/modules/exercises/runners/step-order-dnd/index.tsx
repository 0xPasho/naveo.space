"use client"

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { ExerciseQuestion } from "@/common/components/exercise-question"
import { Eyebrow, FeedbackStrip } from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
import type { ExerciseStepOrderDnd } from "@/modules/content/types"

import type { AttemptResult, StepOrderDndPayload } from "../../types"

type Props = {
  exercise: ExerciseStepOrderDnd
  value: StepOrderDndPayload
  onChange: (next: StepOrderDndPayload) => void
  result: AttemptResult | null
}

const stringHash = (s: string): number => {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i)
  return h | 0
}

const stableShuffle = (ids: string[]): string[] => {
  if (ids.length <= 1) return [...ids]
  const sorted = [...ids].sort((a, b) => stringHash(a) - stringHash(b))
  if (sorted.every((id, i) => id === ids[i])) {
    return [...sorted.slice(1), sorted[0]!]
  }
  return sorted
}

const emptyPayload = (
  exercise: ExerciseStepOrderDnd,
): StepOrderDndPayload => ({
  kind: "step-order-dnd",
  order: stableShuffle(exercise.steps.map((s) => s.id)),
})

type Item = { id: string; label: string; detail?: string }
type RowState = "neutral" | "correct" | "wrong"

const rowStateClass = (state: RowState): string => {
  if (state === "correct") {
    return "bg-success-soft border-success"
  }
  if (state === "wrong") {
    return "bg-danger-soft border-danger"
  }
  return "bg-bg-surface border-line-strong"
}

const numClass = (state: RowState): string => {
  if (state === "correct") return "bg-success border-success text-bg-deep"
  if (state === "wrong") return "bg-danger border-danger text-white"
  return "bg-bg-raised border-line-strong text-ink-3"
}

function SortableRow({
  item,
  index,
  positionState,
  showResult,
  locked,
}: {
  item: Item
  index: number
  positionState: RowState
  showResult: boolean
  locked: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: locked })

  const transformStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  } as const

  const state = showResult ? positionState : "neutral"
  const eyebrowToneClass =
    showResult && positionState === "correct"
      ? "text-success"
      : "text-stat-xp"

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-md border-2 p-3.5",
        "shadow-[0_3px_0_0_rgba(0,0,0,0.45)] transition-[transform,box-shadow,border-color,background-color] duration-fast ease-out",
        locked ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        rowStateClass(state),
      )}
      style={transformStyle}
      {...attributes}
      {...(locked ? {} : listeners)}
    >
      <div
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-full border-2 font-display font-bold text-sm",
          numClass(state),
        )}
      >
        {index + 1}
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <div
          className={cn(
            "font-display font-bold text-[10px] uppercase tracking-[0.14em]",
            eyebrowToneClass,
          )}
        >
          {item.label}
        </div>
        {item.detail ? (
          <div className="whitespace-pre-line font-sans text-sm font-semibold text-ink-1">
            {item.detail}
          </div>
        ) : null}
      </div>
      <div
        className="font-mono text-base text-ink-3"
        aria-hidden="true"
      >
        ⋮⋮
      </div>
    </div>
  )
}

export function StepOrderDndRunner({
  exercise,
  value,
  onChange,
  result,
}: Props) {
  const t = useTranslations("lessons.stepOrderDnd")
  const tShared = useTranslations("lessons.assemble")
  const showResult = Boolean(result)
  const passed = Boolean(result?.passed)
  const locked = passed

  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const itemById = new Map(exercise.steps.map((s) => [s.id, s]))
  const correctIndexById = new Map(
    exercise.steps.map((s, i) => [s.id, i]),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = value.order.indexOf(String(active.id))
    const newIndex = value.order.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    onChange({
      kind: "step-order-dnd",
      order: arrayMove(value.order, oldIndex, newIndex),
    })
  }

  const activeItem = activeId ? itemById.get(activeId) : null

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
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={value.order}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2.5">
            {value.order.map((id, i) => {
              const item = itemById.get(id)
              if (!item) return null
              const isCorrectPos = correctIndexById.get(id) === i
              const positionState: RowState = showResult
                ? isCorrectPos
                  ? "correct"
                  : "wrong"
                : "neutral"
              return (
                <SortableRow
                  key={id}
                  item={item}
                  index={i}
                  positionState={positionState}
                  showResult={showResult}
                  locked={locked}
                />
              )
            })}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeItem ? (
            <div
              className={cn(
                "grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-md border-2 p-3.5",
                "bg-bg-surface border-line-strong shadow-elev-3 cursor-grabbing",
              )}
            >
              <div className="inline-flex size-7 items-center justify-center rounded-full border-2 border-line-strong bg-bg-raised font-display font-bold text-sm text-ink-3">
                ·
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <div className="font-display font-bold text-[10px] uppercase tracking-[0.14em] text-stat-xp">
                  {activeItem.label}
                </div>
                {activeItem.detail ? (
                  <div className="font-sans text-sm font-semibold text-ink-1">
                    {activeItem.detail}
                  </div>
                ) : null}
              </div>
              <div className="font-mono text-base text-ink-3" aria-hidden>
                ⋮⋮
              </div>
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

StepOrderDndRunner.empty = emptyPayload
StepOrderDndRunner.isComplete = (
  exercise: ExerciseStepOrderDnd,
  payload: StepOrderDndPayload,
): boolean => payload.order.length === exercise.steps.length
