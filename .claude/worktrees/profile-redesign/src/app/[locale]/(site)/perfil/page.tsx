import { SignOutButton } from "@clerk/nextjs"
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server"

import "@/modules/dashboard/styles.css"

import { Link, redirect } from "@/common/i18n/navigation"
import { LanguageSwitcher } from "@/common/layout/language-switcher"
import type { ContentLocale } from "@/modules/content/types"
import {
  getStreakWeek,
  getXpSnapshot,
  type StreakWeekDay,
} from "@/modules/gamification/service"
import { BadgesGallery } from "@/modules/progress/components/badges-gallery"
import { CrewJournal } from "@/modules/progress/components/crew-journal"
import { getEarnedBadges, getJournal } from "@/modules/progress/service"
import { UserAvatar } from "@/modules/users/components/avatar"
import { XP_PER_STEP } from "@/modules/users/placeholder-stats"
import {
  getNextStepForUser,
  getOrCreateUser,
  getUserStats,
} from "@/modules/users/service"
import { currentUser } from "@/server/auth"

type Props = {
  params: Promise<{ locale: ContentLocale }>
}

const STREAK_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const

export default async function PerfilPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const clerkUser = await currentUser()
  if (!clerkUser) {
    redirect({ href: "/", locale })
    return null
  }

  await getOrCreateUser(clerkUser.id)
  const [stats, journal, badges, snap, week, nextStep] = await Promise.all([
    getUserStats(clerkUser.id, locale),
    getJournal(clerkUser.id, locale, 20),
    getEarnedBadges(clerkUser.id, locale),
    getXpSnapshot(clerkUser.id),
    getStreakWeek(clerkUser.id),
    getNextStepForUser(clerkUser.id, locale),
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

  const memberSinceLabel = stats.memberSince
    ? fmt.dateTime(stats.memberSince, { year: "numeric", month: "short" })
    : "—"

  const continueHref = nextStep
    ? `/tracks/${nextStep.trackSlug}/${nextStep.courseSlug}/${nextStep.stepSlug}`
    : "/tracks"

  const telemetry: TelemetryCell[] = [
    {
      label: t("telemetry.xp"),
      value: stats.xp.toLocaleString(),
      color: "var(--xp-gold)",
    },
    {
      label: t("telemetry.streak"),
      value: t("stats.streakUnit", { days: snap.dailyStreak }),
      color: "var(--forge-orange)",
    },
    {
      label: t("telemetry.best"),
      value: t("stats.streakUnit", { days: snap.bestStreak }),
      color: "var(--forge-orange)",
    },
    {
      label: t("telemetry.completion"),
      value: completionPct === null ? "—" : `${completionPct}%`,
      color: "var(--brand-cyan)",
    },
    {
      label: t("telemetry.rank"),
      value: t("rankValue"),
      color: "var(--brand-gold)",
    },
    {
      label: t("telemetry.memberSince"),
      value: memberSinceLabel,
      color: "var(--crew-green)",
    },
  ]

  return (
    <div className="crew-dashboard">
      <main
        style={{
          padding: "24px 32px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          maxWidth: 1180,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <DossierHero
          name={displayName}
          email={clerkUser.primaryEmailAddress?.emailAddress ?? null}
          imageUrl={clerkUser.imageUrl}
          continueHref={continueHref}
          telemetry={telemetry}
          eyebrow={t("eyebrow")}
          title={t("hero.title", { name: displayName })}
          body={t("hero.body")}
          ctaResume={t("hero.ctaResume")}
          ctaBrowse={t("hero.ctaBrowse")}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          <div className="stat-tile xp">
            <img className="icon" src="/icons/xp-bolt.svg" alt="" />
            <div className="lab">{t("stats.xpThisRun")}</div>
            <div className="val numeral">{stats.xp.toLocaleString()}</div>
            <div className="delta up">
              {t("stats.xpDelta", { n: XP_PER_STEP })}
            </div>
          </div>
          <div className="stat-tile streak">
            <img className="icon" src="/icons/streak-flame.svg" alt="" />
            <div className="lab">{t("stats.streak")}</div>
            <div className="val numeral">
              {t("stats.streakUnit", { days: snap.dailyStreak })}
            </div>
            <div className={"delta " + (snap.bestStreak > 0 ? "up" : "dn")}>
              {snap.bestStreak > 0
                ? t("stats.streakDelta", { best: snap.bestStreak })
                : t("stats.streakNone")}
            </div>
          </div>
          <div className="stat-tile crew">
            <img className="icon" src="/icons/star.svg" alt="" />
            <div className="lab">{t("stats.completion")}</div>
            <div className="val numeral">
              {completionPct === null ? "—" : `${completionPct}%`}
            </div>
            <div className="delta up">
              {t("stats.completionDelta", {
                done: stats.completedSteps,
                total: stats.totalSteps,
              })}
            </div>
          </div>
          <div className="stat-tile boss">
            <img className="icon" src="/icons/mission-target.svg" alt="" />
            <div className="lab">{t("stats.attempts")}</div>
            <div className="val numeral">
              {stats.totalAttempts.toLocaleString()}
            </div>
            <div className="delta up">{t("stats.attemptsDelta")}</div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.4fr",
            gap: 14,
          }}
        >
          <div className="card">
            <div className="card-h">
              <h3 className="title">{t("streakBlock.title")}</h3>
            </div>
            <StreakWeek days={week.days} />
            <p
              style={{
                marginTop: 14,
                marginBottom: 0,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "var(--fg-dim)",
              }}
            >
              {t("streakBlock.subtitle")}
            </p>
          </div>

          <div className="card">
            <div className="card-h">
              <h3 className="title">{t("badges.heading")}</h3>
              {badges.length > 0 ? (
                <span className="more">{badges.length}</span>
              ) : null}
            </div>
            <BadgesGallery
              badges={badges}
              emptyLabel={t("badges.empty")}
              formatDate={formatBadgeDate}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <h3 className="title">{t("journal.heading")}</h3>
            {stats.completedSteps > 0 ? (
              <span className="more">{stats.completedSteps}</span>
            ) : null}
          </div>
          <CrewJournal
            entries={journal}
            locale={locale}
            emptyLabel={t("journal.empty")}
          />
        </div>

        <div
          className="mascot-card"
          style={{ ["--ribbon" as never]: "var(--brand-gold)" }}
        >
          <div className="top">
            <img src="/cast/vega.svg" alt="" />
            <div>
              <div className="role">{t("mentor.role")}</div>
              <div className="name" style={{ color: "var(--brand-gold)" }}>
                Vega
              </div>
            </div>
          </div>
          <div className="bubble">{t("mentor.tip")}</div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          <div className="card">
            <div className="card-h">
              <h3 className="title">{t("preferences.heading")}</h3>
            </div>
            <SettingRow
              label={t("preferences.language")}
              control={<LanguageSwitcher />}
            />
          </div>

          <div className="card">
            <div className="card-h">
              <h3 className="title">{t("session.heading")}</h3>
            </div>
            <SettingRow
              label={t("session.email")}
              control={
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--fg-muted)",
                  }}
                >
                  {clerkUser.primaryEmailAddress?.emailAddress ?? "—"}
                </span>
              }
            />
            <div
              style={{
                marginTop: 12,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <span className="btn btn-ghost btn-sm">
                <SignOutButton>{t("session.signOut")}</SignOutButton>
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

type TelemetryCell = { label: string; value: string; color: string }

type DossierHeroProps = {
  name: string
  email: string | null
  imageUrl: string
  continueHref: string
  telemetry: TelemetryCell[]
  eyebrow: string
  title: string
  body: string
  ctaResume: string
  ctaBrowse: string
}

function DossierHero({
  name,
  email,
  imageUrl,
  continueHref,
  telemetry,
  eyebrow,
  title,
  body,
  ctaResume,
  ctaBrowse,
}: DossierHeroProps) {
  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        background:
          "radial-gradient(70% 100% at 100% 0%, oklch(0.78 0.10 200 / .22), transparent 60%), linear-gradient(135deg, oklch(0.22 0.05 240), oklch(0.14 0.04 240))",
        border: "1px solid oklch(.78 .10 200 / 30%)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 24,
          padding: 24,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <UserAvatar imageUrl={imageUrl} name={name} size="xl" />
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h1
              style={{
                fontSize: 30,
                margin: "6px 0 4px",
                letterSpacing: "-.03em",
                lineHeight: 1.05,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                color: "var(--fg-muted)",
                margin: "0 0 4px",
                fontSize: 14,
                maxWidth: "52ch",
                lineHeight: 1.5,
              }}
            >
              {body}
            </p>
            {email ? (
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: ".06em",
                  color: "var(--fg-dim)",
                }}
              >
                {email}
              </p>
            ) : null}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link href={continueHref} className="btn btn-cta">
            {ctaResume}
          </Link>
          <Link href="/tracks" className="btn btn-ghost btn-sm">
            {ctaBrowse}
          </Link>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          borderTop: "1px solid var(--border)",
        }}
      >
        {telemetry.map((cell, i) => (
          <div
            key={cell.label}
            style={{
              padding: "12px 16px",
              borderLeft: i ? "1px solid var(--border)" : "0",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9.5,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "var(--fg-dim)",
              }}
            >
              {cell.label}
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                fontFeatureSettings: '"tnum"',
                color: cell.color,
              }}
            >
              {cell.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StreakWeek({ days }: { days: readonly StreakWeekDay[] }) {
  return (
    <div className="streak-grid">
      {STREAK_LABELS.map((d, i) => {
        const state = days[i] ?? "future"
        const cls =
          "streak-day" +
          (state === "done" ? " done" : "") +
          (state === "today" ? " today" : "")
        return (
          <div key={i} className={cls}>
            <span className="lab">{d}</span>
          </div>
        )
      })}
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
      }}
    >
      <p style={{ margin: 0, fontSize: 13, color: "var(--fg-muted)" }}>
        {label}
      </p>
      <div>{control}</div>
    </div>
  )
}
