import { getTranslations, setRequestLocale } from "next-intl/server"

import "@/modules/catalog/styles.css"

import { SidebarShell } from "@/common/layout/sidebar-shell"
import type { ContentLocale } from "@/modules/content/types"
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "180px 1fr",
          gap: 28,
          alignItems: "end",
          marginBottom: 8,
        }}
      >
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  inset: "auto 0 -16px 0",
                  height: 24,
                  background:
                    "radial-gradient(50% 100% at 50% 0%, oklch(0 0 0 / .55), transparent 70%)",
                  filter: "blur(6px)",
                }}
              />
              <img
                src="/cast/forge.svg"
                alt=""
                style={{
                  width: 180,
                  height: "auto",
                  filter: "drop-shadow(0 10px 18px rgb(0 0 0 / .5))",
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: ".2em",
                  textTransform: "uppercase",
                  color: "var(--forge-orange)",
                }}
              >
                {t("eyebrow")}
              </div>
              <h1
                style={{
                  fontSize: 36,
                  margin: "8px 0 10px",
                  letterSpacing: "-.035em",
                  lineHeight: 1.05,
                }}
              >
                {t("title")}
              </h1>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: "var(--fg-muted)",
                  maxWidth: 640,
                  margin: 0,
                }}
              >
                {t("body")}
              </p>
            </div>
          </div>

      <PromptPlaygroundDemo />
    </SidebarShell>
  )
}
