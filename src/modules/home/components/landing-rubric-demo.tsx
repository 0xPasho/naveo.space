import { getTranslations } from "next-intl/server"

import { Eyebrow, RubricCheck } from "@/common/components/ui"

export async function LandingRubricDemo() {
  const t = await getTranslations("home.rubric")
  const checks = [
    { state: "passed", key: "json" },
    { state: "passed", key: "fields" },
    { state: "failed", key: "hallucinate" },
    { state: "passed", key: "shape" },
  ] as const

  return (
    <section
      aria-labelledby="landing-rubric-title"
      className="border-t-2 border-line-soft bg-bg-sunken py-20 md:py-28"
    >
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <div className="mb-10 flex flex-col gap-3">
          <Eyebrow className="text-stat-xp">{t("eyebrow")}</Eyebrow>
          <h2
            id="landing-rubric-title"
            className="max-w-3xl font-display font-bold text-3xl leading-tight tracking-tight text-ink-1 sm:text-4xl"
          >
            {t("title")}
          </h2>
          <p className="max-w-2xl font-sans text-lg font-semibold leading-relaxed text-ink-2">
            {t("sub")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-8">
          {/* Left: the prompt as the student wrote it */}
          <div className="flex flex-col gap-3 rounded-xl border-2 border-line-soft bg-bg-surface p-5 shadow-elev-2">
            <Eyebrow>{t("promptLabel")}</Eyebrow>
            <pre className="overflow-x-auto rounded-md border-2 border-line-soft bg-bg-sunken p-4 font-mono text-xs leading-relaxed text-ink-2 shadow-elev-inset">
{t("promptBody")}
            </pre>
            <p className="font-sans text-xs font-semibold text-ink-3">
              {t("promptNote")}
            </p>
          </div>

          {/* Right: rubric checklist */}
          <div className="flex flex-col gap-2.5 rounded-xl border-2 border-line-soft bg-bg-surface p-5 shadow-elev-2">
            <div className="mb-1 flex items-baseline justify-between">
              <Eyebrow>{t("rubricLabel")}</Eyebrow>
              <span className="font-display font-bold text-[11px] text-danger">
                {t("rubricStatus")}
              </span>
            </div>
            {checks.map((check) => (
              <RubricCheck
                key={check.key}
                state={check.state}
                label={t(`checks.${check.key}.label`)}
                hint={
                  check.state === "failed"
                    ? t(`checks.${check.key}.hint`)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
