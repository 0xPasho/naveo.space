import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Button, Eyebrow } from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { CrewCharacter } from "@/modules/crew"

export async function LandingFinalCta() {
  const t = await getTranslations("home.cta")
  const tDossier = await getTranslations("crew.dossier")

  return (
    <section
      aria-labelledby="landing-cta-title"
      className="border-t-2 border-line-soft bg-bg-deep py-20 md:py-28"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-7 px-5 text-center md:px-8">
        <div className="inline-flex size-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-primary/40 bg-primary-soft">
          <CrewCharacter
            slug="vega"
            expression="happy"
            size="full"
            title={tDossier("vega.roleShort")}
          />
        </div>
        <Eyebrow className="text-primary">{t("eyebrow")}</Eyebrow>
        <h2
          id="landing-cta-title"
          className="max-w-3xl text-balance font-display font-bold text-3xl leading-tight tracking-tight text-ink-1 sm:text-5xl"
        >
          {t("title")}
        </h2>
        <p className="max-w-2xl text-pretty font-sans text-lg font-semibold leading-relaxed text-ink-2">
          {t("sub")}
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button size="lg" render={<Link href="/tracks" />}>
            {t("primary")}
            <ArrowRight className="size-4" strokeWidth={2.5} />
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/blog" />}>
            {t("secondary")}
          </Button>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-3">
          {t("signed")}
        </p>
      </div>
    </section>
  )
}
