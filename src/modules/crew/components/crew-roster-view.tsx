import { getTranslations } from "next-intl/server"

import { Eyebrow } from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
import { SidebarShell } from "@/common/layout/sidebar-shell"
import { CAST } from "@/modules/cast/data"
import type { Character, CharacterSlug } from "@/modules/cast/types"
import type { ContentLocale } from "@/modules/content/types"
import { listTracks } from "@/modules/content/service"
import { listCrewLessonsBySlug } from "@/modules/crew/lessons"
import type { CrewLessonMap } from "@/modules/crew/lessons"

import { CrewCharacter } from "./crew-character"
import { CrewLessonsDialog } from "./crew-lessons-dialog"

type Props = {
  locale: ContentLocale
}

// Per character, the Naveo Bridge tone the dossier UI paints with. Each
// crew member maps to one track hue so the platform reads track-coded.
type Tone = "xp" | "mcp" | "prompting" | "streak" | "tooling" | "agents"

const CHARACTER_TONE: Record<CharacterSlug, Tone> = {
  vega: "xp",
  atlas: "mcp",
  echo: "prompting",
  forge: "streak",
  orbit: "tooling",
  hex: "agents",
}

const TONE_STYLES: Record<
  Tone,
  {
    ribbon: string
    text: string
    dotBg: string
    accentBorder: string
    accentBg: string
    eyebrow: string
  }
> = {
  xp: {
    ribbon: "bg-stat-xp",
    text: "text-stat-xp",
    dotBg: "bg-stat-xp",
    accentBorder: "border-stat-xp/40",
    accentBg: "bg-stat-xp/10",
    eyebrow: "text-stat-xp",
  },
  mcp: {
    ribbon: "bg-track-mcp",
    text: "text-track-mcp",
    dotBg: "bg-track-mcp",
    accentBorder: "border-track-mcp/40",
    accentBg: "bg-track-mcp/10",
    eyebrow: "text-track-mcp",
  },
  prompting: {
    ribbon: "bg-track-prompting",
    text: "text-track-prompting",
    dotBg: "bg-track-prompting",
    accentBorder: "border-track-prompting/40",
    accentBg: "bg-track-prompting/10",
    eyebrow: "text-track-prompting",
  },
  streak: {
    ribbon: "bg-stat-streak",
    text: "text-stat-streak",
    dotBg: "bg-stat-streak",
    accentBorder: "border-stat-streak/40",
    accentBg: "bg-stat-streak/10",
    eyebrow: "text-stat-streak",
  },
  tooling: {
    ribbon: "bg-track-tooling",
    text: "text-track-tooling",
    dotBg: "bg-track-tooling",
    accentBorder: "border-track-tooling/40",
    accentBg: "bg-track-tooling/10",
    eyebrow: "text-track-tooling",
  },
  agents: {
    ribbon: "bg-track-agents",
    text: "text-track-agents",
    dotBg: "bg-track-agents",
    accentBorder: "border-track-agents/40",
    accentBg: "bg-track-agents/10",
    eyebrow: "text-track-agents",
  },
}

// Full crew dossier page — one card per character with portrait, bio,
// quirks, metadata, and "appears in" hint. Localized strings live under
// `crew.dossier.<slug>` and are shared with the rest of the platform.
export async function CrewRosterView({ locale }: Props) {
  const t = await getTranslations("crew")
  const tDossier = await getTranslations("crew.dossier")

  const [tracks, lessonsByCrew] = await Promise.all([
    listTracks(locale),
    listCrewLessonsBySlug(locale),
  ])
  const trackTitleBySlug = new Map(tracks.map((tr) => [tr.slug, tr.title]))

  const total = CAST.length
  const known = total

  return (
    <SidebarShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Eyebrow className="text-primary">
            {t("eyebrow", { known, total })}
          </Eyebrow>
          <h1 className="font-display font-bold text-4xl leading-[1.05] tracking-tight text-ink-1 sm:text-5xl">
            {t("titleLead")}{" "}
            <span className="text-stat-xp">{t("titleAccent")}</span>
          </h1>
          <p className="max-w-2xl font-sans font-semibold text-base leading-relaxed text-ink-2">
            {t("subheading")}
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {CAST.map((character) => (
            <CrewCard
              key={character.slug}
              character={character}
              roleShort={tDossier(`${character.slug}.roleShort` as never)}
              ribbon={tDossier(`${character.slug}.ribbon` as never)}
              tagline={tDossier(`${character.slug}.tagline` as never)}
              appearsIn={tDossier(`${character.slug}.appearsIn` as never)}
              bio={tDossier(`${character.slug}.bio` as never)}
              pronouns={tDossier(`${character.slug}.pronouns` as never)}
              origin={tDossier(`${character.slug}.origin` as never)}
              voice={tDossier(`${character.slug}.voice` as never)}
              teaches={tDossier(`${character.slug}.teaches` as never)}
              quirks={
                tDossier.raw(`${character.slug}.quirks` as never) as string[]
              }
              labels={{
                pronouns: tDossier("meta.pronouns"),
                origin: tDossier("meta.origin"),
                voice: tDossier("meta.voice"),
                teaches: tDossier("meta.teaches"),
                quirks: tDossier("quirks"),
                lockedRibbon: (track: string) =>
                  tDossier("lockedRibbon", { track }),
              }}
              lockedTrackTitle={
                character.lockedTrack
                  ? trackTitleBySlug.get(character.lockedTrack) ??
                    character.lockedTrack
                  : null
              }
              lessonsByCrew={lessonsByCrew}
            />
          ))}
        </section>
      </div>
    </SidebarShell>
  )
}

type CrewCardProps = {
  character: Character
  roleShort: string
  ribbon: string
  tagline: string
  appearsIn: string
  bio: string
  pronouns: string
  origin: string
  voice: string
  teaches: string
  quirks: string[]
  labels: {
    pronouns: string
    origin: string
    voice: string
    teaches: string
    quirks: string
    lockedRibbon: (track: string) => string
  }
  lockedTrackTitle: string | null
  lessonsByCrew: CrewLessonMap
}

function CrewCard({
  character,
  roleShort,
  ribbon,
  tagline,
  appearsIn,
  bio,
  pronouns,
  origin,
  voice,
  teaches,
  quirks,
  labels,
  lockedTrackTitle,
  lessonsByCrew,
}: CrewCardProps) {
  const tone = TONE_STYLES[CHARACTER_TONE[character.slug]]

  // The entire card is the dialog trigger now — clicking anywhere on the
  // card opens the lessons list (previously only the avatar was clickable
  // and that footprint was too small to discover). CrewLessonsDialog's
  // <DialogTrigger> renders as a <button>, which is fine for accessibility
  // because the card has no nested interactive elements. `text-left` and
  // `block` reset the button defaults so the layout reads as a card.
  return (
    <CrewLessonsDialog
      characterName={character.name}
      lessons={lessonsByCrew[character.slug]}
      triggerClassName={cn(
        "group/card relative block w-full text-left",
        "h-full overflow-hidden rounded-xl border-2 border-line-soft bg-card text-card-foreground shadow-elev-3",
        "p-6",
        "transition-transform duration-fast ease-out hover:-translate-y-0.5",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1",
          tone.ribbon,
        )}
      />

      <span className="flex items-start gap-4">
        <span
          className={cn(
            "relative size-24 shrink-0 overflow-hidden rounded-md border-2 bg-bg-sunken transition-transform group-hover/card:-translate-y-0.5",
            tone.accentBorder,
          )}
        >
          <CrewCharacter
            slug={character.slug}
            expression="happy"
            size="full"
            title={character.name}
            className="size-full p-1"
          />
        </span>
        <span className="block min-w-0 flex-1">
          <span className={cn(eyebrowClass, "block", tone.text)}>{ribbon}</span>
          <span className="mt-1 block font-display font-bold text-2xl leading-tight tracking-tight text-ink-1">
            {character.name}
          </span>
          <span className={cn(eyebrowClass, "mt-0.5 block")}>{roleShort}</span>
        </span>
      </span>

      <span className="mt-4 block font-sans font-semibold text-sm italic leading-snug text-ink-2">
        &ldquo;{tagline}&rdquo;
      </span>

      <span className="mt-4 block font-sans font-semibold text-sm leading-relaxed text-ink-1">
        {bio}
      </span>

      <span className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t-2 border-line-soft pt-4 text-xs">
        <MetaRow label={labels.pronouns} value={pronouns} />
        <MetaRow label={labels.origin} value={origin} />
        <MetaRow label={labels.voice} value={voice} />
        <MetaRow label={labels.teaches} value={teaches} />
      </span>

      <span className="mt-4 block border-t-2 border-line-soft pt-4">
        <span className={cn(eyebrowClass, "block")}>{labels.quirks}</span>
        <span className="mt-2 flex flex-col gap-1.5 font-sans font-semibold text-sm leading-relaxed text-ink-2">
          {quirks.map((q, i) => (
            <span key={i} className="flex gap-2">
              <span
                aria-hidden
                className={cn(
                  "mt-[8px] size-1 shrink-0 rounded-full",
                  tone.dotBg,
                )}
              />
              <span>{q}</span>
            </span>
          ))}
        </span>
      </span>

      <span className="mt-4 flex flex-wrap items-center gap-2 border-t-2 border-line-soft pt-4">
        <span className={cn(eyebrowClass, tone.text)}>{appearsIn}</span>
        {lockedTrackTitle ? (
          <span
            className={cn(
              "ml-auto inline-flex items-center rounded-full border-2 px-2.5 py-0.5 font-display font-bold text-[10px] uppercase tracking-wider",
              tone.accentBorder,
              tone.accentBg,
              tone.text,
            )}
          >
            {labels.lockedRibbon(lockedTrackTitle)}
          </span>
        ) : null}
      </span>
    </CrewLessonsDialog>
  )
}

// Inline spans (not div/dt/dd) so the row stays valid HTML inside the
// card's trigger button — `<button>` only allows phrasing content.
function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <span className="block">
      <span className={cn(eyebrowClass, "block")}>{label}</span>
      <span className="mt-0.5 block font-sans font-semibold text-sm leading-snug text-ink-1">
        {value}
      </span>
    </span>
  )
}

// Eyebrow visual style replicated inline so it can live as a <span> inside
// the card-as-button. The shared <Eyebrow> primitive renders a <div> which
// would be invalid phrasing content under <button>.
const eyebrowClass =
  "font-display font-bold text-[11px] uppercase tracking-[0.16em] text-ink-3"
