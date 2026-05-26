"use client"

import { BookOpen, Clock3 } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Eyebrow,
} from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { cn } from "@/common/lib/utils"

import type { CrewLessonRef } from "../lessons"

type Props = {
  characterName: string
  lessons: CrewLessonRef[]
  triggerClassName?: string
  children: React.ReactNode
}

export function CrewLessonsDialog({
  characterName,
  lessons,
  triggerClassName,
  children,
}: Props) {
  const t = useTranslations("crew.lessonsDialog")

  return (
    <Dialog>
      <DialogTrigger
        type="button"
        aria-label={t("triggerAria", { name: characterName })}
        className={cn(
          "group outline-none focus-visible:ring-4 focus-visible:ring-primary-soft",
          triggerClassName,
        )}
      >
        {children}
      </DialogTrigger>
      <DialogContent className="max-h-[86vh] max-w-2xl overflow-hidden p-0">
        <DialogHeader className="border-b-2 border-line-soft p-5 pr-14">
          <Eyebrow className="text-primary">
            {t("eyebrow", { count: lessons.length })}
          </Eyebrow>
          <DialogTitle>{t("title", { name: characterName })}</DialogTitle>
          <DialogDescription>
            {t("description", { name: characterName })}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {lessons.length === 0 ? (
            <p className="font-sans text-sm font-semibold text-ink-3">
              {t("empty", { name: characterName })}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {lessons.map((lesson) => (
                <li key={lesson.id}>
                  <Link
                    href={lesson.href}
                    className="grid gap-2 rounded-md border-2 border-line-soft bg-bg-raised p-4 text-left outline-none transition-colors hover:border-primary/60 hover:bg-primary-soft/30 focus-visible:ring-4 focus-visible:ring-primary-soft"
                  >
                    <span className="flex min-w-0 items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate font-display text-base font-bold leading-tight text-ink-1">
                          {lesson.title}
                        </span>
                        <span className="mt-1 block font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3">
                          {lesson.trackTitle} · {lesson.courseTitle}
                        </span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-bg-sunken px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-ink-3 shadow-elev-inset">
                        <Clock3 className="size-3" strokeWidth={2.5} />
                        {t("minutes", { minutes: lesson.estimatedMinutes })}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                      <BookOpen className="size-3.5" strokeWidth={2.5} />
                      {t("open")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
