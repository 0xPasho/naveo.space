import { Bolt, Star, Swords } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Button, Card, ChunkyProgress, Eyebrow, StatTile } from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"

import type { Dashboard } from "../types"

type Props = {
  dashboard: Dashboard
}

// Three-up cards row on the bridge. Continue (next-step) carries a
// chunky progress bar + ONE primary CTA; Daily is a StatTile-style
// outlined metric tile (Duolingo's "TOTAL XP / SPEEDY / GREAT" pattern);
// Capstone has ONE primary action when in flight, or a celebratory
// "all cleared" state otherwise.
export async function ThreeUp({ dashboard }: Props) {
  const t = await getTranslations("bridge.cards")
  const continueAt = dashboard.continueAt
  const continueHref = continueAt
    ? `/tracks/${continueAt.next.trackSlug}/${continueAt.next.courseSlug}/${continueAt.next.stepSlug}`
    : "/tracks"

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="flex h-full flex-col gap-4 p-6">
        <Eyebrow>
          {continueAt
            ? t("continue.eyebrow", {
                unit: continueAt.unitNumber,
                step: continueAt.stepNumber,
              })
            : t("continue.eyebrow", { unit: 1, step: 1 })}
        </Eyebrow>
        <div className="font-display text-xl font-bold leading-snug tracking-tight text-ink-1">
          {continueAt ? continueAt.next.stepTitle : t("continue.emptyTitle")}
        </div>
        <ChunkyProgress value={continueAt?.pct ?? 0} tone="primary" />
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
          {continueAt
            ? t("continue.progress", {
                done: continueAt.stepNumber - 1,
                total: continueAt.totalSteps,
              })
            : ""}
        </div>
        <div className="mt-auto pt-2">
          <Button size="lg" className="w-full" render={<Link href={continueHref} />}>
            {t("continue.cta")}
          </Button>
        </div>
      </Card>

      <Card className="flex h-full flex-col gap-4 p-6">
        <Eyebrow className="text-stat-xp">{t("daily.eyebrow")}</Eyebrow>
        <StatTile
          variant="outline"
          tone="xp"
          label={t("daily.title")}
          value={t("daily.reward")}
          icon={<Bolt className="size-5" strokeWidth={2.5} />}
        />
        <p className="font-sans text-sm leading-relaxed text-ink-2">
          {t("daily.body")}
        </p>
        <div className="mt-auto pt-2">
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            render={<Link href="/practice" />}
          >
            {t("daily.cta")}
          </Button>
        </div>
      </Card>

      <CapstoneCard dashboard={dashboard} />
    </div>
  )
}

async function CapstoneCard({ dashboard }: Props) {
  const t = await getTranslations("bridge.cards")
  const tCapstones = await getTranslations("tracks.detail.capstones")
  const capstone = dashboard.capstone

  if (!capstone) {
    return (
      <Card className="flex h-full flex-col gap-4 border-success/30 bg-success-soft p-6">
        <Eyebrow className="text-stat-xp">
          {t("capstone.allClearedEyebrow")}
        </Eyebrow>
        <StatTile
          variant="outline"
          tone="success"
          label={t("capstone.allClearedTitle")}
          value={<Star className="size-7" strokeWidth={2.5} />}
        />
        <p className="font-sans text-sm leading-relaxed text-ink-2">
          {t("capstone.allClearedBody")}
        </p>
      </Card>
    )
  }

  const capstoneName = tCapstones(capstone.capstoneTitleKey)
  const href = `/tracks/${capstone.trackSlug}`

  return (
    <Card className="flex h-full flex-col gap-4 p-6">
      <Eyebrow className="text-track-agents">{t("capstone.eyebrow")}</Eyebrow>
      <StatTile
        variant="outline"
        tone="agents"
        label={t("capstone.unlocksDynamic", { steps: capstone.stepsAway })}
        value={<Swords className="size-7" strokeWidth={2.5} />}
      />
      <div className="font-display text-base font-bold leading-snug tracking-tight text-ink-1">
        {capstoneName}
      </div>
      <p className="font-sans text-sm leading-relaxed text-ink-2">
        {t.rich("capstone.bodyDynamic", {
          track: capstone.trackTitle,
          b: (chunks) => (
            <b className="font-bold text-ink-1">{chunks}</b>
          ),
        })}
      </p>
      <div className="mt-auto pt-2">
        <Button
          variant="track-agents"
          size="lg"
          className="w-full"
          render={<Link href={href} />}
        >
          {t("capstone.cta")}
        </Button>
      </div>
    </Card>
  )
}
