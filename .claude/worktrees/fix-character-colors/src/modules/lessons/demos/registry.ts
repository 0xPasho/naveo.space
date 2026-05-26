import type { ComponentType } from "react"

import CrewIntroDemo from "./crew-intro"
import LessonCompleteDemo from "./lesson-complete"
import OutputGalleryDemo from "./output-gallery"
import PromptDialDemo from "./prompt-dial"
import PromptPlaygroundDemo from "./prompt-playground"

// A demo is a self-contained interactive component that occupies the
// step's right pane. Demos are non-graded — they teach via interaction
// without producing a pass/fail signal.
//
// Props are passed opaquely from the step's frontmatter. Each demo
// component is responsible for narrowing/validating its own props.
export type DemoComponent = ComponentType<{
  props?: Record<string, unknown>
}>

export const demoRegistry: Record<string, DemoComponent> = {
  "crew-intro": CrewIntroDemo,
  "lesson-complete": LessonCompleteDemo,
  "output-gallery": OutputGalleryDemo,
  "prompt-dial": PromptDialDemo,
  "prompt-playground": PromptPlaygroundDemo,
}

export const getDemo = (id: string): DemoComponent | null =>
  demoRegistry[id] ?? null
