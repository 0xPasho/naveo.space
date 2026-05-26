import { Info, Lightbulb, TriangleAlert } from "lucide-react"

import { cn } from "@/common/lib/utils"

type CalloutType = "info" | "warning" | "tip"

const styles: Record<
  CalloutType,
  {
    container: string
    icon: typeof Info
    iconClass: string
  }
> = {
  info: {
    container: "border-border bg-muted/40",
    icon: Info,
    iconClass: "text-foreground",
  },
  warning: {
    container: "border-destructive/30 bg-destructive/5",
    icon: TriangleAlert,
    iconClass: "text-destructive",
  },
  tip: {
    container: "border-border bg-muted/40",
    icon: Lightbulb,
    iconClass: "text-foreground",
  },
}

type Props = {
  type?: CalloutType
  title?: string
  children: React.ReactNode
  className?: string
}

export function Callout({ type = "info", title, children, className }: Props) {
  const { container, icon: Icon, iconClass } = styles[type]
  return (
    <div
      data-slot="callout"
      className={cn(
        "my-4 flex gap-3 rounded-lg border p-4",
        container,
        className,
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", iconClass)} />
      <div className="flex-1 space-y-1 text-sm leading-relaxed">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="[&>p:first-child]:mt-0 [&>p:last-child]:mb-0">{children}</div>
      </div>
    </div>
  )
}
