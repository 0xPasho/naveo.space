"use client"

import type { ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/common/lib/utils"

import { DecisionChain } from "./decision-chain"
import { DecisionFlow } from "./decision-flow"

type Props = {
  // Markdown source. Comes from MDX frontmatter (`exercise.task`,
  // `exercise.question`) or from i18n message catalog. Inline markdown
  // (bold, italic, inline code) and short lists are expected. May also
  // contain `<Character name="..." />` mentions copied from MDX bodies,
  // we preprocess those into the canonical name (bold + stat-xp accent
  // applied via this component's `[&_strong]` rule) since ReactMarkdown
  // doesn't run JSX. `<DecisionFlow .../>` is parsed out and rendered as
  // the actual component between markdown chunks.
  text: string
  className?: string
}

// Canonical names per docs/plan/cast.md. Keep aligned with
// `src/common/components/character.tsx`.
const CHARACTER_NAMES: Record<string, string> = {
  vega: "Vega",
  atlas: "Atlas",
  echo: "Echo",
  forge: "Forge",
}

// Matches `<Character name="vega" />` (self-closing) or
// `<Character name="vega">label</Character>` (with body override).
const CHARACTER_RE =
  /<Character\s+name="(\w+)"\s*\/>|<Character\s+name="(\w+)"\s*>([^<]*)<\/Character>/g

const preprocess = (raw: string): string =>
  raw.replace(CHARACTER_RE, (_match, selfClosingSlug, openSlug, label) => {
    const slug = (selfClosingSlug ?? openSlug ?? "").toLowerCase()
    const fallback = label?.trim() || CHARACTER_NAMES[slug] || slug
    // Bold so the name reads as a proper noun. The `[&_strong]:text-stat-xp`
    // rule on this component's wrapper turns it gold.
    return `**${fallback}**`
  })

// Self-closing JSX matcher that allows `>` and `<` inside double-quoted
// attribute values. Captures everything between the tag name and `/>` so
// `parseAttrs` can pick off attr="value" pairs.
const JSX_TAG_RE = /<(DecisionFlow|DecisionChain)((?:\s+\w+="[^"]*")+)\s*\/>/g

const parseAttrs = (attrs: string): Record<string, string> => {
  const out: Record<string, string> = {}
  const re = /(\w+)="([^"]*)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(attrs)) !== null) {
    out[m[1]] = m[2]
  }
  return out
}

const renderTag = (
  name: string,
  attrs: Record<string, string>,
  key: string,
): ReactNode => {
  if (name === "DecisionFlow") {
    return (
      <DecisionFlow
        key={key}
        condition={attrs.condition ?? ""}
        ifLabel={attrs.ifLabel}
        elseLabel={attrs.elseLabel}
        ifAction={attrs.ifAction ?? ""}
        elseAction={attrs.elseAction ?? ""}
      />
    )
  }
  return (
    <DecisionChain
      key={key}
      branches={attrs.branches ?? ""}
      fallback={attrs.fallback ?? ""}
      ifLabel={attrs.ifLabel}
      elseIfLabel={attrs.elseIfLabel}
      elseLabel={attrs.elseLabel}
    />
  )
}

const renderSegments = (text: string): ReactNode[] => {
  const nodes: ReactNode[] = []
  let cursor = 0
  let key = 0
  const re = new RegExp(JSX_TAG_RE)
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const before = text.slice(cursor, m.index)
    if (before.trim()) {
      nodes.push(
        <ReactMarkdown key={`md-${key++}`} remarkPlugins={[remarkGfm]}>
          {preprocess(before)}
        </ReactMarkdown>,
      )
    }
    nodes.push(renderTag(m[1], parseAttrs(m[2]), `jsx-${key++}`))
    cursor = re.lastIndex
  }
  const tail = text.slice(cursor)
  if (tail.trim()) {
    nodes.push(
      <ReactMarkdown key={`md-${key++}`} remarkPlugins={[remarkGfm]}>
        {preprocess(tail)}
      </ReactMarkdown>,
    )
  }
  return nodes
}

// Renders the exercise prompt header with markdown formatting. Styled
// inline with Tailwind utilities — name mentions get bold + stat-xp accent
// via the strong child selector.
export function ExerciseQuestion({ text, className }: Props) {
  return (
    <div
      className={cn(
        "font-display text-2xl font-bold leading-tight tracking-tight text-ink-1",
        "[&_strong]:font-bold [&_strong]:text-stat-xp",
        "[&_em]:not-italic [&_em]:text-ink-2",
        "[&_code]:rounded-xs [&_code]:bg-bg-sunken [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-base [&_code]:text-primary",
        "[&_pre]:mt-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border-2 [&_pre]:border-line-soft [&_pre]:bg-bg-sunken [&_pre]:p-4 [&_pre]:shadow-elev-inset",
        "[&_pre_code]:block [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-mono [&_pre_code]:text-sm [&_pre_code]:font-normal [&_pre_code]:leading-relaxed [&_pre_code]:text-ink-2",
        "[&_p]:m-0 [&_p+p]:mt-2",
        "[&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-base [&_ul]:font-semibold [&_ul]:text-ink-2",
        "[&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-base [&_ol]:font-semibold [&_ol]:text-ink-2",
        className,
      )}
      role="heading"
      aria-level={2}
    >
      {renderSegments(text)}
    </div>
  )
}
