import { Bolt, Lock, Star } from "lucide-react"
import type { CSSProperties } from "react"
import { getTranslations } from "next-intl/server"

import {
  Button,
  Card,
  Chip,
  ChunkyProgress,
  Eyebrow,
} from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { cn } from "@/common/lib/utils"
import { CrewCharacter } from "@/modules/crew"

import type { Catalog, CatalogCourse } from "../types"

type Props = {
  catalog: Catalog
}

// Fleet map — alternating left/right world cards, one per track. Dashed SVG
// connector zig-zags between worlds. Duolingo-style: a bigger poster, a single
// chunky progress bar, and ONE primary CTA per world (no dot-per-lesson strip).
export async function GlobalPath({ catalog }: Props) {
  const t = await getTranslations("tracks.list.globalPath")

  const totalDone = catalog.courses.reduce((s, c) => s + c.lessonsDone, 0)
  const totalLessons = catalog.courses.reduce((s, c) => s + c.lessons, 0)
  const totalXp = catalog.courses.reduce((s, c) => s + c.xp, 0)
  const totalPct =
    totalLessons === 0 ? 0 : Math.round((totalDone / totalLessons) * 100)
  const capstonesDone = catalog.summary.capstonesDone
  const capstonesTotal = catalog.summary.capstonesTotal

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pb-12 pt-6 md:px-8">
      <header className="grid items-start gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          <Eyebrow className="text-primary">
            {t("eyebrow", { count: catalog.courses.length })}
          </Eyebrow>
          <h1 className="mt-2 font-display font-bold text-4xl leading-tight tracking-tight text-ink-1 md:text-5xl">
            {t.rich("title", {
              em: (chunks) => <span className="text-stat-xp">{chunks}</span>,
            })}
          </h1>
          <p className="mt-3 max-w-[60ch] font-sans font-semibold text-base leading-relaxed text-ink-2">
            {t("subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetaTile label={t("progressLabel")} value={`${totalDone} / ${totalLessons}`} sub={`${totalPct}%`} />
          <MetaTile label={t("xpLabel")} value={totalXp.toLocaleString()} sub={t("xpHint")} tone="xp" />
          <MetaTile label={t("capstoneLabel")} value={`${capstonesDone} / ${capstonesTotal}`} sub={t("capstoneHint")} tone="boss" />
        </div>
      </header>

      <div className="relative flex flex-col gap-8">
        {catalog.courses.map((course, i) => (
          <WorldCard
            key={course.slug}
            course={course}
            idx={i}
            last={i === catalog.courses.length - 1}
          />
        ))}
      </div>
    </main>
  )
}

function MetaTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub: string
  tone?: "xp" | "boss"
}) {
  const valueColor =
    tone === "xp"
      ? "text-stat-xp"
      : tone === "boss"
        ? "text-track-agents"
        : "text-ink-1"
  return (
    <Card className="flex w-32 flex-col gap-1 p-3 text-center">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
        {label}
      </span>
      <span className={`font-display font-bold text-xl tracking-tight tabular-nums ${valueColor}`}>
        {value}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
        {sub}
      </span>
    </Card>
  )
}

type WorldProps = {
  course: CatalogCourse
  idx: number
  last: boolean
}

async function WorldCard({ course, idx, last }: WorldProps) {
  const t = await getTranslations("tracks.list.globalPath")
  const side = idx % 2 === 0 ? "left" : "right"
  const status = statusFor(course)
  const pct = course.pct

  return (
    <div
      className={cn(
        "relative grid items-center gap-6",
        side === "left"
          ? "lg:grid-cols-[2fr_3fr_2fr]"
          : "lg:grid-cols-[2fr_3fr_2fr]",
      )}
    >
      {/* Poster slot — bigger, dominant */}
      <div className={cn(side === "right" && "lg:order-3")}>
        <Card
          className={cn(
            "relative grid aspect-[3/4] place-items-center overflow-hidden p-5",
            status === "locked" && "opacity-60 grayscale",
          )}
          style={
            { ["--w-color" as never]: course.color } as CSSProperties
          }
        >
          <span className="absolute right-2 top-2 rounded-sm border-2 border-line-strong bg-bg-deep/80 px-2 py-0.5 font-display font-bold text-[11px] tabular-nums text-ink-1">
            {String(idx + 1).padStart(2, "0")}
          </span>
          <CrewCharacter slug={course.mascot} size="full" title={course.mascot} />
          <span
            className="absolute bottom-3 left-1/2 -translate-x-1/2"
          >
            <WorldStamp status={status} t={t} />
          </span>
        </Card>
      </div>

      {/* Body slot — order:2 on right side to keep body in the middle */}
      <article
        className={cn(
          "flex flex-col gap-3",
          side === "right" && "lg:order-2",
        )}
      >
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]"
          style={{ color: "var(--w-color)" }}
        >
          {t("chapter", { unit: course.unit, title: course.rank })}
        </span>
        <h2 className="font-display font-bold text-2xl leading-tight tracking-tight text-ink-1">
          {course.title}
        </h2>
        <p className="font-sans font-semibold text-sm leading-relaxed text-ink-2">
          {course.blurb}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <ChunkyProgress value={pct} tone="primary" />
          </div>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3 tabular-nums">
            {course.lessonsDone} / {course.lessons} · <b className="text-ink-1">{pct}%</b>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {renderCta(course, status, t)}
        </div>
      </article>

      {/* Spacer slot to make the alternating offset feel — empty on lg */}
      <div className={cn("hidden lg:block", side === "right" && "lg:order-1")} />

      {/* Dashed connector to next world (decorative) */}
      {!last ? (
        <svg
          className="pointer-events-none absolute left-1/2 top-full hidden h-20 w-40 -translate-x-1/2 lg:block"
          viewBox="0 0 200 140"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d={
              side === "left"
                ? "M 30 0 C 30 60, 170 80, 170 140"
                : "M 170 0 C 170 60, 30 80, 30 140"
            }
            stroke="var(--success)"
            strokeOpacity="0.45"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="2 16"
            fill="none"
          />
        </svg>
      ) : null}
    </div>
  )
}

function WorldStamp({
  status,
  t,
}: {
  status: "done" | "current" | "locked" | "boss"
  t: Awaited<ReturnType<typeof getTranslations<"tracks.list.globalPath">>>
}) {
  if (status === "done") {
    return <Chip tone="success">{t("stamp.done")}</Chip>
  }
  if (status === "current") {
    return <Chip tone="primary">{t("stamp.current")}</Chip>
  }
  if (status === "locked") {
    return (
      <Chip tone="outline">
        <Lock className="size-3" strokeWidth={2.5} />
        {t("stamp.locked")}
      </Chip>
    )
  }
  return <Chip tone="danger">{t("stamp.boss")}</Chip>
}

function statusFor(c: CatalogCourse): "done" | "current" | "locked" | "boss" {
  if (c.locked) return "locked"
  if (c.complete) return "done"
  if (c.boss && c.pct === 0) return "boss"
  return "current"
}

function renderCta(
  c: CatalogCourse,
  status: "done" | "current" | "locked" | "boss",
  t: Awaited<ReturnType<typeof getTranslations<"tracks.list.globalPath">>>,
) {
  if (status === "done") {
    return (
      <>
        <Button render={<Link href={`/tracks/${c.slug}`} />}>
          {t("cta.replay")}
        </Button>
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-stat-xp">
          <Bolt className="size-3" strokeWidth={2.5} />
          {t("cta.xpBanked", { xp: c.xp })}
        </span>
      </>
    )
  }
  if (status === "current") {
    return (
      <Button render={<Link href={`/tracks/${c.slug}`} />}>
        {t("cta.continue", { step: c.lessonsDone + 1 })}
      </Button>
    )
  }
  if (status === "locked") {
    return (
      <>
        <Button variant="ghost" disabled>
          <Lock className="size-3.5" strokeWidth={2.5} />
          {t("cta.locked")}
        </Button>
        {c.unlocks ? (
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">
            {t("cta.unlocksAfter", { course: c.unlocks })}
          </span>
        ) : null}
      </>
    )
  }
  return (
    <Button variant="track-agents" render={<Link href={`/tracks/${c.slug}`} />}>
      <Star className="size-3.5" strokeWidth={2.5} fill="currentColor" />
      {t("cta.attack")}
    </Button>
  )
}
