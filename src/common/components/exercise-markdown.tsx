"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/common/lib/utils"

type Props = {
  text: string
  className?: string
}

// Inline-markdown detection: bold (**x**), italic (*x*), inline code (`x`),
// links ([x](y)), headings, blockquotes, list bullets, or an explicit fenced
// code block. When NONE of these appear, the content is treated as raw
// code-like text and wrapped in a fenced block so whitespace + newlines are
// preserved (existing JSON/XML/system-user examples that pre-date markdown
// support in these runners).
export const looksLikeMarkdown = (s: string) =>
  /\*\*[^*\n]+\*\*/.test(s) ||
  /(^|[\s(])\*[^*\n]+\*([\s).,!?]|$)/.test(s) ||
  /`[^`\n]+`/.test(s) ||
  /\[[^\]]+\]\([^)]+\)/.test(s) ||
  /(^|\n)\s*(#{1,6}\s|>\s|[-*+]\s|\d+\.\s)/.test(s) ||
  /```/.test(s)

// Render exercise prose with markdown semantics, falling back to a fenced
// code block when the source looks like raw code. Designed for fields that
// historically were rendered as plain text inside <pre> (prompt-AB options,
// mcp-debug explanation, conversation-goal goal). The container class is
// passed by the caller so each runner controls its surrounding box.
export function ExerciseMarkdown({ text, className }: Props) {
  const md = looksLikeMarkdown(text) ? text : "```\n" + text + "\n```"
  return (
    <div className={cn("exer-md min-w-0", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // ReactMarkdown's default <pre> uses `white-space: pre`, which
          // does NOT wrap on whitespace and lets long lines overflow the
          // container — the bug that punched plain-text option bodies out
          // through the card's right edge in narrow side-by-side layouts
          // (prompt-AB, mcp-debug). Force soft-wrap so prose stays bounded,
          // and add `break-words` so URL-shaped runs without spaces still
          // wrap rather than push the card wider than the grid track.
          pre: ({ children, ...props }) => (
            <pre
              {...props}
              className="whitespace-pre-wrap break-words"
            >
              {children}
            </pre>
          ),
          code: ({ children, ...props }) => (
            <code {...props} className="whitespace-pre-wrap break-words">
              {children}
            </code>
          ),
        }}
      >
        {md}
      </ReactMarkdown>
    </div>
  )
}
