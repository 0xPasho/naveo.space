import { getTranslations } from "next-intl/server"

import { Button, Card, Eyebrow } from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { CrewCharacter } from "@/modules/crew"

import type { CourseDetail } from "../types"

type Props = {
  detail: CourseDetail
}

// Right-side aside next to the CoursePath. Next-step card with mascot greet,
// optional boss preview, and a small legend explaining node states.
export async function CoursePathAside({ detail }: Props) {
  const t = await getTranslations("tracks.detail.aside")
  const continueAt = detail.continueAt
  const remainingSteps = Math.max(
    0,
    detail.summary.stepsTotal - detail.summary.stepsDone,
  )

  return (
    <aside className="flex flex-col gap-4">
      {continueAt ? (
        <div className="flex flex-col gap-2">
          <Eyebrow className="text-primary">
            {t("nextStepEyebrow", { step: continueAt.stepNumber })}
          </Eyebrow>
          <Card className="flex flex-col gap-3 p-5">
            <div className="grid size-20 place-items-center self-center overflow-hidden rounded-full border-2 border-line-strong bg-bg-raised">
              <CrewCharacter slug={detail.mascot} size="full" title={detail.mascot} />
            </div>
            <h3 className="text-center font-display font-bold text-lg leading-tight tracking-tight text-ink-1">
              {continueAt.stepTitle}
            </h3>
            <p className="text-center font-sans font-semibold text-sm leading-relaxed text-ink-2">
              {t("nextStepBlurb")}
            </p>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3">
              <span className="text-center">
                <b className="block font-display text-sm text-stat-xp tabular-nums">
                  +
                  {detail.summary.xpTotal > 0
                    ? Math.round(detail.summary.xpTotal / detail.summary.stepsTotal)
                    : 50}
                </b>
                {t("metaXp")}
              </span>
              <span className="text-center">
                <b className="block font-display text-sm text-ink-1 tabular-nums">~3</b>
                {t("metaMin")}
              </span>
              <span className="text-center">
                <b className="block font-display text-sm text-ink-1 tabular-nums">
                  {remainingSteps}
                </b>
                {t("metaLeft")}
              </span>
            </div>
            <Button
              className="w-full"
              render={
                <Link
                  href={`/tracks/${detail.trackSlug}/${continueAt.courseSlug}/${continueAt.stepSlug}`}
                />
              }
            >
              {t("startCta")}
            </Button>
          </Card>
        </div>
      ) : null}

      {detail.hasCapstone ? (
        <div className="flex flex-col gap-2">
          <Eyebrow className="text-track-agents">
            {t("capstoneEyebrow", { count: remainingSteps })}
          </Eyebrow>
          <Card className="flex flex-col items-center gap-2 border-track-agents/40 bg-track-agents/5 p-5 text-center">
            <div className="grid size-16 place-items-center overflow-hidden rounded-full border-2 border-track-agents/40 bg-bg-raised">
              <CrewCharacter
                slug={detail.signingOfficer}
                size="full"
                title={detail.signingOfficer}
              />
            </div>
            <div className="font-display font-bold text-base leading-tight text-ink-1">
              {t("capstoneName", {
                mascot:
                  detail.signingOfficer.charAt(0).toUpperCase() +
                  detail.signingOfficer.slice(1),
              })}
            </div>
            <div className="font-sans font-semibold text-xs text-ink-3">
              {t("capstoneSub")}
            </div>
          </Card>
        </div>
      ) : null}
    </aside>
  )
}
