import type { Character } from "@/modules/cast/types"

export type CrewPreviewSlug = Character["slug"]

export type CrewPreviewMember = {
  slug: CrewPreviewSlug
  // Proper noun, kept inline (matches modules/dashboard/data.ts pattern).
  name: string
  // Looks up `dashboardBridge.crew.roles.<roleKey>` in messages — reuses the
  // dashboard's existing role labels so the same character reads the same
  // across landing and signed-in surfaces.
  roleKey: CrewPreviewSlug
  // CSS color expression — character ribbon from tokens.
  color: string
}

export type PillarTone = "cyan" | "gold" | "magenta" | "green"

export type Pillar = {
  // i18n key suffix under home.pillars.items.<key>
  key: "prompts" | "tools" | "mcp" | "agents"
  tone: PillarTone
}
