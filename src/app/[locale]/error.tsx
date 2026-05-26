"use client"

import { useTranslations } from "next-intl"
import { useEffect } from "react"

import { Button, Eyebrow } from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { CrewCharacter } from "@/modules/crew"

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

// Locale-aware error boundary. Next.js renders this when an uncaught error
// is thrown inside the [locale] segment. Mascot Forge owns this — engineer
// who fixes broken pipes.
export default function LocaleError({ error, reset }: Props) {
  const t = useTranslations("pageError.error")

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Locale error boundary caught:", error)
    }
  }, [error])

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-4 px-5 py-12 text-center">
      <div className="size-32">
        <CrewCharacter slug="forge" expression="correction" size="full" />
      </div>
      <Eyebrow className="text-danger">{t("eyebrow")}</Eyebrow>
      <h1 className="font-display font-bold text-4xl leading-tight tracking-tight text-ink-1 md:text-5xl">
        {t("title")}
      </h1>
      <p className="max-w-md font-sans font-semibold text-base leading-relaxed text-ink-2">
        {t("body")}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>{t("ctaRetry")}</Button>
        <Button variant="ghost" render={<Link href="/" />}>
          {t("ctaHome")}
        </Button>
      </div>
      {error.digest ? (
        <details className="mt-4 font-mono text-xs text-ink-3">
          <summary className="cursor-pointer">{t("details")}</summary>
          <code className="mt-2 inline-block rounded-sm bg-bg-sunken px-2 py-1">
            {error.digest}
          </code>
        </details>
      ) : null}
    </div>
  )
}
