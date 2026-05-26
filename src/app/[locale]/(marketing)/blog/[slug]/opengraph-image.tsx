import { ImageResponse } from "next/og"

import { getPostBySlug } from "@/modules/blog/service"
import type { BlogLocale } from "@/modules/blog/types"

export const runtime = "nodejs"
export const revalidate = 300
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export const alt = "Naveo blog post"

type Props = {
  params: Promise<{ locale: BlogLocale; slug: string }>
}

const CATEGORY_LABELS: Record<string, string> = {
  prompting: "Prompting",
  skills: "Skills",
  mcp: "MCP",
  agents: "Agents",
  tooling: "Tooling",
  workflows: "Workflows",
  comparisons: "Comparisons",
}

export default async function OpengraphImage({ params }: Props) {
  const { locale, slug } = await params
  const post = await getPostBySlug(locale, slug)
  const title = post?.title ?? "Naveo"
  const category = post?.category ? (CATEGORY_LABELS[post.category] ?? post.category) : "Blog"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "#0a0a0a",
          fontFamily: "system-ui, sans-serif",
          color: "#f0ede4",
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 12% 22%, rgba(255,255,255,0.45), transparent 70%),radial-gradient(1.4px 1.4px at 78% 12%, rgba(255,255,255,0.32), transparent 70%),radial-gradient(1.4px 1.4px at 86% 78%, rgba(255,255,255,0.36), transparent 70%),radial-gradient(1.6px 1.6px at 48% 14%, rgba(212,162,76,0.45), transparent 70%),radial-gradient(1.6px 1.6px at 68% 92%, rgba(127,202,208,0.4), transparent 70%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Wordmark — simplified inline mark to avoid font/SVG loading issues */}
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #4c768a 0%, #2a4858 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.16)",
            }}
          >
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "#d4a24c",
              }}
            />
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 700,
              letterSpacing: "-1px",
              display: "flex",
              alignItems: "center",
            }}
          >
            naveo<span style={{ color: "#d4a24c" }}>.</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 14px",
              borderRadius: "999px",
              background: "rgba(127,202,208,0.18)",
              color: "#7fcad0",
              fontSize: "16px",
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {category}
          </div>
          <div
            style={{
              fontSize: title.length > 80 ? "52px" : "64px",
              fontWeight: 700,
              letterSpacing: "-1.5px",
              lineHeight: 1.05,
              maxWidth: "1000px",
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#7a766c",
            fontSize: "18px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          <span>naveo.space/blog</span>
          <span>Aprende a coordinarte con la crew</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
