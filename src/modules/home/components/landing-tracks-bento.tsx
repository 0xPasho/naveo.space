import { ArrowRight, Compass, Cpu, MessageSquare, Workflow } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Button, Eyebrow } from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { cn } from "@/common/lib/utils"

type TrackTone = "prompting" | "skills" | "mcp" | "agents"

type TrackTile = {
  slug: "prompting" | "conversation" | "mcps" | "flows"
  tone: TrackTone
  icon: LucideIcon
  span: string
  href: string
  featured?: boolean
}

const TONE_BG: Record<TrackTone, string> = {
  prompting: "bg-track-prompting text-track-prompting-ink",
  skills: "bg-track-skills text-track-skills-ink",
  mcp: "bg-track-mcp text-white",
  agents: "bg-track-agents text-white",
}

const TONE_BORDER: Record<TrackTone, string> = {
  prompting: "border-track-prompting/40",
  skills: "border-track-skills/40",
  mcp: "border-track-mcp/60",
  agents: "border-track-agents/40",
}

const TONE_GLYPH_TINT: Record<TrackTone, string> = {
  prompting: "text-track-prompting",
  skills: "text-track-skills",
  mcp: "text-white",
  agents: "text-track-agents",
}

const TILES: TrackTile[] = [
  {
    slug: "prompting",
    tone: "prompting",
    icon: Compass,
    span: "md:col-span-3",
    href: "/tracks",
  },
  {
    slug: "conversation",
    tone: "skills",
    icon: MessageSquare,
    span: "md:col-span-3",
    href: "/tracks",
  },
  {
    slug: "mcps",
    tone: "mcp",
    icon: Cpu,
    span: "md:col-span-4",
    href: "/tracks",
    featured: true,
  },
  {
    slug: "flows",
    tone: "agents",
    icon: Workflow,
    span: "md:col-span-2",
    href: "/tracks",
  },
]

export async function LandingTracksBento() {
  const t = await getTranslations("home.tracks")

  return (
    <section
      aria-labelledby="landing-tracks-title"
      className="border-t-2 border-line-soft bg-bg-deep py-20 md:py-28"
    >
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-2xl flex-col gap-3">
            <Eyebrow className="text-primary">{t("eyebrow")}</Eyebrow>
            <h2
              id="landing-tracks-title"
              className="font-display font-bold text-3xl leading-tight tracking-tight text-ink-1 sm:text-4xl"
            >
              {t("title")}
            </h2>
            <p className="font-sans text-base font-semibold leading-relaxed text-ink-2">
              {t("sub")}
            </p>
          </div>
          <Button variant="outline" size="default" render={<Link href="/tracks" />}>
            {t("seeAll")}
            <ArrowRight className="size-4" strokeWidth={2.5} />
          </Button>
        </div>

        <ol className="grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-5">
          {TILES.map((tile) => {
            const Icon = tile.icon
            return (
              <li key={tile.slug} className={cn("min-w-0", tile.span)}>
                <Link
                  href={tile.href}
                  className={cn(
                    "group flex h-full flex-col gap-4 rounded-xl border-2 bg-bg-surface p-5 shadow-elev-3 transition-[transform,box-shadow] duration-fast ease-out hover:-translate-y-0.5",
                    TONE_BORDER[tile.tone],
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex size-12 items-center justify-center rounded-md shadow-elev-2",
                        TONE_BG[tile.tone],
                      )}
                    >
                      <Icon className="size-5" strokeWidth={2.5} />
                    </span>
                    {tile.featured ? (
                      <span className="rounded-full bg-stat-xp px-2.5 py-0.5 font-display font-bold text-[10px] uppercase tracking-[0.14em] text-track-skills-ink shadow-[0_2px_0_0_var(--stat-xp-shadow)]">
                        {t("featuredLabel")}
                      </span>
                    ) : (
                      <Eyebrow className={cn("opacity-80", TONE_GLYPH_TINT[tile.tone])}>
                        {t(`tiles.${tile.slug}.duration`)}
                      </Eyebrow>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-display font-bold text-xl leading-tight tracking-tight text-ink-1">
                      {t(`tiles.${tile.slug}.title`)}
                    </h3>
                    <p className="font-sans text-sm font-semibold leading-relaxed text-ink-2">
                      {t(`tiles.${tile.slug}.body`)}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t-2 border-line-soft pt-3">
                    <span className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-ink-3">
                      {t(`tiles.${tile.slug}.lessons`)}
                    </span>
                    <span className="inline-flex items-center gap-1 font-display font-bold text-xs uppercase tracking-[0.12em] text-primary transition-transform duration-fast group-hover:translate-x-0.5">
                      {t("enter")}
                      <ArrowRight className="size-3.5" strokeWidth={2.5} />
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
