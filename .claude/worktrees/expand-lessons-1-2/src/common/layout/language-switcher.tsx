"use client"

import { useLocale, useTranslations } from "next-intl"
import { useTransition } from "react"

import { usePathname, useRouter } from "@/common/i18n/navigation"
import { routing, type Locale } from "@/common/i18n/routing"

export function LanguageSwitcher() {
  const t = useTranslations("common.languageSwitcher")
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value as Locale
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <select
      aria-label={t("label")}
      value={locale}
      onChange={handleChange}
      disabled={isPending}
      className="h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground"
    >
      {routing.locales.map((code) => (
        <option key={code} value={code}>
          {t(code)}
        </option>
      ))}
    </select>
  )
}
