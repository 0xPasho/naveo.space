"use client"

import CodeMirror from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { json } from "@codemirror/lang-json"
import { markdown } from "@codemirror/lang-markdown"
import { xml } from "@codemirror/lang-xml"
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { EditorView } from "@codemirror/view"
import { tags as t } from "@lezer/highlight"
import { useMemo } from "react"

// Languages with dedicated CodeMirror grammar packs installed. `python` still
// has no pack and falls back to markdown highlighting (readable thanks to the
// naveoHighlight rules but without language-specific tokenization). Install
// `@codemirror/lang-python` if a Track needs richer Python highlighting.
type Language = "markdown" | "xml" | "json" | "javascript" | "python"

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

// Naveo Bridge highlight rules. Tokens come from globals.css. Tags get
// XP gold (warm milestone), prompting blue (machine), and stat-streak
// (warm pop for keywords/booleans) — track-coded, not theme-coded.
const naveoHighlight = HighlightStyle.define([
  { tag: t.heading, color: "var(--stat-xp)", fontWeight: "700" },
  { tag: t.heading1, color: "var(--stat-xp)", fontWeight: "700" },
  { tag: t.heading2, color: "var(--stat-xp)", fontWeight: "700" },
  { tag: t.heading3, color: "var(--stat-xp)", fontWeight: "700" },
  { tag: t.strong, color: "var(--ink-1)", fontWeight: "700" },
  { tag: t.emphasis, color: "var(--ink-2)", fontStyle: "italic" },
  { tag: t.link, color: "var(--track-prompting)", textDecoration: "underline" },
  { tag: t.url, color: "var(--track-prompting)" },
  { tag: t.monospace, color: "var(--track-prompting)" },
  { tag: t.comment, color: "var(--ink-3)", fontStyle: "italic" },
  { tag: t.tagName, color: "var(--track-prompting)", fontWeight: "600" },
  { tag: t.attributeName, color: "var(--ink-2)" },
  { tag: t.attributeValue, color: "var(--stat-xp)" },
  { tag: t.string, color: "var(--stat-xp)" },
  { tag: t.number, color: "var(--stat-streak)" },
  { tag: t.bool, color: "var(--stat-streak)" },
  { tag: t.keyword, color: "var(--stat-streak)" },
  { tag: t.bracket, color: "var(--ink-3)" },
  { tag: t.angleBracket, color: "var(--track-prompting)" },
  { tag: t.processingInstruction, color: "var(--ink-3)" },
  { tag: t.content, color: "var(--ink-1)" },
])

const naveoTheme = EditorView.theme(
  {
    "&": {
      color: "var(--ink-1)",
      backgroundColor: "transparent",
      fontSize: "13px",
    },
    ".cm-editor": {
      backgroundColor: "transparent",
    },
    ".cm-content": {
      caretColor: "var(--primary)",
      color: "var(--ink-1)",
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
      color: "var(--ink-3)",
      fontStyle: "italic",
      opacity: "0.9",
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: "var(--primary-soft) !important",
      },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "var(--primary)",
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
  const extensions = useMemo(() => {
    const langExt =
      language === "xml"
        ? xml()
        : language === "json"
          ? json()
          : language === "javascript"
            ? javascript()
            : markdown()
    return [
      langExt,
      syntaxHighlighting(naveoHighlight),
      EditorView.lineWrapping,
    ]
  }, [language])

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
        theme={naveoTheme}
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
