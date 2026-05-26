import { getTranslations } from "next-intl/server"

import { Link } from "@/common/i18n/navigation"

import type { Dashboard } from "../types"

type Props = {
  dashboard: Dashboard
}

// Big Vega greet at the top of Dashboard C. Left: 240px mascot with drop
// shadow; right: eyebrow with ship time + a 40px greeting line + two CTAs
// (Continue / Open map). Mirrors the design's Dashboard3 hero.
export async function MascotGreet({ dashboard }: Props) {
  const t = await getTranslations("bridge.greet")

  const greetingKey = dashboard.timeOfDay
  const messageKey = dashboard.continueAt
    ? "messageInProgress"
    : "messageNextUp"

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        gap: 28,
        alignItems: "end",
      }}
    >
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            inset: "auto 0 -20px 0",
            height: 30,
            background:
              "radial-gradient(50% 100% at 50% 0%, oklch(0 0 0 / .65), transparent 70%)",
            filter: "blur(6px)",
          }}
        />
        <img
          src="/cast/vega.svg"
          alt="Vega"
          style={{
            width: 240,
            height: "auto",
            filter: "drop-shadow(0 14px 24px rgb(0 0 0 / .55))",
          }}
        />
      </div>
      <div>
        <div
          className="eyebrow"
          style={{ color: "var(--char-vega)" }}
        >
          {t("eyebrow", { time: dashboard.shipTime })}
        </div>
        <h1
          style={{
            fontSize: 40,
            margin: "8px 0 14px",
            letterSpacing: "-.035em",
            lineHeight: 1.05,
            textWrap: "pretty",
          }}
        >
          {t(greetingKey, { name: dashboard.greetingName })}{" "}
          {t.rich(messageKey, {
            accent: (chunks) => (
              <span style={{ color: "var(--char-vega)" }}>{chunks}</span>
            ),
          })}
        </h1>
        <div className="row gap-3">
          {dashboard.continueAt ? (
            <Link
              href={`/tracks/${dashboard.continueAt.next.trackSlug}/${dashboard.continueAt.next.courseSlug}/${dashboard.continueAt.next.stepSlug}`}
              className="btn btn-cta"
            >
              {t("ctaContinue", {
                minutes: dashboard.continueAt.estimatedMinutesLeft,
              })}
            </Link>
          ) : (
            <Link href="/tracks" className="btn btn-cta">
              {t("ctaStart")}
            </Link>
          )}
          <Link href="/tracks" className="btn btn-ghost">
            {t("ctaMap")}
          </Link>
        </div>
      </div>
    </div>
  )
}
