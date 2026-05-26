import { getTranslations, setRequestLocale } from "next-intl/server"
import { ArrowRight } from "lucide-react"

import "@/modules/dashboard/styles.css"

import { Link } from "@/common/i18n/navigation"
import { buttonVariants } from "@/common/components/ui/button"
import type { ContentLocale } from "@/modules/content/types"
import { PathDashboard } from "@/modules/dashboard/components/path-dashboard"
import { getDashboard } from "@/modules/dashboard/service"
import { currentUser } from "@/server/auth"

type Props = {
  params: Promise<{ locale: ContentLocale }>
}

// Dashboard A — Path-forward variant. Lives at /dashboard/path alongside the
// crew-forward variant at /dashboard. Same data shape, different chrome.
export default async function PathDashboardPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("bridge")

  const clerkUser = await currentUser()

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
    clerkUser.firstName ?? clerkUser.username ?? t("defaultGreetingName")

  const dashboard = await getDashboard({
    userId: clerkUser.id,
    locale,
    greetingName,
  })

  return <PathDashboard dashboard={dashboard} />
}
