import { getTranslations } from "next-intl/server"

import type { DashboardCommsMessage } from "../types"

type Props = {
  comms: DashboardCommsMessage[]
}

// "Ship comms · live" feed in the right aside. 3-column row per message
// (avatar / name+body / time-ago).
export async function ShipComms({ comms }: Props) {
  const t = await getTranslations("bridge.comms")
  return (
    <>
      <div className="section-title">{t("title").toUpperCase()}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {comms.map((m) => (
          <div
            key={m.slug}
            style={{
              display: "grid",
              gridTemplateColumns: "32px 1fr auto",
              gap: 10,
              padding: "10px 12px",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              alignItems: "start",
            }}
          >
            <img
              src={`/cast/${m.slug}.svg`}
              alt=""
              style={{ width: 32, height: 38, objectFit: "contain" }}
            />
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 12,
                  color: m.color,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: ".1em",
                }}
              >
                {m.name.toUpperCase()}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--fg-muted)",
                  marginTop: 3,
                  lineHeight: 1.4,
                }}
              >
                {t(`messages.${m.messageKey}`)}
              </div>
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9.5,
                color: "var(--fg-dim)",
                letterSpacing: ".12em",
              }}
            >
              {m.ago}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
