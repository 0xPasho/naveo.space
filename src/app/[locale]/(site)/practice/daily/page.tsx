import { setRequestLocale } from "next-intl/server"
import { getTranslations } from "next-intl/server"

import { SignInPrompt } from "@/common/components/sign-in-prompt"
import {
  Button,
  Card,
  Chip,
  Eyebrow,
} from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { SidebarShell } from "@/common/layout/sidebar-shell"
import type { ContentLocale } from "@/modules/content/types"
import { DailyQuestPlayer } from "@/modules/daily-quest/components/daily-quest-player"
import { getOrAssignDailyQuest } from "@/modules/daily-quest/service"
import { getWallet } from "@/modules/economy/service"
import { getOrCreateUser } from "@/modules/users/service"
import { currentUser } from "@/server/auth"

type Props = {
  params: Promise<{ locale: ContentLocale }>
}

export default async function DailyQuestPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const clerkUser = await currentUser()
  if (!clerkUser) {
    const tAnon = await getTranslations("common.anonGate.daily")
    return (
      <SignInPrompt
        heading={tAnon("heading")}
        body={tAnon("body")}
        exploreHref="/tracks"
      />
    )
  }

  const user = await getOrCreateUser(clerkUser.id)
  const [assigned, wallet] = await Promise.all([
    getOrAssignDailyQuest(user.id, locale),
    getWallet(user.id),
  ])
  const t = await getTranslations("practice.daily")

  if (!assigned) {
    return (
      <SidebarShell>
        <div className="mx-auto flex w-full max-w-[800px] flex-col gap-5 px-5 pb-12 pt-7 md:px-10">
          <header className="flex flex-col gap-1.5">
            <Eyebrow className="text-primary">{t("eyebrow")}</Eyebrow>
            <h1 className="font-display font-bold text-3xl leading-[1.05] tracking-tight text-ink-1">
              {t("noneAvailable.title")}
            </h1>
            <p className="font-sans font-semibold text-sm text-ink-3">
              {t("noneAvailable.body")}
            </p>
          </header>
          <Button render={<Link href="/practice" />} variant="outline">
            {t("footer.back")}
          </Button>
        </div>
      </SidebarShell>
    )
  }

  const { quest, passed, date } = assigned

  return (
    <SidebarShell>
      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-5 px-5 pb-12 pt-7 md:px-10">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Chip tone="xp">{t("eyebrow")}</Chip>
            {passed ? <Chip tone="success">{t("passedChip")}</Chip> : null}
          </div>
          <h1 className="font-display font-bold text-3xl leading-[1.05] tracking-tight text-ink-1">
            {quest.title}
          </h1>
          {quest.frontMatter.intro ? (
            <p className="max-w-[60ch] font-sans font-semibold text-sm leading-relaxed text-ink-3 whitespace-pre-line">
              {quest.frontMatter.intro}
            </p>
          ) : null}
        </header>

        <Card className="p-5">
          <DailyQuestPlayer
            questId={quest.id}
            locale={locale}
            scenes={quest.frontMatter.scenes}
            initialPassed={passed}
            date={date}
            hearts={wallet.hearts}
          />
        </Card>
      </div>
    </SidebarShell>
  )
}
