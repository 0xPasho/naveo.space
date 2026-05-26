import type { MDXRemoteProps } from "next-mdx-remote/rsc"
import type { ReactElement, ReactNode } from "react"
import { isValidElement } from "react"

import { cn } from "@/common/lib/utils"

import { Callout } from "./callout"
import { Character } from "./character"
import { PromptEditor } from "./prompt-editor"

// Extract { text, language } from an MDX fenced-code-block <pre> children tree.
// MDX renders ```xml … ``` as <pre><code className="language-xml">…</code></pre>.
// If the language is `markdown` or `xml`, we route through PromptEditor for the
// same syntax-highlighted look used in the lesson runners and workbench. For
// other languages (or no language), we fall back to a plain <pre>.
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

const PROMPT_LANGS = new Set(["markdown", "md", "xml", "html"])

type AnyHTMLProps = React.HTMLAttributes<HTMLElement>

const heading = (level: 1 | 2 | 3 | 4) => {
  const sizes = {
    1: "text-3xl mt-8 mb-4",
    2: "text-2xl mt-8 mb-3",
    3: "text-xl mt-6 mb-2",
    4: "text-lg mt-4 mb-2",
  } as const
  const Tag = `h${level}` as const
  return function Heading({ className, ...props }: AnyHTMLProps) {
    return (
      <Tag
        className={cn(
          "font-bold tracking-tight first:mt-0",
          sizes[level],
          className,
        )}
        {...props}
      />
    )
  }
}

export const mdxComponents: MDXRemoteProps["components"] = {
  h1: heading(1),
  h2: heading(2),
  h3: heading(3),
  h4: heading(4),
  p: ({ className, ...props }) => (
    <p className={cn("my-3 leading-7", className)} {...props} />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn("my-3 ml-6 list-disc space-y-1", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn("my-3 ml-6 list-decimal space-y-1", className)}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("leading-7", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-4 border-l-2 border-border pl-4 italic text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn("underline underline-offset-2 hover:text-primary", className)}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-6 border-border", className)} {...props} />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn(
        "rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]",
        className,
      )}
      {...props}
    />
  ),
  pre: ({ className, children, ...props }) => {
    // Detect language from the inner <code className="language-X"> child.
    const childArr = Array.isArray(children) ? children : [children]
    const codeChild = childArr.find(isCodeChild)
    const codeClass = codeChild?.props.className ?? ""
    const match = /language-([a-zA-Z0-9-]+)/.exec(codeClass)
    const lang = match?.[1]?.toLowerCase() ?? ""

    if (PROMPT_LANGS.has(lang)) {
      const text = extractText(codeChild?.props.children).replace(/\n+$/, "")
      const editorLang = lang === "xml" || lang === "html" ? "xml" : "markdown"
      return (
        <div
          className={cn(
            "my-4 overflow-hidden rounded-lg border border-border bg-card/40",
            className,
          )}
        >
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
      <pre
        className={cn(
          "my-4 overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 font-mono text-sm leading-relaxed text-foreground",
          "[&_code]:rounded-none [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit",
          className,
        )}
        {...props}
      >
        {children}
      </pre>
    )
  },
  Callout,
  Character,
}
