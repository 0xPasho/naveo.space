import type { MDXRemoteProps } from "next-mdx-remote/rsc"
import type { ReactElement, ReactNode } from "react"
import { isValidElement } from "react"

import { cn } from "@/common/lib/utils"

import { Callout } from "./callout"
import { Character } from "./character"
import { DecisionChain } from "./decision-chain"
import { DecisionFlow } from "./decision-flow"
import { PromptEditor } from "./prompt-editor"

const isCodeChild = (
  child: ReactNode,
): child is ReactElement<{ className?: string; children?: ReactNode }> => {
  if (!isValidElement(child)) return false
  const t = (child as ReactElement).type
  if (typeof t !== "string") return false
  return t === "code"
}

const extractText = (node: ReactNode): string => {
  if (node === null || node === undefined || node === false) return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (isValidElement(node)) {
    const children = (node.props as { children?: ReactNode }).children
    return extractText(children)
  }
  return ""
}

// Languages that get the rich PromptEditor treatment (CodeMirror with syntax
// highlighting). Other languages — and fences with no language — use the
// design's `.mdx-code` wrapper with a small header.
const PROMPT_LANGS = new Set(["markdown", "md", "xml", "html"])

type AnyHTMLProps = React.HTMLAttributes<HTMLElement>

export const mdxComponents: MDXRemoteProps["components"] = {
  // Tailwind utility classes on the reading-pane (in lessons) drive the
  // typography for headings/paragraphs/lists. Here we override only the
  // pieces that need component-level shape: anchors, hr, tables, code.
  a: ({ className, ...props }) => (
    <a
      className={cn(
        "font-bold text-primary underline underline-offset-2 hover:text-primary/80",
        className,
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-6 border-line-soft", className)} {...props} />
  ),
  // Tables (GFM, requires remark-gfm). Wrapper allows horizontal scroll on
  // narrow content panes.
  table: ({ className, ...props }: AnyHTMLProps) => (
    <div className="my-4 overflow-x-auto rounded-md border-2 border-line-soft bg-bg-surface">
      <table
        className={cn(
          "w-full border-collapse text-sm",
          "[&_th]:bg-bg-raised [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-display [&_th]:text-xs [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-ink-3",
          "[&_td]:border-t [&_td]:border-line-soft [&_td]:px-3 [&_td]:py-2 [&_td]:text-ink-2",
          className,
        )}
        {...props}
      />
    </div>
  ),
  pre: ({ className, children, ...props }) => {
    const childArr = Array.isArray(children) ? children : [children]
    const codeChild = childArr.find(isCodeChild)
    const codeClass = codeChild?.props.className ?? ""
    const match = /language-([a-zA-Z0-9-]+)/.exec(codeClass)
    const lang = match?.[1]?.toLowerCase() ?? ""
    const text = extractText(codeChild?.props.children).replace(/\n+$/, "")

    if (PROMPT_LANGS.has(lang)) {
      const editorLang = lang === "xml" || lang === "html" ? "xml" : "markdown"
      return (
        <div
          className={cn(
            "my-4 overflow-hidden rounded-md border-2 border-line-soft",
            className,
          )}
        >
          <div className="flex items-center justify-between border-b-2 border-line-soft bg-bg-raised px-3 py-1.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
              {lang}
            </span>
          </div>
          <PromptEditor
            value={text}
            readOnly
            language={editorLang}
            minHeight={80}
            maxHeight={420}
          />
        </div>
      )
    }

    return (
      <div
        className={cn(
          "my-4 overflow-hidden rounded-md border-2 border-line-soft bg-bg-sunken shadow-elev-inset",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between border-b-2 border-line-soft bg-bg-raised px-3 py-1.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
            {lang || "code"}
          </span>
        </div>
        <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-ink-2">
          <code>{text}</code>
        </pre>
      </div>
    )
  },
  Callout,
  Character,
  DecisionChain,
  DecisionFlow,
}
