"use client"

import CodeMirror from "@uiw/react-codemirror"
import { markdown } from "@codemirror/lang-markdown"
import { xml } from "@codemirror/lang-xml"
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { EditorView } from "@codemirror/view"
import { tags as t } from "@lezer/highlight"
import { useMemo } from "react"

type Language = "markdown" | "xml"

type Props = {
  value: string
  // Optional: omit when `readOnly` is true.
  onChange?: (next: string) => void
  placeholder?: string
  readOnly?: boolean
  language?: Language
  minHeight?: number
  maxHeight?: number
  className?: string
}

const noop = () => {}

// Crew theme highlight rules. Tokens come from globals.css. We re-use the
// design-system accents so XML tags read cyan (machine), strings/headings read
// gold (warm), and emphasis/keywords read magenta (mission).
const crewHighlight = HighlightStyle.define([
  { tag: t.heading, color: "var(--brand-gold)", fontWeight: "700" },
  { tag: t.heading1, color: "var(--brand-gold)", fontWeight: "700" },
  { tag: t.heading2, color: "var(--brand-gold)", fontWeight: "700" },
  { tag: t.heading3, color: "var(--brand-gold)", fontWeight: "700" },
  { tag: t.strong, color: "var(--fg)", fontWeight: "700" },
  { tag: t.emphasis, color: "var(--fg-muted)", fontStyle: "italic" },
  { tag: t.link, color: "var(--brand-cyan)", textDecoration: "underline" },
  { tag: t.url, color: "var(--brand-cyan)" },
  { tag: t.monospace, color: "var(--signal-cyan)" },
  { tag: t.comment, color: "var(--fg-dim)", fontStyle: "italic" },
  { tag: t.tagName, color: "var(--signal-cyan)", fontWeight: "600" },
  { tag: t.attributeName, color: "var(--fg-muted)" },
  { tag: t.attributeValue, color: "var(--xp-gold)" },
  { tag: t.string, color: "var(--xp-gold)" },
  { tag: t.number, color: "var(--mission-magenta)" },
  { tag: t.bool, color: "var(--mission-magenta)" },
  { tag: t.keyword, color: "var(--mission-magenta)" },
  { tag: t.bracket, color: "var(--fg-dim)" },
  { tag: t.angleBracket, color: "var(--signal-cyan)" },
  { tag: t.processingInstruction, color: "var(--fg-dim)" },
  { tag: t.content, color: "var(--fg)" },
])

const crewTheme = EditorView.theme(
  {
    "&": {
      color: "var(--fg)",
      backgroundColor: "transparent",
      fontSize: "13px",
    },
    ".cm-editor": {
      backgroundColor: "transparent",
    },
    ".cm-content": {
      caretColor: "var(--brand-cyan)",
      color: "var(--fg)",
      fontFamily: "var(--font-mono)",
      padding: "12px 14px",
      backgroundColor: "transparent",
    },
    ".cm-scroller": {
      fontFamily: "var(--font-mono)",
      lineHeight: "1.55",
      backgroundColor: "transparent",
    },
    ".cm-line": { padding: "0", backgroundColor: "transparent" },
    ".cm-gutters": { display: "none" },
    "&.cm-focused": { outline: "none" },
    ".cm-placeholder": {
      color: "var(--fg-dim)",
      fontStyle: "italic",
      opacity: "0.9",
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: "var(--brand-cyan-soft) !important",
      },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "var(--brand-cyan)",
    },
    ".cm-activeLine": {
      backgroundColor: "transparent",
    },
  },
  { dark: true },
)

export function PromptEditor({
  value,
  onChange,
  placeholder,
  readOnly = false,
  language = "markdown",
  minHeight = 200,
  maxHeight,
  className,
}: Props) {
  const extensions = useMemo(
    () => [
      language === "xml" ? xml() : markdown(),
      syntaxHighlighting(crewHighlight),
      EditorView.lineWrapping,
    ],
    [language],
  )

  return (
    <div
      className={className}
      style={{ minHeight: `${minHeight}px`, display: "flex" }}
    >
      <CodeMirror
        value={value}
        onChange={onChange ?? noop}
        placeholder={placeholder}
        readOnly={readOnly}
        editable={!readOnly}
        height="100%"
        minHeight={`${minHeight}px`}
        maxHeight={maxHeight ? `${maxHeight}px` : undefined}
        width="100%"
        theme={crewTheme}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
          searchKeymap: false,
          dropCursor: false,
          allowMultipleSelections: false,
        }}
        extensions={extensions}
        style={{ flex: 1, minHeight: `${minHeight}px` }}
      />
    </div>
  )
}
