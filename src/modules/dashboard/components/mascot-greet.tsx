import { getTranslations } from "next-intl/server"

import { Button, DialogBubble } from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { CrewPortrait, toCrewSlug } from "@/modules/crew"

import type { Dashboard } from "../types"

type Props = {
  dashboard: Dashboard
}

// Duolingo-style mascot-forward hero. A 100px crew character on the left,
// a chunky DialogBubble (tutor speech) on the right with the headline, and
// a single chunky primary CTA below — no secondary, no stat row, no eyebrow
// roof. Less density, more presence.
export async function MascotGreet({ dashboard }: Props) {
  const t = await getTranslations("bridge.greet")

  const messageKey = dashboard.continueAt
    ? "messageInProgress"
    : "messageNextUp"

  const mascotName =
    dashboard.mascotSlug.charAt(0).toUpperCase() + dashboard.mascotSlug.slice(1)
  const mascotSlug = toCrewSlug(dashboard.mascotSlug)
  const mascotExpression =
    dashboard.stats.xpToday > 0 ? "happy" : "neutral"

  const greetingLine = t(dashboard.timeOfDay, { name: dashboard.greetingName })

  return (
    <section className="flex items-start gap-5 md:gap-7">
      {mascotSlug ? (
        <CrewPortrait
          slug={mascotSlug}
          expression={mascotExpression}
          size={120}
          title={mascotName}
        />
      ) : null}
      <div className="flex-1 pt-3">
        <DialogBubble className="max-w-none">
          <div className="font-display text-lg font-bold leading-tight tracking-tight text-ink-1">
            {greetingLine}
          </div>
          <div className="mt-1.5 font-sans text-sm font-semibold leading-snug text-ink-2">
            {t.rich(messageKey, {
              accent: (chunks) => (
                <span className="text-stat-xp">{chunks}</span>
              ),
            })}
          </div>
          <div className="mt-4">
            {dashboard.continueAt ? (
              <Button
                size="lg"
                render={
                  <Link
                    href={`/tracks/${dashboard.continueAt.next.trackSlug}/${dashboard.continueAt.next.courseSlug}/${dashboard.continueAt.next.stepSlug}`}
                  />
                }
              >
                {t("ctaContinue")}
              </Button>
            ) : (
              <Button size="lg" render={<Link href="/tracks" />}>
                {t("ctaStart")}
              </Button>
            )}
          </div>
        </DialogBubble>
      </div>
    </section>
  )
}
