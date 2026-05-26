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
      <div className="rounded-md border-2 border-dashed border-line-strong px-4 py-6 text-sm text-ink-3">
        Demo not found: <code className="font-mono">{demo.id}</code>
      </div>
    )
  }

  // Key by demo id so consecutive steps that mount the same demo with
  // different props re-init their internal useState (history, dial position,
  // gallery selection, etc.) instead of carrying over the previous step's
  // state.
  return createElement(component, { key: demo.id, props: demo.props })
}
