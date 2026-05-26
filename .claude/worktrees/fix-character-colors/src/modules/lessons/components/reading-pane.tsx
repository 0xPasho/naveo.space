import { MDXRemote } from "next-mdx-remote/rsc"

import { mdxComponents } from "@/common/components/mdx-components"

type Props = {
  body: string
}

// Reading pane wrapper. The `.mdx` class hooks into the typography rules
// ported from the design's lesson-player.css (`.crew-lesson .mdx > h1`,
// `> p`, `> ul`, etc.). Width is constrained for readability inside the
// design's `.lp-pane.read` flex column.
export function ReadingPane({ body }: Props) {
  return (
    <div className="mdx" style={{ maxWidth: "62ch" }}>
      <MDXRemote source={body} components={mdxComponents} />
    </div>
  )
}
