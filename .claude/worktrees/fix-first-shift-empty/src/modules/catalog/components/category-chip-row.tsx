import { getTranslations } from "next-intl/server"

import type { CatalogChip } from "../types"

type Props = {
  chips: readonly CatalogChip[]
  active?: string
}

// Filter chips for the catalog. Static / non-interactive this pass — we don't
// have track tags in content yet. Active chip gets the `.active` modifier.
export async function CategoryChipRow({ chips, active = "all" }: Props) {
  const t = await getTranslations("tracks.list.chips")
  return (
    <div className="chip-row">
      {chips.map((chip) => (
        <span
          key={chip.id}
          className={"chip" + (active === chip.id ? " active" : "")}
        >
          {chip.icon ? <span className="chip-glyph">{chip.icon}</span> : null}
          <span>{t(chip.labelKey)}</span>
          {chip.count != null ? (
            <span className="chip-count">{chip.count}</span>
          ) : null}
        </span>
      ))}
    </div>
  )
}
