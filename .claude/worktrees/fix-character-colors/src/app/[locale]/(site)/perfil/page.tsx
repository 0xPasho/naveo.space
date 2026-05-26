import { SignOutButton } from "@clerk/nextjs"
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server"
import { Gauge, IdCard, type LucideIcon, Radio, Shield } from "lucide-react"

import { redirect } from "@/common/i18n/navigation"
import { LanguageSwitcher } from "@/common/layout/language-switcher"
import { buttonVariants } from "@/common/components/ui/button"
import { cn } from "@/common/lib/utils"
import { currentUser } from "@/server/auth"
import type { ContentLocale } from "@/modules/content/types"
import { BadgesGallery } from "@/modules/progress/components/badges-gallery"
import { CrewJournal } from "@/modules/progress/components/crew-journal"
import { getEarnedBadges, getJournal } from "@/modules/progress/service"
import { UserAvatar } from "@/modules/users/components/avatar"
import { getOrCreateUser, getUserStats } from "@/modules/users/service"

type Props = {
  params: Promise<{ locale: ContentLocale }>
}

export default async function PerfilPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const clerkUser = await currentUser()
  if (!clerkUser) {
    // Profile is only meaningful when signed in. Send anon users back to
    // the marketing page; they can sign in from there.
    redirect({ href: "/", locale })
    // unreachable; satisfies type checker since redirect's return type
    // isn't inferred as `never` in this Next 16 / next-intl combo.
    return null
  }

  // Ensure the User row exists (lazy sync) before reading stats.
  await getOrCreateUser(clerkUser.id)
  const [stats, journal, badges] = await Promise.all([
    getUserStats(clerkUser.id, locale),
    getJournal(clerkUser.id, locale, 20),
    getEarnedBadges(clerkUser.id, locale),
  ])

  const t = await getTranslations("profile")
  const fmt = await getFormatter({ locale })

  const formatBadgeDate = (d: Date) =>
    fmt.dateTime(d, { day: "numeric", month: "short" })

  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    clerkUser.primaryEmailAddress?.emailAddress ||
    t("defaultName")

  const completionPct =
    stats.totalSteps === 0
      ? null
      : Math.round((stats.completedSteps / stats.totalSteps) * 100)

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-12 lg:py-16">
      <header className="relative overflow-hidden rounded-lg border border-[color:var(--brand-cyan)]/20 bg-black/35 p-5 shadow-[0_24px_90px_rgb(0_0_0/0.32)] backdrop-blur-xl">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[linear-gradient(115deg,transparent,rgb(127_229_232/0.08),transparent)]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <UserAvatar
              imageUrl={clerkUser.imageUrl}
              name={displayName}
              size="xl"
            />
            <div>
              <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-[color:var(--brand-cyan)]/90">
                <IdCard className="size-4" aria-hidden />
                {t("eyebrow")}
              </p>
              <h1 className="mt-1 text-4xl font-black tracking-tight">
                {displayName}
              </h1>
              {clerkUser.primaryEmailAddress?.emailAddress ? (
                <p className="font-mono text-xs text-muted-foreground">
                  {clerkUser.primaryEmailAddress.emailAddress}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid w-full max-w-xs grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-[0.18em] sm:w-64">
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              <p className="text-muted-foreground">{t("hud.rank")}</p>
              <p className="mt-1 text-sm font-bold text-[color:var(--brand-gold)]">
                {t("hud.crew")}
              </p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              <p className="text-muted-foreground">{t("hud.sync")}</p>
              <p className="mt-1 text-sm font-bold text-[color:var(--brand-cyan)]">
                {completionPct === null ? "—" : `${completionPct}%`}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <SectionTitle icon={Gauge} label={t("stats.heading")} />
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label={t("stats.completed")}
            value={`${stats.completedSteps} / ${stats.totalSteps}`}
            accent="gold"
          />
          <Stat
            label={t("stats.attempts")}
            value={String(stats.totalAttempts)}
            accent="cyan"
          />
          <Stat
            label={t("stats.completion")}
            value={completionPct === null ? "—" : `${completionPct}%`}
            accent="cyan"
          />
          <Stat
            label={t("stats.memberSince")}
            value={
              stats.memberSince
                ? fmt.dateTime(stats.memberSince, {
                    year: "numeric",
                    month: "short",
                  })
                : "—"
            }
            accent="gold"
          />
        </dl>
      </section>

      <section className="space-y-3">
        <SectionTitle icon={Shield} label={t("badges.heading")} />
        <BadgesGallery
          badges={badges}
          emptyLabel={t("badges.empty")}
          formatDate={formatBadgeDate}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <SectionTitle icon={Radio} label={t("journal.heading")} />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            +{stats.completedSteps * 10} XP
          </span>
        </div>
        <CrewJournal
          entries={journal}
          locale={locale}
          emptyLabel={t("journal.empty")}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
          {t("settings.heading")}
        </h2>
        <div className="divide-y divide-white/10 rounded-lg border border-[color:var(--brand-cyan)]/20 bg-black/35 backdrop-blur-xl">
          <SettingRow
            label={t("settings.language")}
            control={<LanguageSwitcher />}
          />
          <SettingRow
            label={t("settings.session")}
            control={
              <span
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                <SignOutButton>{t("settings.signOut")}</SignOutButton>
              </span>
            }
          />
        </div>
      </section>
    </div>
  )
}

function SectionTitle({
  icon: Icon,
  label,
}: {
  icon: LucideIcon
  label: string
}) {
  return (
    <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--brand-cyan)]">
      <Icon className="size-4" aria-hidden />
      {label}
    </h2>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: "gold" | "cyan"
}) {
  const accentClass =
    accent === "gold"
      ? "text-[color:var(--brand-gold)]"
      : "text-[color:var(--brand-cyan)]"
  return (
    <div className="rounded-lg border border-[color:var(--brand-cyan)]/20 bg-black/35 p-4 backdrop-blur-xl">
      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-bold tabular-nums",
          accentClass,
          value.length > 6 ? "text-xl" : "text-2xl",
        )}
      >
        {value}
      </dd>
    </div>
  )
}

function SettingRow({
  label,
  control,
}: {
  label: string
  control: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-sm">{label}</p>
      <div>{control}</div>
    </div>
  )
}
