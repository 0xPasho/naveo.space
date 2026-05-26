import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Button, Eyebrow } from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"

import { LandingPlayerPreview } from "./landing-player-preview"

export async function LandingHero() {
  const t = await getTranslations("home.hero")

  return (
    <section
      aria-labelledby="landing-hero-title"
      className="relative isolate w-full overflow-hidden bg-bg-deep"
    >
      <div className="mx-auto grid min-h-[calc(100svh-65px)] w-full max-w-7xl grid-cols-1 content-center gap-10 px-5 py-12 md:grid-cols-[minmax(0,0.92fr)_minmax(440px,1.08fr)] md:gap-12 md:px-8 lg:py-16">
        <div className="flex min-w-0 flex-col justify-center gap-7">
          <Eyebrow className="text-primary">{t("eyebrow")}</Eyebrow>
          <h1
            id="landing-hero-title"
            className="max-w-3xl text-balance font-display font-bold text-4xl leading-[1.04] tracking-tight text-ink-1 sm:text-5xl lg:text-6xl"
          >
            {t("heading")}
          </h1>
          <p className="max-w-2xl text-pretty font-sans font-semibold text-lg leading-relaxed text-ink-2">
            {t("sub")}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" render={<Link href="/tracks" />}>
              {t("cta")}
              <ArrowRight className="size-4" strokeWidth={2.5} />
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/blog" />}>
              {t("secondary")}
            </Button>
          </div>

          <p className="font-sans text-sm font-semibold text-ink-3">
            {t("note")}
          </p>
        </div>

        <div className="min-w-0">
          <LandingPlayerPreview />
        </div>
      </div>
    </section>
  )
}
