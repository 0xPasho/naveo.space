import { getTranslations } from "next-intl/server"

import { Link } from "@/common/i18n/navigation"
import { SidebarShell } from "@/common/layout/sidebar-shell"

type Feature = "practice" | "crew" | "leaderboard" | "shop"

const FEATURE_META: Record<
  Feature,
  { mascot: "vega" | "atlas" | "echo" | "forge"; ribbon: string }
> = {
  practice: { mascot: "echo", ribbon: "var(--char-echo)" },
  crew: { mascot: "vega", ribbon: "var(--char-vega)" },
  leaderboard: { mascot: "atlas", ribbon: "var(--char-atlas)" },
  shop: { mascot: "vega", ribbon: "var(--char-vega)" },
}

type Props = {
  feature: Feature
}

export async function ComingSoonView({ feature }: Props) {
  const t = await getTranslations("comingSoon")
  const meta = FEATURE_META[feature]

  return (
    <SidebarShell>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 36,
              alignItems: "center",
              maxWidth: 960,
              margin: "48px auto 0",
              padding: "32px 16px",
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
                src={`/cast/${meta.mascot}.svg`}
                alt=""
                style={{
                  width: 260,
                  height: "auto",
                  filter: "drop-shadow(0 14px 24px rgb(0 0 0 / .55))",
                }}
              />
            </div>
            <div>
              <div
                className="eyebrow magenta"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: ".2em",
                  textTransform: "uppercase",
                  color: meta.ribbon,
                }}
              >
                {t("eyebrow")}
              </div>
              <h1
                style={{
                  fontSize: 40,
                  margin: "10px 0 16px",
                  letterSpacing: "-.035em",
                  lineHeight: 1.05,
                }}
              >
                {t(`${feature}.title`)}
              </h1>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: "var(--fg-muted)",
                  maxWidth: 520,
                  margin: "0 0 24px",
                }}
              >
                {t(`${feature}.body`)}
              </p>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Link href="/tracks" className="btn btn-cta">
                  {t("ctaBack")}
                </Link>
                <Link href="/dashboard" className="btn btn-ghost">
                  {t("ctaDashboard")}
                </Link>
              </div>
            </div>
      </div>
    </SidebarShell>
  )
}
