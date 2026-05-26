import { createElement } from "react"

import type { StepDemo } from "@/modules/content/types"

import { getDemo } from "../demos/registry"

type Props = {
  demo: StepDemo
}

export function DemoMount({ demo }: Props) {
  const component = getDemo(demo.id)

  if (!component) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        Demo not found: <code className="font-mono">{demo.id}</code>
      </div>
    )
  }

  return createElement(component, { props: demo.props })
}
