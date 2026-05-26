import { ArrowLeft } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Eyebrow } from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"

import type { LegalDocument, LegalSection } from "./types"

type Props = {
  document: LegalDocument
}

export async function LegalView({ document }: Props) {
  const t = await getTranslations(`legal.${document}`)
  const tCommon = await getTranslations("legal.common")
  const sections = t.raw("sections") as LegalSection[]

  return (
    <article className="mx-auto w-full max-w-3xl px-5 pt-16 pb-24 md:px-8 md:pt-20">
      <header className="mb-10 flex flex-col gap-4">
        <Eyebrow className="text-primary">{t("eyebrow")}</Eyebrow>
        <h1 className="font-display font-bold text-4xl leading-[1.05] tracking-tight text-ink-1 md:text-5xl">
          {t("title")}
        </h1>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-3">
          {tCommon("lastUpdated")}
        </p>
        <p className="text-pretty font-sans text-base font-semibold leading-relaxed text-ink-2 md:text-lg">
          {t("intro")}
        </p>
      </header>

      <div className="flex flex-col gap-10">
        {sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-3">
            <h2 className="font-display font-bold text-xl leading-tight tracking-tight text-ink-1 md:text-2xl">
              {section.title}
            </h2>
            <p className="text-pretty font-sans text-base font-semibold leading-relaxed text-ink-2">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <div className="mt-16 border-t-2 border-line-soft pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-sans text-sm font-bold text-ink-2 transition-colors hover:text-ink-1"
        >
          <ArrowLeft className="size-4" strokeWidth={2.5} />
          {tCommon("backHome")}
        </Link>
      </div>
    </article>
  )
}
