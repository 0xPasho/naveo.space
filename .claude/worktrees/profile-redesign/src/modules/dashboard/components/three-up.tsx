import { getTranslations } from "next-intl/server"

import { Link } from "@/common/i18n/navigation"

import type { Dashboard } from "../types"

type Props = {
  dashboard: Dashboard
}

// Three-up cards: Continue (real data), Daily (placeholder), Capstone
// (placeholder). Mirrors the .card.raised cluster in Dashboard3.
export async function ThreeUp({ dashboard }: Props) {
  const t = await getTranslations("bridge.cards")
  const continueAt = dashboard.continueAt
  const continueHref = continueAt
    ? `/tracks/${continueAt.next.trackSlug}/${continueAt.next.courseSlug}/${continueAt.next.stepSlug}`
    : "/tracks"

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 14,
        marginTop: 4,
      }}
    >
      <Link
        href={continueHref}
        className="card raised"
        style={{ borderColor: "oklch(.78 .10 200 / 35%)", display: "block" }}
      >
        <div className="eyebrow">
          {continueAt
            ? t("continue.eyebrow", {
                unit: continueAt.unitNumber,
                step: continueAt.stepNumber,
              })
            : t("continue.eyebrow", { unit: 1, step: 1 })}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            margin: "8px 0",
            letterSpacing: "-.01em",
          }}
        >
          {continueAt ? continueAt.next.stepTitle : ""}
        </div>
        <div
          className="progress"
          style={{
            height: 8,
            background: "var(--card-sunk)",
            border: "1px solid var(--border)",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <b
            style={{
              display: "block",
              height: "100%",
              width: `${continueAt?.pct ?? 0}%`,
              background:
                "linear-gradient(90deg, var(--xp-gold), oklch(.86 .18 90))",
            }}
          />
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--fg-dim)",
            letterSpacing: ".14em",
            marginTop: 6,
          }}
        >
          {continueAt
            ? t("continue.minutesLeft", {
                done: continueAt.stepNumber - 1,
                total: continueAt.totalSteps,
                minutes: continueAt.estimatedMinutesLeft,
              })
            : ""}
        </div>
      </Link>

      <div className="card raised">
        <div className="eyebrow magenta">{t("daily.eyebrow")}</div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            margin: "8px 0",
            letterSpacing: "-.01em",
          }}
        >
          {t("daily.title")}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--fg-muted)",
            lineHeight: 1.5,
          }}
        >
          {t("daily.body")}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--xp-gold)",
            letterSpacing: ".14em",
            marginTop: 8,
          }}
        >
          {t("daily.reward")}
        </div>
      </div>

      <div className="card raised">
        <div className="eyebrow gold">{t("capstone.eyebrow")}</div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            margin: "8px 0",
            letterSpacing: "-.01em",
          }}
        >
          {t("capstone.title")}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--fg-muted)",
            lineHeight: 1.5,
          }}
        >
          {t.rich("capstone.body", {
            b: (chunks) => (
              <b style={{ color: "var(--fg)", fontWeight: 700 }}>{chunks}</b>
            ),
          })}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--mission-magenta)",
            letterSpacing: ".14em",
            marginTop: 8,
          }}
        >
          {t("capstone.unlocksIn", { steps: dashboard.capstoneStepsToUnlock })}
        </div>
      </div>
    </div>
  )
}
