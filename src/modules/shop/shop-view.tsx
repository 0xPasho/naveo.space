import { Gem } from "lucide-react"
import { getFormatter, getTranslations } from "next-intl/server"

import {
  Button,
  Callout,
  Card,
  DialogBubble,
  Eyebrow,
} from "@/common/components/ui"
import { SidebarShell } from "@/common/layout/sidebar-shell"
import { CrewCharacter } from "@/modules/crew"
import { GEM_COST, HEARTS_MAX_DEFAULT, SHOP_ITEMS } from "@/modules/economy/data"
import type { ShopItemSlug } from "@/modules/economy/data"
import { GEM_PACKS, formatUsd } from "@/modules/economy/gem-packs"
import {
  getRecentPurchases,
  getTodayPurchaseCounts,
  getWallet,
} from "@/modules/economy/service"
import type { WalletSnapshot } from "@/modules/economy/types"

import { GemPackCard } from "./gem-pack-card"
import { ShopItemCard } from "./shop-item-card"

// Per-item visual + applicability metadata. Disabled-when checks read from
// the wallet snapshot (e.g. heart items disabled when hearts already full).
const ITEM_META: Record<
  (typeof SHOP_ITEMS)[number]["slug"],
  {
    icon: string
    disabledWhen: (w: WalletSnapshot) => boolean
  }
> = {
  "streak-freeze": {
    icon: "/icons/streak-flame.svg",
    disabledWhen: () => false,
  },
  "heart-refill": {
    icon: "/icons/heart.svg",
    disabledWhen: (w) => w.hearts >= w.heartsMax,
  },
  "heart-pack": {
    icon: "/icons/heart.svg",
    disabledWhen: (w) => w.hearts >= w.heartsMax,
  },
}

// Pick the power-up most worth recommending given the current wallet state.
// Low hearts is the most urgent (active blocker), no streak shield next
// (insurance for the streak), otherwise nudge toward a full heart pack.
function pickRecommendation(w: WalletSnapshot): ShopItemSlug {
  if (w.hearts < 3) return "heart-refill"
  if (w.streakFreezes === 0) return "streak-freeze"
  return "heart-pack"
}

type Props = {
  userId: string | null
  // Stripe redirects back to `/shop?gems=success` (paid) or `?gems=cancel`
  // (user backed out). The actual gem credit happens inside the webhook,
  // so the banner is acknowledgement copy only — not a source of truth.
  checkoutStatus: "success" | "cancel" | null
}

export async function ShopView({ userId, checkoutStatus }: Props) {
  const t = await getTranslations("shop")
  const tItems = await getTranslations("shop.items")
  const tRec = await getTranslations("shop.recommend")
  const tGems = await getTranslations("shop.gems")
  const tAnonShop = await getTranslations("common.anonGate.shop")

  const anonWallet: WalletSnapshot = {
    gems: 0,
    hearts: HEARTS_MAX_DEFAULT,
    heartsMax: HEARTS_MAX_DEFAULT,
    streakFreezes: 0,
    nextHeartAt: null,
  }
  const anonCounts = {} as Record<ShopItemSlug, number>
  const [wallet, todayCounts, recentPurchases] = userId
    ? await Promise.all([
        getWallet(userId),
        getTodayPurchaseCounts(userId),
        getRecentPurchases(userId, 5),
      ])
    : [anonWallet, anonCounts, [] as Awaited<ReturnType<typeof getRecentPurchases>>]
  const formatter = await getFormatter()
  const recommendedSlug = pickRecommendation(wallet)

  return (
    <SidebarShell>
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-7 px-6 pb-16 pt-8">
        {/* Hero: mascot greeting + title */}
        <header className="flex flex-col gap-4">
          <Eyebrow className="text-stat-xp">{t("eyebrow")}</Eyebrow>
          <h1 className="font-display font-bold text-4xl leading-tight tracking-tight text-ink-1">
            {t("title")}
          </h1>
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <CrewCharacter slug="forge" size={88} title="Forge" />
            </div>
            <DialogBubble>{t("greeting")}</DialogBubble>
          </div>
        </header>

        {/* Wallet lives in the top Hud (layout) — not duplicated here. */}

        {!userId ? (
          <Callout tone="info" eyebrow={tAnonShop("heading")}>
            {tAnonShop("body")}
          </Callout>
        ) : null}

        {checkoutStatus === "success" ? (
          <Callout
            tone="success"
            eyebrow={tGems("status.successEyebrow")}
          >
            {tGems("status.successBody")}
          </Callout>
        ) : null}
        {checkoutStatus === "cancel" ? (
          <Callout
            tone="warn"
            eyebrow={tGems("status.cancelEyebrow")}
          >
            {tGems("status.cancelBody")}
          </Callout>
        ) : null}

        {/* Forge recommends */}
        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4 sm:flex-1">
            <div className="shrink-0">
              <CrewCharacter slug="forge" size={72} title="Forge" />
            </div>
            <div className="flex flex-col gap-2">
              <Eyebrow>{tRec("eyebrow")}</Eyebrow>
              <DialogBubble>{tRec(recommendedSlug)}</DialogBubble>
            </div>
          </div>
          <Button
            variant="default"
            className="sm:self-center"
            render={<a href={`#shop-item-${recommendedSlug}`} />}
          >
            <Gem className="size-4" strokeWidth={2.5} />
            {tRec("cta")}
          </Button>
        </Card>

        {/* Gem packs — real-money top-ups via Stripe */}
        <section
          aria-label={tGems("sectionLabel")}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <Eyebrow className="text-stat-gem">{tGems("eyebrow")}</Eyebrow>
            <p className="font-sans text-sm font-semibold text-ink-3">
              {tGems("subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {GEM_PACKS.map((pack) => (
              <GemPackCard
                key={pack.slug}
                slug={pack.slug}
                gems={pack.gems}
                priceLabel={formatUsd(pack.priceCents)}
                name={tGems(`packs.${pack.slug}.name`)}
                badge={"badge" in pack ? pack.badge : null}
                signedIn={userId !== null}
              />
            ))}
          </div>
        </section>

        {/* Item grid */}
        <section
          aria-label={t("itemsLabel")}
          className="flex flex-col gap-3"
        >
          <Eyebrow>{t("powerUps")}</Eyebrow>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SHOP_ITEMS.map((item) => {
              const meta = ITEM_META[item.slug]
              // Anon users: don't grey out the buy button — the card itself
              // swaps the CTA for a sign-in modal trigger via `signedIn={false}`.
              const disabled = userId !== null && meta.disabledWhen(wallet)
              const todayCount = todayCounts[item.slug] ?? 0
              return (
                <ShopItemCard
                  key={item.slug}
                  slug={item.slug}
                  cost={GEM_COST[item.costReason]}
                  disabled={disabled}
                  iconSrc={meta.icon}
                  name={tItems(`${item.slug}.name`)}
                  todayCount={todayCount}
                  signedIn={userId !== null}
                />
              )
            })}
          </div>
        </section>

        {/* Recent purchases — compact single-line list */}
        {recentPurchases.length > 0 ? (
          <Card className="flex flex-col gap-3 p-5">
            <Eyebrow>{t("history.heading")}</Eyebrow>
            <ul className="flex flex-col divide-y divide-line-soft">
              {recentPurchases.map((purchase) => {
                const slugLabel = purchase.slug
                  ? tItems(`${purchase.slug}.name`)
                  : t("history.unknownItem")
                return (
                  <li
                    key={purchase.id}
                    className="flex items-center justify-between gap-3 py-2 font-sans text-sm font-semibold text-ink-2"
                  >
                    <span className="truncate text-ink-1">{slugLabel}</span>
                    <span className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-[11px] text-ink-3">
                        {formatter.relativeTime(purchase.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold tabular-nums text-stat-gem">
                        <Gem className="size-3" strokeWidth={2.5} />
                        -{purchase.cost}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </Card>
        ) : null}

        <p className="font-sans text-xs italic text-ink-3">{t("philosophy")}</p>
      </div>
    </SidebarShell>
  )
}
