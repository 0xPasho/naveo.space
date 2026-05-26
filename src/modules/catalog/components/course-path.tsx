import { Lock, Star } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Eyebrow } from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"
import { cn } from "@/common/lib/utils"
import { CrewCharacter } from "@/modules/crew"

import type { CoursePathNode as PathNode, CourseDetail } from "../types"
import { COURSE_MAP_ANCHOR_ID } from "./scroll-to-map-button"

type Mascot = "vega" | "atlas" | "echo" | "forge" | "orbit" | "hex"
type NodeTone =
  | "prompting"
  | "mcp"
  | "skills"
  | "agents"
  | "tooling"
  | "evals"

const MASCOT_TONE: Record<Mascot, NodeTone> = {
  vega: "skills",
  atlas: "mcp",
  echo: "prompting",
  forge: "evals",
  orbit: "tooling",
  hex: "agents",
}

const TONE_DISC: Record<NodeTone, string> = {
  prompting:
    "bg-track-prompting text-track-prompting-ink shadow-[0_6px_0_0_var(--track-prompting-shadow)]",
  mcp: "bg-track-mcp text-white shadow-[0_6px_0_0_var(--track-mcp-shadow)]",
  skills:
    "bg-track-skills text-track-skills-ink shadow-[0_6px_0_0_var(--track-skills-shadow)]",
  agents:
    "bg-track-agents text-white shadow-[0_6px_0_0_var(--track-agents-shadow)]",
  tooling:
    "bg-track-tooling text-track-tooling-ink shadow-[0_6px_0_0_var(--track-tooling-shadow)]",
  evals:
    "bg-track-evals text-white shadow-[0_6px_0_0_var(--track-evals-shadow)]",
}

type Props = {
  detail: CourseDetail
  nodes: PathNode[]
  // When true, skip the inline "Course path · N/N steps cleared" header.
  hideHeader?: boolean
}

// Single continuous winding course path. Section grouping was removed —
// chunking by N nodes produced generic "Leg N" banners that didn't reflect
// the actual content. A content-aware grouping (frontmatter-driven) can
// come back later.
export async function CoursePath({ detail, nodes, hideHeader = false }: Props) {
  const t = await getTranslations("tracks.detail.path")
  const tone = MASCOT_TONE[detail.mascot as Mascot] ?? "prompting"

  return (
    <section id={COURSE_MAP_ANCHOR_ID} className="flex flex-col gap-6">
      {hideHeader ? null : (
        <header className="flex items-center justify-between gap-3">
          <h2 className="font-display font-bold text-xl tracking-tight text-ink-1">
            {t("title")}
          </h2>
          <Eyebrow>
            {t("meta", {
              done: detail.summary.stepsDone,
              total: detail.summary.stepsTotal,
            })}
          </Eyebrow>
        </header>
      )}

      <PathSection
        nodes={nodes}
        sectionStartIndex={0}
        mascot={detail.mascot as Mascot}
        tone={tone}
        trackSlug={detail.trackSlug}
        continueLabel={t("continueTooltip")}
      />
    </section>
  )
}

type SectionProps = {
  nodes: PathNode[]
  sectionStartIndex: number
  mascot: Mascot
  tone: NodeTone
  trackSlug: string
  continueLabel: string
}

function PathSection({
  nodes,
  sectionStartIndex,
  mascot,
  tone,
  trackSlug,
  continueLabel,
}: SectionProps) {
  return (
    <>
      <PathCanvas
        className="md:hidden"
        nodes={nodes}
        sectionStartIndex={sectionStartIndex}
        mascot={mascot}
        tone={tone}
        trackSlug={trackSlug}
        continueLabel={continueLabel}
        width={320}
        row={112}
        center={160}
        amplitude={42}
        nodeSize={72}
        bossSize={92}
      />
      <PathCanvas
        className="hidden md:block"
        nodes={nodes}
        sectionStartIndex={sectionStartIndex}
        mascot={mascot}
        tone={tone}
        trackSlug={trackSlug}
        continueLabel={continueLabel}
        width={560}
        row={120}
        center={280}
        amplitude={75}
        nodeSize={88}
        bossSize={116}
      />
    </>
  )
}

type CanvasProps = SectionProps & {
  className?: string
  width: number
  row: number
  center: number
  amplitude: number
  nodeSize: number
  bossSize: number
}

function PathCanvas({
  className,
  nodes,
  sectionStartIndex,
  mascot,
  tone,
  trackSlug,
  continueLabel,
  width,
  row,
  center,
  amplitude,
  nodeSize,
  bossSize,
}: CanvasProps) {
  const xWave = (i: number) => {
    const seq = [0, 1, 2, 1, 0, -1, -2, -1]
    return seq[i % seq.length] ?? 0
  }
  const xPx = (i: number) => center + xWave(i + sectionStartIndex) * amplitude
  const yPx = (i: number) => 60 + i * row
  const totalH = Math.max(1, nodes.length) * row + 40

  return (
    <div
      className={cn("relative mx-auto w-full overflow-hidden", className)}
      style={{ height: totalH, maxWidth: width }}
    >
      {nodes.map((node, i) => (
        <PathNodeEl
          key={`${node.courseSlug}/${node.stepSlug}`}
          node={node}
          mascot={mascot}
          tone={tone}
          trackSlug={trackSlug}
          x={xPx(i)}
          y={yPx(i)}
          size={nodeKind(node) === "boss" ? bossSize : nodeSize}
          continueLabel={continueLabel}
        />
      ))}
    </div>
  )
}

type NodeProps = {
  node: PathNode
  mascot: Mascot
  tone: NodeTone
  trackSlug: string
  x: number
  y: number
  size: number
  continueLabel: string
}

function PathNodeEl({
  node,
  mascot,
  tone,
  trackSlug,
  x,
  y,
  size,
  continueLabel,
}: NodeProps) {
  const kind = nodeKind(node)
  const href = `/tracks/${trackSlug}/${node.courseSlug}/${node.stepSlug}`
  const isInteractive = kind === "current" || kind === "done" || kind === "active"

  const discClass = cn(
    "relative flex size-full items-center justify-center rounded-full transition-[transform,box-shadow] duration-fast ease-out",
    kind === "locked"
      ? "bg-bg-raised text-ink-4 shadow-[0_6px_0_0_rgba(0,0,0,0.5)] grayscale opacity-50 cursor-not-allowed"
      : `${TONE_DISC[tone]} active:translate-y-1.5 active:shadow-none`,
    kind === "current" &&
      "ring-8 ring-offset-2 ring-offset-bg-deep ring-primary/40",
  )

  const inner = (
    <>
      {kind === "current" ? (
        <CrewCharacter slug={mascot} size="full" className="size-4/5" />
      ) : kind === "done" ? (
        <span className="font-display font-bold text-3xl">✓</span>
      ) : kind === "active" ? (
        <Star className="size-1/2" strokeWidth={2.5} fill="currentColor" />
      ) : kind === "boss" ? (
        <Star className="size-1/2" strokeWidth={2.5} fill="currentColor" />
      ) : (
        <Lock className="size-1/3" strokeWidth={2.5} />
      )}
    </>
  )

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
      }}
    >
      {kind === "current" ? (
        <div className="relative mb-2 max-w-[180px] truncate rounded-xs bg-white px-3 py-1 font-display font-bold text-[12px] uppercase tracking-wide text-bg-deep shadow-elev-1 md:max-w-none">
          <span className="block truncate">{continueLabel}</span>
          <div className="absolute left-1/2 top-full size-0 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-white" />
        </div>
      ) : null}

      {isInteractive ? (
        <Link
          href={href}
          className={discClass}
          style={{ width: size, height: size }}
        >
          {inner}
        </Link>
      ) : (
        <div className={discClass} style={{ width: size, height: size }}>
          {inner}
        </div>
      )}

      <div className="mt-2 max-w-[140px] text-center font-sans font-bold text-xs leading-snug text-ink-2">
        {node.stepTitle}
      </div>
    </div>
  )
}

function nodeKind(node: PathNode) {
  if (node.isBoss && node.status !== "done") return "boss"
  if (node.status === "done") return "done"
  if (node.status === "current") return "current"
  if (node.status === "active") return "active"
  return "locked"
}
