import { ArrowRight, CalendarCheck, Flame } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Button, ChunkyProgress, Eyebrow } from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { CrewCharacter } from "@/modules/crew"

export async function LandingDailyQuest() {
  const t = await getTranslations("home.daily")

  return (
    <section
      aria-labelledby="landing-daily-title"
      className="border-t-2 border-line-soft bg-bg-deep py-20 md:py-28"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-5 md:grid-cols-2 md:gap-12 md:px-8">
        {/* Copy */}
        <div className="flex flex-col gap-5">
          <Eyebrow className="text-stat-streak">{t("eyebrow")}</Eyebrow>
          <h2
            id="landing-daily-title"
            className="font-display font-bold text-3xl leading-tight tracking-tight text-ink-1 sm:text-4xl"
          >
            {t("title")}
          </h2>
          <p className="font-sans text-lg font-semibold leading-relaxed text-ink-2">
            {t("sub")}
          </p>
          <ul className="flex flex-col gap-2.5 font-sans text-base font-semibold text-ink-2">
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 inline-block size-2 shrink-0 rounded-full bg-primary" />
              <span>{t("bullets.length")}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 inline-block size-2 shrink-0 rounded-full bg-primary" />
              <span>{t("bullets.bias")}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 inline-block size-2 shrink-0 rounded-full bg-primary" />
              <span>{t("bullets.streak")}</span>
            </li>
          </ul>
        </div>

        {/* Mini daily quest card */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-line-strong bg-bg-surface p-6 shadow-elev-3">
          <div className="flex items-center justify-between gap-3 border-b-2 border-line-soft pb-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-9 items-center justify-center rounded-md bg-stat-streak/20">
                <Flame
                  className="size-4 text-stat-streak"
                  strokeWidth={2.5}
                />
              </span>
              <Eyebrow>{t("card.label")}</Eyebrow>
            </div>
            <span className="font-display font-bold text-xs tabular-nums text-ink-3">
              {t("card.scenes")}
            </span>
          </div>

          <div className="flex items-start gap-4 py-5">
            <span className="inline-flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-track-skills/40 bg-track-skills/15">
              <CrewCharacter slug="echo" size="full" title="Echo" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="font-display font-bold text-lg leading-tight tracking-tight text-ink-1">
                {t("card.title")}
              </h3>
              <p className="font-sans text-sm font-semibold leading-snug text-ink-2">
                {t("card.body")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <ChunkyProgress
              tone="streak"
              value={2}
              max={5}
              label={t("card.progress")}
            />
            <div className="flex items-center justify-between border-t-2 border-line-soft pt-3">
              <span className="inline-flex items-center gap-2 font-display font-bold text-xs uppercase tracking-[0.14em] text-ink-3">
                <CalendarCheck className="size-3.5" strokeWidth={2.5} />
                {t("card.reward")}
              </span>
              <Button size="sm" render={<Link href="/practice/daily" />}>
                {t("card.cta")}
                <ArrowRight className="size-3.5" strokeWidth={2.5} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
