import "server-only"

import { getLocale, getTranslations } from "next-intl/server"

import { Card, Chip, ChunkyProgress, Eyebrow } from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { listTracks } from "@/modules/content/service"
import type { ContentLocale } from "@/modules/content/types"
import { getTrackProgress } from "@/modules/progress/service"

type TrackTone =
  | "prompting"
  | "mcp"
  | "skills"
  | "agents"
  | "tooling"
  | "evals"

type Subsystem = {
  trackSlug: string
  title: string
  tone: TrackTone
  status: "offline" | "spooling" | "online"
  percent: number
  href: `/tracks/${string}`
  optional: boolean
}

/* Map a track slug to its Naveo Bridge track tone. Defaults to "prompting"
   for tracks that don't have an explicit mapping yet. */
const TRACK_SLUG_TONE: Record<string, TrackTone> = {
  prompting: "prompting",
  "prompts-y-comportamiento": "prompting",
  mcp: "mcp",
  "forge-te-da-las-herramientas": "mcp",
  skills: "skills",
  "skills-poderes": "skills",
  agents: "agents",
  "agentes-multi-paso": "agents",
  tooling: "tooling",
  evals: "evals",
}

const toneFor = (slug: string): TrackTone =>
  TRACK_SLUG_TONE[slug] ?? "prompting"

async function subsystemsFor(
  userId: string | null,
  locale: ContentLocale,
): Promise<Subsystem[]> {
  const tracks = await listTracks(locale)
  return Promise.all(
    tracks.map(async (track) => {
      const progress = await getTrackProgress(userId, track.slug, locale)
      const percent =
        progress.total === 0
          ? 0
          : Math.round((progress.completed / progress.total) * 100)
      const status: Subsystem["status"] =
        percent === 0 ? "offline" : percent >= 100 ? "online" : "spooling"
      return {
        trackSlug: track.slug,
        title: track.title,
        tone: toneFor(track.slug),
        status,
        percent,
        href: `/tracks/${track.slug}` as const,
        optional: track.frontMatter.optional === true,
      }
    }),
  )
}

export async function ShipProgress({ userId }: { userId: string | null }) {
  const locale = (await getLocale()) as ContentLocale
  const t = await getTranslations("dashboardBridge.shipProgress")
  const subsystems = await subsystemsFor(userId, locale)

  const primary = subsystems.filter((s) => !s.optional)
  const onlinePrimary = primary.filter((s) => s.status === "online").length
  const allOnline = primary.length > 0 && onlinePrimary === primary.length

  return (
    <Card className="overflow-hidden p-7">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Eyebrow>{t("title")}</Eyebrow>
        {allOnline ? (
          <Chip tone="success">{t("allOnline")}</Chip>
        ) : (
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
            {t("countLabel", { online: onlinePrimary, total: primary.length })}
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {subsystems.map((s) => (
          <li key={s.trackSlug}>
            <Link
              href={s.href}
              className="grid grid-cols-[1fr_140px_auto] items-center gap-4 rounded-lg bg-bg-raised px-4 py-3 transition-colors hover:bg-bg-surface"
            >
              <span className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-ink-1">
                  {s.title}
                </span>
                {s.optional ? (
                  <Chip tone="outline">{t("optionalChip")}</Chip>
                ) : null}
              </span>
              <ChunkyProgress value={s.percent} tone={s.tone} />
              <SubsystemStatus status={s.status} tone={s.tone} t={t} percent={s.percent} />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

type SubsystemStatusProps = {
  status: Subsystem["status"]
  tone: TrackTone
  percent: number
  t: Awaited<ReturnType<typeof getTranslations>>
}

function SubsystemStatus({ status, tone, percent, t }: SubsystemStatusProps) {
  if (status === "online") {
    return <Chip tone="success">{t("statusOnline")}</Chip>
  }
  if (status === "offline") {
    return <Chip tone="outline">{t("statusOffline")}</Chip>
  }
  return <Chip tone={tone}>{t("statusSpooling", { percent })}</Chip>
}
