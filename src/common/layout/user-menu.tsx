"use client"

import { useClerk, useUser } from "@clerk/nextjs"
import { Check, Globe, LogOut, User as UserIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useTransition } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/common/components/ui"
import { usePathname, useRouter } from "@/common/i18n/navigation"
import { routing, type Locale } from "@/common/i18n/routing"
import { cn } from "@/common/lib/utils"

export function UserMenu() {
  const t = useTranslations("common.userMenu")
  const tLang = useTranslations("common.languageSwitcher")
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale() as Locale
  const [isLocalePending, startLocaleTransition] = useTransition()

  const switchLocale = (next: Locale) => {
    if (next === locale) return
    startLocaleTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  if (!user) return null

  const fallback =
    user.firstName?.[0] ??
    user.username?.[0] ??
    user.primaryEmailAddress?.emailAddress?.[0] ??
    "?"
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    user.primaryEmailAddress?.emailAddress ||
    ""

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("openLabel")}
        className="inline-flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-line-strong bg-bg-raised font-display font-bold text-sm text-ink-1 outline-none transition-transform hover:border-primary focus-visible:ring-4 focus-visible:ring-primary-soft"
      >
        {user.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.imageUrl}
            alt=""
            className="size-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span>{fallback.toUpperCase()}</span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[14rem]">
        <div className="px-3 pb-2 pt-1">
          <div className="font-display font-bold text-sm leading-tight text-ink-1">
            {displayName}
          </div>
          {user.primaryEmailAddress?.emailAddress ? (
            <div className="mt-0.5 font-mono text-[11px] text-ink-3">
              {user.primaryEmailAddress.emailAddress}
            </div>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/perfil")}>
          <UserIcon className="size-4" strokeWidth={2.5} aria-hidden />
          <span>{t("profile")}</span>
        </DropdownMenuItem>
        {/* Language switcher — only inside the menu on mobile widths; on
            desktop the standalone LanguageSwitcher remains in the HUD.
            md:hidden is applied per-element (not on a wrapper div) so the
            menu's Collection sees items as direct children. */}
        <DropdownMenuSeparator className="md:hidden" />
        <div
          data-slot="dropdown-menu-label"
          className="flex items-center gap-2 px-3 py-1.5 font-display font-bold text-[11px] uppercase tracking-[0.12em] text-ink-3 md:hidden"
        >
          <Globe className="size-3.5" strokeWidth={2.5} aria-hidden />
          <span>{tLang("label")}</span>
        </div>
        {routing.locales.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => switchLocale(code)}
            disabled={isLocalePending}
            data-active={code === locale || undefined}
            className="data-[active]:bg-primary-soft data-[active]:text-primary md:hidden"
          >
            <Check
              className={cn(
                "size-4",
                code === locale ? "opacity-100" : "opacity-0",
              )}
              strokeWidth={2.5}
              aria-hidden
            />
            <span>{tLang(code)}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut({ redirectUrl: "/" })}>
          <LogOut className="size-4" strokeWidth={2.5} aria-hidden />
          <span>{t("signOut")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
