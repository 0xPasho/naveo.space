import { getFormatter, getTranslations } from "next-intl/server"

import { SignInPrompt } from "@/common/components/sign-in-prompt"
import {
  Button,
  Card,
  Chip,
  Eyebrow,
} from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { SidebarShell } from "@/common/layout/sidebar-shell"
import { timeAgo } from "@/common/lib/format"
import type { ContentLocale } from "@/modules/content/types"
import { DAILY_QUEST_XP_PASS } from "@/modules/daily-quest/data"
import { getOrAssignDailyQuest } from "@/modules/daily-quest/service"
import { getReviewQueue } from "@/modules/srs/service"
import type { ReviewItem } from "@/modules/srs/types"
import { getOrCreateUser } from "@/modules/users/service"
import { currentUser } from "@/server/auth"

import { getPracticeQueue } from "./service"
import {
  PRACTICE_RAIL_ORDER,
  type PracticeItem,
  type PracticeRailKind,
} from "./types"

type Props = {
  locale: ContentLocale
}

/* Map each practice rail kind to its Naveo track tone. Mirrors the
   dashboard practice rail from the Naveo Screens reference. */
const RAIL_TONE: Record<
  PracticeRailKind,
  "prompting" | "skills" | "agents" | "mcp"
> = {
  drill: "prompting",
  build: "skills",
  chat: "agents",
  tool: "mcp",
}

export async function PracticeView({ locale }: Props) {
  const t = await getTranslations("practice")
  const tBridge = await getTranslations("dashboardBridge.practice")
  const fmt = await getFormatter({ locale })

  const clerkUser = await currentUser()
  if (!clerkUser) {
    // Practice queue is per-user; anon viewers get the sign-in prompt
    // (with a "browse tracks" escape) instead of bouncing silently.
    const tAnon = await getTranslations("common.anonGate.practice")
    return (
      <SignInPrompt
        heading={tAnon("heading")}
        body={tAnon("body")}
        exploreHref="/tracks"
      />
    )
  }

  const user = await getOrCreateUser(clerkUser.id)
  const [queue, reviews, daily] = await Promise.all([
    getPracticeQueue(clerkUser.id, locale),
    getReviewQueue(clerkUser.id, locale),
    getOrAssignDailyQuest(user.id, locale),
  ])

  // Dedupe: if a step is in BOTH the SRS review queue and the failure
  // queue (e.g. failed recently but also crossed its nextReviewAt), the
  // review version wins — it carries the richer signal (streak, interval)
  // and the user already sees the failure context implicitly.
  const reviewStepIds = new Set(reviews.map((r) => r.stepId))
  const filteredQueue = queue.filter((q) => !reviewStepIds.has(q.stepId))

  const railLabel: Record<PracticeRailKind, string> = {
    drill: tBridge("drill"),
    build: tBridge("build"),
    chat: tBridge("chat"),
    tool: tBridge("tool"),
  }

  const grouped = new Map<PracticeRailKind, PracticeItem[]>(
    PRACTICE_RAIL_ORDER.map((k) => [k, []]),
  )
  for (const item of filteredQueue) {
    grouped.get(item.kind)?.push(item)
  }

  const groupsWithItems = PRACTICE_RAIL_ORDER.filter(
    (k) => (grouped.get(k)?.length ?? 0) > 0,
  )

  const totalItems = reviews.length + filteredQueue.length
  // The page can be in three meaningful empty-ish states:
  //   1. Nothing at all (no daily pool + no queue + no reviews) → empty card.
  //   2. Daily pending + nothing else → daily card carries the page.
  //   3. Daily done + nothing else → just the daily-done card; skip the
  //      generic "sin pendientes" card to avoid duplicate empty signals.
  const dailyHidden = !daily
  const dailyDone = daily?.passed ?? false
  const isFullyEmpty = totalItems === 0 && dailyHidden
  const tDaily = await getTranslations("practice.daily")

  return (
    <SidebarShell>
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 px-5 pb-12 pt-7 md:px-10">
        <header className="flex flex-col gap-1.5">
          <Eyebrow className="text-primary">
            {t("eyebrow", { n: totalItems })}
          </Eyebrow>
          <h1 className="font-display font-bold text-4xl leading-[1.05] tracking-tight text-ink-1">
            {t("titleLead")}{" "}
            <span className="text-stat-xp">{t("titleAccent")}</span>
          </h1>
          <p className="max-w-[60ch] font-sans font-semibold text-sm leading-relaxed text-ink-3">
            {t("subheading")}
          </p>
        </header>

        {daily ? (
          <Card className="flex flex-col gap-3 p-5">
            <div className="flex items-center gap-2">
              <Chip tone="xp">{tDaily("eyebrow")}</Chip>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
                {tDaily("sceneCount", {
                  count: daily.quest.frontMatter.scenes.length,
                })}
              </span>
              {dailyDone ? (
                <Chip tone="success">{tDaily("passedChip")}</Chip>
              ) : null}
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="font-display font-bold text-xl leading-tight tracking-tight text-ink-1">
                {daily.quest.title}
              </h2>
              {daily.quest.frontMatter.intro ? (
                <p className="max-w-[60ch] font-sans font-semibold text-sm leading-relaxed text-ink-3 whitespace-pre-line">
                  {daily.quest.frontMatter.intro}
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] font-bold tabular-nums text-stat-xp">
                +{DAILY_QUEST_XP_PASS} XP
              </span>
              <Button
                render={<Link href="/practice/daily" />}
                variant={dailyDone ? "outline" : "default"}
                size="sm"
              >
                {dailyDone ? tDaily("cta.replay") : tDaily("cta.start")}
              </Button>
            </div>
          </Card>
        ) : null}

        {isFullyEmpty ? (
          <Card className="flex flex-col items-start gap-3 p-6">
            <h3 className="font-display font-bold text-xl tracking-tight text-ink-1">
              {t("empty.title")}
            </h3>
            <p className="max-w-[60ch] font-sans font-semibold text-sm leading-relaxed text-ink-3">
              {t("empty.body")}
            </p>
            <Button render={<Link href="/tracks" />}>{t("empty.cta")}</Button>
          </Card>
        ) : null}

        {reviews.length > 0 ? (
          <Card className="overflow-hidden p-0">
            <div className="flex flex-col gap-1 border-b-2 border-line-soft px-5 py-4">
              <div className="flex items-center gap-3">
                <Chip tone="xp">{t("review.chip")}</Chip>
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
                  {t("review.count", { n: reviews.length })}
                </span>
              </div>
              <p className="max-w-[60ch] font-sans font-semibold text-xs leading-relaxed text-ink-3">
                {t("review.body")}
              </p>
            </div>
            <ul className="flex flex-col">
              {reviews.map((item, i) => (
                <ReviewRow
                  key={item.stepId}
                  item={item}
                  isFirst={i === 0}
                  fmt={fmt}
                  labels={{
                    interval: t("review.row.interval", {
                      days: item.intervalDays,
                    }),
                    streak: t("review.row.streak", { n: item.streak }),
                    due: t("review.row.due", {
                      when: timeAgo(item.nextReviewAt, locale),
                    }),
                    cta: t("review.row.cta"),
                  }}
                />
              ))}
            </ul>
          </Card>
        ) : null}

        {groupsWithItems.map((kind) => {
          const items = grouped.get(kind) ?? []
          return (
            <Card key={kind} className="overflow-hidden p-0">
              <div className="flex items-center gap-3 border-b-2 border-line-soft px-5 py-4">
                <Chip tone={RAIL_TONE[kind]}>{railLabel[kind]}</Chip>
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
                  {t("group.count", { n: items.length })}
                </span>
              </div>
              <ul className="flex flex-col">
                {items.map((item, i) => (
                  <li
                    key={item.stepId}
                    className={`grid grid-cols-1 items-center gap-2 px-5 py-4 md:grid-cols-[1fr_auto_auto] md:gap-4 ${i > 0 ? "border-t border-line-soft" : ""}`}
                  >
                    <div className="min-w-0">
                      <div className="font-display font-bold text-sm leading-tight text-ink-1">
                        {item.stepTitle}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                        {item.trackTitle} · {item.courseTitle}
                      </div>
                    </div>
                    <div className="flex flex-row items-center gap-3 md:flex-col md:items-end md:gap-0.5">
                      <span className="font-mono text-xs font-bold tabular-nums text-danger">
                        {t("row.attempts", { n: item.attempts })}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                        {t("row.lastFailed", {
                          when: timeAgo(item.lastFailedAt, locale),
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] font-bold tabular-nums text-stat-xp">
                        +{fmt.number(item.xpReward)} XP
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        render={
                          <Link
                            href={
                              `/tracks/${item.trackSlug}/${item.courseSlug}/${item.stepSlug}` as `/tracks/${string}/${string}/${string}`
                            }
                          />
                        }
                      >
                        {t("row.cta")}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}
      </div>
    </SidebarShell>
  )
}

type ReviewRowProps = {
  item: ReviewItem
  isFirst: boolean
  fmt: Awaited<ReturnType<typeof getFormatter>>
  labels: {
    interval: string
    streak: string
    due: string
    cta: string
  }
}

function ReviewRow({ item, isFirst, fmt, labels }: ReviewRowProps) {
  return (
    <li
      className={`grid grid-cols-1 items-center gap-2 px-5 py-4 md:grid-cols-[1fr_auto_auto] md:gap-4 ${isFirst ? "" : "border-t border-line-soft"}`}
    >
      <div className="min-w-0">
        <div className="font-display font-bold text-sm leading-tight text-ink-1">
          {item.stepTitle}
        </div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          {item.trackTitle} · {item.courseTitle}
        </div>
      </div>
      <div className="flex flex-row items-center gap-3 md:flex-col md:items-end md:gap-0.5">
        <span className="font-mono text-xs font-bold tabular-nums text-stat-xp">
          {labels.streak}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
          {labels.interval} · {labels.due}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] font-bold tabular-nums text-stat-xp">
          +{fmt.number(item.xpReward)} XP
        </span>
        <Button
          variant="secondary"
          size="sm"
          render={
            <Link
              href={
                `/tracks/${item.trackSlug}/${item.courseSlug}/${item.stepSlug}` as `/tracks/${string}/${string}/${string}`
              }
            />
          }
        >
          {labels.cta}
        </Button>
      </div>
    </li>
  )
}
