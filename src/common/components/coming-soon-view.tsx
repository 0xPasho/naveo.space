import { getTranslations } from "next-intl/server"

import { Button, Eyebrow } from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { SidebarShell } from "@/common/layout/sidebar-shell"
import { CrewPortrait } from "@/modules/crew"

type Feature = "practice" | "crew" | "leaderboard" | "shop"

type Tone =
  | "text-track-prompting"
  | "text-stat-xp"
  | "text-track-agents"
  | "text-track-mcp"

const FEATURE_META: Record<
  Feature,
  {
    mascot: "vega" | "atlas" | "echo" | "forge" | "orbit" | "hex"
    tone: Tone
  }
> = {
  practice: { mascot: "echo", tone: "text-track-prompting" },
  crew: { mascot: "vega", tone: "text-stat-xp" },
  leaderboard: { mascot: "atlas", tone: "text-track-agents" },
  shop: { mascot: "vega", tone: "text-track-mcp" },
}

type Props = {
  feature: Feature
}

export async function ComingSoonView({ feature }: Props) {
  const t = await getTranslations("comingSoon")
  const meta = FEATURE_META[feature]

  return (
    <SidebarShell>
      <div className="mx-auto mt-12 grid w-full max-w-5xl items-center gap-9 px-4 py-8 md:grid-cols-[260px_1fr]">
        <CrewPortrait slug={meta.mascot} size={260} />
        <div className="flex flex-col gap-4">
          <Eyebrow className={meta.tone}>{t("eyebrow")}</Eyebrow>
          <h1 className="font-display font-bold text-4xl leading-[1.05] tracking-tight text-ink-1 sm:text-5xl">
            {t(`${feature}.title`)}
          </h1>
          <p className="max-w-xl font-sans font-semibold text-base leading-relaxed text-ink-2">
            {t(`${feature}.body`)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button size="lg" render={<Link href="/tracks" />}>
              {t("ctaBack")}
            </Button>
            <Button size="lg" variant="ghost" render={<Link href="/dashboard" />}>
              {t("ctaDashboard")}
            </Button>
          </div>
        </div>
      </div>
    </SidebarShell>
  )
}
