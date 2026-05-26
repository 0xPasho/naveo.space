import { ArrowRight, Radar, Route, Sparkles } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { buttonVariants } from "@/common/components/ui/button"
import { Link } from "@/common/i18n/navigation"
import { CAST } from "@/modules/cast/data"

import {
  CrewMascotPlaceholder,
  ShipSystemPanel,
  StarTunnelViewport,
} from "./ship-system-hero"

export async function HomeView() {
  const t = await getTranslations("home")
  const crew = CAST.slice(0, 3)
  const protocols = [
    {
      icon: Radar,
      label: t("systems.signal.label"),
      value: t("systems.signal.value"),
    },
    {
      icon: Route,
      label: t("systems.route.label"),
      value: t("systems.route.value"),
    },
    {
      icon: Sparkles,
      label: t("systems.crew.label"),
      value: t("systems.crew.value"),
    },
  ]

  return (
    <div className="relative isolate flex w-full flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_20%,rgb(127_229_232_/_0.16),transparent_30%),radial-gradient(circle_at_78%_66%,rgb(224_185_89_/_0.13),transparent_28%)]" />
      <div className="mx-auto grid min-h-[calc(100svh-65px)] w-full max-w-7xl grid-cols-1 content-center gap-8 px-5 py-8 md:grid-cols-[minmax(0,0.95fr)_minmax(440px,1.05fr)] md:px-8 lg:gap-12 lg:py-12">
        <section className="flex min-w-0 flex-col justify-center gap-7">
          <div className="space-y-5">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-[color:var(--brand-gold)]">
              {t("eyebrow")}
            </p>
            <h1 className="max-w-3xl text-balance text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
              {t("heading")}
            </h1>
            <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              {t("subheading")}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/tracks" className={buttonVariants({ size: "lg" })}>
              {t("cta")}
              <ArrowRight />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {protocols.map((item) => (
              <ShipSystemPanel key={item.label} {...item} />
            ))}
          </div>
        </section>

        <section
          aria-label={t("viewportLabel")}
          className="relative min-h-[620px] overflow-hidden rounded-lg border border-white/10 bg-black/30 shadow-2xl shadow-black/40 md:min-h-[680px]"
        >
          <StarTunnelViewport />
          <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-black/35 px-4 py-3 backdrop-blur-md">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--brand-cyan)]">
                {t("console.kicker")}
              </p>
              <p className="mt-1 text-lg font-bold leading-tight">
                {t("console.title")}
              </p>
            </div>
            <div className="rounded-md border border-[color:var(--brand-gold)]/30 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--brand-gold)]">
              {t("console.status")}
            </div>
          </div>

          <div className="absolute inset-x-4 bottom-4 z-10 grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-lg border border-white/10 bg-background/80 p-4 backdrop-blur-md">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {t("mission.kicker")}
              </p>
              <p className="mt-2 text-xl font-bold">{t("mission.title")}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t("mission.body")}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {crew.map((member) => (
                <CrewMascotPlaceholder key={member.slug} character={member} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
