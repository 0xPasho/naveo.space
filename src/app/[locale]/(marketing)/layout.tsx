import { getTranslations } from "next-intl/server"

import { Button } from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"

type Props = Readonly<{
  children: React.ReactNode
}>

// (marketing) layout — public SEO surfaces. No gamified HUD, no sidebar.
// Simple Naveo wordmark + minimal nav. Visitors land here from search;
// the CTA pushes them into /dashboard (gated by Clerk).
export default async function MarketingLayout({ children }: Props) {
  const t = await getTranslations("blog")
  const tCommon = await getTranslations("common")
  const tLegal = await getTranslations("legal.footer")

  return (
    <div className="flex min-h-screen flex-col bg-bg-deep text-ink-1">
      <header className="sticky top-0 z-40 border-b-2 border-line-soft bg-bg-deep/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
          <Link
            href="/"
            aria-label={tCommon("hud.logoAlt")}
            className="flex items-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/naveo/naveo-wordmark.svg"
              alt={tCommon("hud.logoAlt")}
              className="block h-9 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-6 font-sans font-semibold text-sm text-ink-2">
            <Link
              href="/blog"
              className="transition-colors hover:text-ink-1"
            >
              {t("nav.blog")}
            </Link>
            <Link
              href="/tracks"
              className="transition-colors hover:text-ink-1"
            >
              {t("nav.tracks")}
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Button size="sm" render={<Link href="/dashboard" />}>
              {t("nav.enter")}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-24 border-t-2 border-line-soft">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 font-sans font-semibold text-sm text-ink-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/naveo/naveo-icon.svg"
              alt=""
              className="block h-7 w-7"
              aria-hidden
            />
            <span className="font-mono text-xs uppercase tracking-[0.18em]">
              {t("footer.tagline")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/blog"
              className="transition-colors hover:text-ink-1"
            >
              {t("nav.blog")}
            </Link>
            <Link
              href="/tracks"
              className="transition-colors hover:text-ink-1"
            >
              {t("nav.tracks")}
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-ink-1"
            >
              {tLegal("terms")}
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-ink-1"
            >
              {tLegal("privacy")}
            </Link>
            <Link
              href="/dashboard"
              className="transition-colors hover:text-ink-1"
            >
              {t("nav.enter")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
