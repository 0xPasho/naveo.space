import { Check } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Card, Eyebrow } from "@/common/components/ui"
import { CAST } from "@/modules/cast/data"
import { CrewCharacter } from "@/modules/crew"

type Props = {
  signingOfficer: "vega" | "atlas" | "echo" | "forge" | "orbit" | "hex"
}

// "What you'll clear" debrief card. Title + signing officer pill on the
// right, then a 2-column grid of checkmarked points.
export async function LearnCard({ signingOfficer }: Props) {
  const t = await getTranslations("tracks.detail.debrief")
  const points = t.raw("points") as string[]
  const officer = CAST.find((m) => m.slug === signingOfficer)

  return (
    <Card className="overflow-hidden p-5 sm:p-6">
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Eyebrow className="text-primary">
            {t("eyebrow")} · {t("eyebrowAccent")}
          </Eyebrow>
          <h2 className="mt-1.5 font-display font-bold text-2xl tracking-tight leading-tight text-ink-1">
            {t("title")}
          </h2>
        </div>
        <div className="flex min-w-0 items-center gap-3 sm:shrink-0">
          <span className="grid size-12 place-items-center overflow-hidden rounded-full border-2 border-line-strong bg-bg-raised">
            <CrewCharacter
              slug={signingOfficer}
              size="full"
              title={officer?.name ?? signingOfficer}
            />
          </span>
          <div className="min-w-0">
            <div className="truncate font-display font-bold text-sm text-ink-1">
              {officer?.name ?? ""}
            </div>
            <div className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
              {t("officerRole")}
            </div>
          </div>
        </div>
      </header>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {points.map((point, i) => (
          <li
            key={i}
            className="flex items-start gap-2.5 font-sans font-semibold text-sm text-ink-1"
          >
            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
              <Check className="size-3" strokeWidth={3} />
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
