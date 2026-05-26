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
import type { ExerciseSlotFillDnd } from "@/modules/content/types"

import type { AttemptResult, SlotFillDndPayload } from "../../types"

type Props = {
  exercise: ExerciseSlotFillDnd
  value: SlotFillDndPayload
  onChange: (next: SlotFillDndPayload) => void
  result: AttemptResult | null
}

const emptyPayload = (): SlotFillDndPayload => ({
  kind: "slot-fill-dnd",
  placements: {},
})

// The "bank" droppable id — when a piece is dropped here, it returns to the
// piece bank (removed from whichever slot it occupied).
const BANK_ID = "__bank__"

type PieceTone = "neutral" | "correct" | "wrong"

const pieceToneClass = (tone: PieceTone): string => {
  if (tone === "correct") return "bg-success-soft border-success text-ink-1"
  if (tone === "wrong") return "bg-danger-soft border-danger text-ink-1"
  return "bg-bg-raised border-line-strong text-ink-1"
}

function DraggablePiece({
  id,
  label,
  showResult,
  locked,
  correct,
}: {
  id: string
  label: string
  showResult: boolean
  locked: boolean
  correct: boolean | null
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled: locked,
  })
  const tone: PieceTone =
    showResult && correct === true
      ? "correct"
      : showResult && correct === false
        ? "wrong"
        : "neutral"

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...(locked ? {} : listeners)}
      className={cn(
        "inline-flex items-center rounded-md border-2 px-3 py-1.5",
        "font-display font-bold text-xs uppercase tracking-[0.12em]",
        "shadow-[0_3px_0_0_rgba(0,0,0,0.5)] transition-[transform,box-shadow] duration-fast ease-out",
        locked
          ? "cursor-default"
          : "cursor-grab active:cursor-grabbing active:translate-y-[3px] active:shadow-none",
        pieceToneClass(tone),
      )}
      style={{ opacity: isDragging ? 0.3 : 1 }}
    >
      {label}
    </div>
  )
}

function DroppableSlot({
  id,
  label,
  children,
  empty,
}: {
  id: string
  label: string
  children: React.ReactNode
  empty: boolean
}) {
  const { isOver, setNodeRef } = useDroppable({ id })
  return (
    <div className="flex flex-col gap-1.5">
      <Eyebrow>{label}</Eyebrow>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[56px] flex-wrap items-center gap-2 rounded-md border-2 px-3 py-2",
          "transition-[border-color,background-color] duration-fast ease-out",
          empty
            ? "border-dashed border-line-strong bg-bg-sunken"
            : "border-line-strong bg-bg-raised",
          isOver && "border-primary bg-primary-soft",
        )}
      >
        {children}
      </div>
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

export function SlotFillDndRunner({
  exercise,
  value,
  onChange,
  result,
}: Props) {
  const t = useTranslations("lessons.slotFillDnd")
  const tShared = useTranslations("lessons.assemble")
  const showResult = Boolean(result)
  const passed = Boolean(result?.passed)

  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  const pieceById = new Map(exercise.pieces.map((p) => [p.id, p]))

  const piecesBySlot = new Map<string, string[]>()
  for (const slot of exercise.slots) piecesBySlot.set(slot.id, [])
  for (const piece of exercise.pieces) {
    const slotId = value.placements[piece.id]
    if (slotId && piecesBySlot.has(slotId)) {
      piecesBySlot.get(slotId)!.push(piece.id)
    }
  }

  const piecesInBank = exercise.pieces.filter((p) => !value.placements[p.id])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const pieceId = String(active.id)
    const dest = String(over.id)

    const placements = { ...value.placements }

    if (dest === BANK_ID) {
      delete placements[pieceId]
      onChange({ kind: "slot-fill-dnd", placements })
      return
    }

    placements[pieceId] = dest
    onChange({ kind: "slot-fill-dnd", placements })
  }

  const correctnessOfPlacement = (slotId: string, pieceId: string): boolean => {
    const piece = pieceById.get(pieceId)
    if (!piece) return false
    return piece.correctSlot === slotId
  }

  const activePiece = activeId ? pieceById.get(activeId) : null

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
        <div className="flex flex-col gap-3">
          {exercise.slots.map((slot) => {
            const pieceIds = piecesBySlot.get(slot.id) ?? []
            return (
              <DroppableSlot
                key={slot.id}
                id={slot.id}
                label={slot.label}
                empty={pieceIds.length === 0}
              >
                {pieceIds.length === 0 ? (
                  <span className="font-mono text-xs uppercase tracking-[0.12em] text-ink-3">
                    {t("dropHere")}
                  </span>
                ) : (
                  pieceIds.map((pieceId) => {
                    const piece = pieceById.get(pieceId)
                    if (!piece) return null
                    const correct = showResult
                      ? correctnessOfPlacement(slot.id, pieceId)
                      : null
                    return (
                      <DraggablePiece
                        key={piece.id}
                        id={piece.id}
                        label={piece.label}
                        showResult={showResult}
                        locked={passed}
                        correct={correct}
                      />
                    )
                  })
                )}
              </DroppableSlot>
            )
          })}
        </div>

        <div className="flex flex-col gap-2">
          <Eyebrow>{t("bank")}</Eyebrow>
          <BankZone>
            {piecesInBank.length === 0 ? (
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-ink-3">
                {t("bankEmpty")}
              </span>
            ) : (
              piecesInBank.map((p) => (
                <DraggablePiece
                  key={p.id}
                  id={p.id}
                  label={p.label}
                  showResult={showResult}
                  locked={passed}
                  correct={null}
                />
              ))
            )}
          </BankZone>
        </div>

        <DragOverlay>
          {activePiece ? (
            <div
              className={cn(
                "inline-flex items-center rounded-md border-2 px-3 py-1.5",
                "font-display font-bold text-xs uppercase tracking-[0.12em]",
                "bg-bg-raised border-line-strong text-ink-1 shadow-elev-3 cursor-grabbing",
              )}
            >
              {activePiece.label}
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

SlotFillDndRunner.empty = emptyPayload
SlotFillDndRunner.isComplete = (
  exercise: ExerciseSlotFillDnd,
  payload: SlotFillDndPayload,
): boolean => {
  return exercise.pieces.every((p) => Boolean(payload.placements[p.id]))
}
