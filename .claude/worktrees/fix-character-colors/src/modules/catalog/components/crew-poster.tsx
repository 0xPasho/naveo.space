import type { CSSProperties } from "react"

type Props = {
  mascot: "vega" | "atlas" | "echo" | "forge"
  label: string
  color: string
}

// Tarot-card mascot poster from the Claude Design package — a crew dossier
// with rank ribbon, holo lattice, starfield, mascot silhouette, and 4 corner
// brackets. Caller decides label text (rank or "mission cleared"). Pure
// presentational; CSS lives in `../styles.css` under `.crew-catalog`.
export function CrewPoster({ mascot, label, color }: Props) {
  const style = { "--poster-accent": color } as CSSProperties
  return (
    <div className="crew-poster" style={style}>
      <div className="poster-ribbon">
        <span className="ribbon-bolt left" />
        <span className="ribbon-text">{label}</span>
        <span className="ribbon-bolt right" />
      </div>
      <div className="poster-frame">
        <div className="poster-lattice" />
        <div className="poster-stars" />
        <img
          className="poster-mascot"
          src={`/cast/${mascot}.svg`}
          alt={mascot}
        />
        <div className="poster-corner tl" />
        <div className="poster-corner tr" />
        <div className="poster-corner bl" />
        <div className="poster-corner br" />
      </div>
    </div>
  )
}
