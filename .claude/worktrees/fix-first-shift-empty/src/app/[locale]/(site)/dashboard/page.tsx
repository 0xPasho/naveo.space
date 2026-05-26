import { getTranslations, setRequestLocale } from "next-intl/server"
import { ArrowRight } from "lucide-react"

import "@/modules/dashboard/styles.css"

import { Link } from "@/common/i18n/navigation"
import { buttonVariants } from "@/common/components/ui/button"
import type { ContentLocale } from "@/modules/content/types"
import { CrewRail } from "@/modules/dashboard/components/crew-rail"
import { MascotGreet } from "@/modules/dashboard/components/mascot-greet"
import { ShipComms } from "@/modules/dashboard/components/ship-comms"
import { ShipStats } from "@/modules/dashboard/components/ship-stats"
import { ThreeUp } from "@/modules/dashboard/components/three-up"
import { getDashboard } from "@/modules/dashboard/service"
import { resolveContentLocale } from "@/modules/content/service"
import { currentUser } from "@/server/auth"

type Props = {
  params: Promise<{ locale: ContentLocale }>
}

export default async function BridgePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("bridge")

  const clerkUser = await currentUser()

  // Anon view: lean sign-in nudge. Same shape we had before — Dashboard C is
  // signed-in chrome, so anon users get a placeholder card.
  if (!clerkUser) {
    return (
      <div className="relative isolate overflow-hidden px-5 py-8 md:px-8">
        <section className="mx-auto max-w-4xl rounded-lg border border-white/10 bg-black/30 p-8 backdrop-blur-md">
          <span className="rounded-md border border-[color:var(--brand-gold)]/30 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--brand-gold)]">
            {t("anon.status")}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("anon.heading")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t("anon.body")}
          </p>
          <Link
            href="/tracks"
            className={buttonVariants({
              className: "mt-6",
              variant: "outline",
            })}
          >
            {t("anon.browseTracks")}
            <ArrowRight />
          </Link>
        </section>
      </div>
    )
  }

  const greetingName =
    clerkUser.firstName ??
    clerkUser.username ??
    t("defaultGreetingName")

  const contentLocale = await resolveContentLocale(locale)
  const dashboard = await getDashboard({
    userId: clerkUser.id,
    locale: contentLocale,
    greetingName,
  })

  return (
    <div className="crew-dashboard">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          minHeight: "100%",
        }}
      >
        <section
          style={{
            padding: "32px 36px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <MascotGreet dashboard={dashboard} />
          <ThreeUp dashboard={dashboard} />
          <CrewRail crew={dashboard.crew} />
        </section>
        <aside
          style={{
            borderLeft: "1px solid var(--border)",
            background: "var(--bg-soft)",
            padding: 22,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <ShipComms comms={dashboard.comms} />
          <ShipStats stats={dashboard.stats} />
        </aside>
      </div>
    </div>
  )
}
