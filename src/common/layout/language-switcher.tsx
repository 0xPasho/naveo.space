"use client"

import { Globe } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useTransition } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/common/components/ui"
import { usePathname, useRouter } from "@/common/i18n/navigation"
import { routing, type Locale } from "@/common/i18n/routing"

export function LanguageSwitcher() {
  const t = useTranslations("common.languageSwitcher")
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const switchTo = (next: Locale) => {
    if (next === locale) return
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("label")}
        disabled={isPending}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-line-strong bg-bg-raised px-2.5 py-1.5 font-display font-bold text-xs uppercase tracking-wider text-ink-1 outline-none transition-colors hover:border-line-strong/70 focus-visible:ring-4 focus-visible:ring-primary-soft disabled:cursor-wait disabled:opacity-60 md:px-3"
      >
        <Globe className="size-3.5" strokeWidth={2.5} aria-hidden />
        <span className="hidden md:inline">{locale.toUpperCase()}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        {routing.locales.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => switchTo(code)}
            data-active={code === locale || undefined}
            className="data-[active]:bg-primary-soft data-[active]:text-primary"
          >
            {t(code)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
