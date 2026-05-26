import { cn } from "@/common/lib/utils"

type Props = {
  className?: string
  children?: React.ReactNode
}

// Minimal code block. Shiki integration is deferred — when added, swap the
// inner <code> render for a Shiki-highlighted token tree.
export function CodeBlock({ className, children }: Props) {
  return (
    <pre
      data-slot="code-block"
      className={cn(
        "my-4 overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 font-mono text-sm leading-relaxed text-foreground",
        className,
      )}
    >
      <code>{children}</code>
    </pre>
  )
}
