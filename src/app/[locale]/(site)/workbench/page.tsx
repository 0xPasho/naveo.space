import { getTranslations, setRequestLocale } from "next-intl/server"

import { Eyebrow } from "@/common/components/ui"
import { SidebarShell } from "@/common/layout/sidebar-shell"
import type { ContentLocale } from "@/modules/content/types"
import { CrewCharacter } from "@/modules/crew"
import PromptPlaygroundDemo from "@/modules/lessons/demos/prompt-playground"

type Props = {
  params: Promise<{ locale: ContentLocale }>
}

export default async function WorkbenchPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("workbench")

  return (
    <SidebarShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pb-12 pt-6 md:px-8">
        <header className="flex items-center gap-5">
          <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-line-strong bg-bg-raised shadow-elev-3">
            <CrewCharacter slug="forge" size="full" />
          </div>
          <div>
            <Eyebrow className="text-track-evals">{t("eyebrow")}</Eyebrow>
            <h1 className="mt-1 font-display font-bold text-3xl leading-tight tracking-tight text-ink-1 md:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-2 max-w-[60ch] font-sans font-semibold text-base leading-relaxed text-ink-2">
              {t("body")}
            </p>
          </div>
        </header>

        <PromptPlaygroundDemo />
      </div>
    </SidebarShell>
  )
}
