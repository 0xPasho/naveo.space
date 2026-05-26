import { getTranslations } from "next-intl/server"

import { Eyebrow } from "@/common/components/ui"

export async function LandingLoopSteps() {
  const t = await getTranslations("home.loop")
  const steps = ["read", "practice", "judge"] as const

  return (
    <section
      aria-labelledby="landing-loop-title"
      className="border-t-2 border-line-soft bg-bg-deep py-20 md:py-28"
    >
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <div className="mb-12 flex flex-col gap-3">
          <Eyebrow className="text-primary">{t("eyebrow")}</Eyebrow>
          <h2
            id="landing-loop-title"
            className="max-w-3xl font-display font-bold text-3xl leading-tight tracking-tight text-ink-1 sm:text-4xl"
          >
            {t("title")}
          </h2>
        </div>

        <ol className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
          {steps.map((slug, i) => (
            <li key={slug} className="flex flex-col gap-3">
              <span className="inline-flex size-14 items-center justify-center rounded-lg border-2 border-line-strong bg-bg-surface font-display font-bold text-2xl tabular-nums text-primary shadow-[0_4px_0_0_var(--primary-shadow)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display font-bold text-xl leading-tight tracking-tight text-ink-1">
                {t(`steps.${slug}.title`)}
              </h3>
              <p className="max-w-md font-sans text-base font-semibold leading-relaxed text-ink-2">
                {t(`steps.${slug}.body`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
