import { ArrowRight, Lock } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Eyebrow } from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { cn } from "@/common/lib/utils"
import { CrewCharacter, toCrewSlug } from "@/modules/crew"

import type { CrewTone, DashboardCrewMember } from "../types"

type Props = {
  members: readonly DashboardCrewMember[]
}

const TONE_RIBBON: Record<CrewTone, string> = {
  prompting: "bg-track-prompting",
  mcp: "bg-track-mcp",
  skills: "bg-track-skills",
  agents: "bg-track-agents",
  tooling: "bg-track-tooling",
  evals: "bg-track-evals",
}

const TONE_ROLE_TEXT: Record<CrewTone, string> = {
  prompting: "text-track-prompting",
  mcp: "text-track-mcp",
  skills: "text-track-skills",
  agents: "text-track-agents",
  tooling: "text-track-tooling",
  evals: "text-track-evals",
}

export async function CrewRow({ members }: Props) {
  const t = await getTranslations("bridge.crew")

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <Eyebrow>{t("title")}</Eyebrow>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
            {t("subtitle", { count: members.length })}
          </span>
        </div>
        <Link
          href="/crew"
          className="inline-flex items-center gap-1 font-display text-sm font-bold text-primary transition-colors hover:text-primary/80"
        >
          {t("openDossiers")}
          <ArrowRight className="size-4" strokeWidth={2.5} />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <CrewMini key={member.slug} member={member} />
        ))}
      </div>
    </section>
  )
}

async function CrewMini({ member }: { member: DashboardCrewMember }) {
  const t = await getTranslations("bridge.crew")
  const slug = toCrewSlug(member.slug)
  const role = t(`roles.${member.roleKey}`)

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 overflow-hidden rounded-xl border-2 border-line-soft bg-bg-surface px-4 py-3.5 shadow-elev-2",
        "transition-transform duration-fast ease-out",
        member.locked
          ? "opacity-60"
          : "hover:-translate-y-0.5 hover:shadow-elev-3",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1",
          member.locked ? "bg-line-strong" : TONE_RIBBON[member.tone],
        )}
      />

      <div
        className={cn(
          "relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-line-soft bg-bg-sunken shadow-elev-inset",
          member.locked && "grayscale",
        )}
      >
        {slug ? (
          <CrewCharacter slug={slug} size="full" title={member.name} />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-base font-bold leading-tight tracking-tight text-ink-1">
          {member.name}
        </div>
        <div
          className={cn(
            "mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em]",
            member.locked ? "text-ink-3" : TONE_ROLE_TEXT[member.tone],
          )}
        >
          {role}
        </div>
      </div>

      {member.locked ? (
        <Lock
          aria-label={t("locked")}
          className="absolute right-3 top-3 size-3.5 text-ink-3"
          strokeWidth={2.5}
        />
      ) : null}
    </div>
  )
}
