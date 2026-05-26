import { getTranslations } from "next-intl/server"

import { Button, Eyebrow } from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { CrewCharacter } from "@/modules/crew"

// Locale-aware 404 page. Renders inside the [locale] segment so the global
// Hud + chrome from the (site) / (player) layouts wraps around it.
export default async function LocaleNotFound() {
  const t = await getTranslations("pageError.notFound")

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-4 px-5 py-12 text-center">
      <div className="size-32">
        <CrewCharacter slug="echo" expression="curious" size="full" />
      </div>
      <Eyebrow className="text-primary">{t("eyebrow")}</Eyebrow>
      <h1 className="font-display font-bold text-4xl leading-tight tracking-tight text-ink-1 md:text-5xl">
        {t("title")}
      </h1>
      <p className="max-w-md font-sans font-semibold text-base leading-relaxed text-ink-2">
        {t("body")}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button render={<Link href="/dashboard" />}>{t("ctaBridge")}</Button>
        <Button variant="ghost" render={<Link href="/tracks" />}>
          {t("ctaTracks")}
        </Button>
      </div>
    </div>
  )
}
