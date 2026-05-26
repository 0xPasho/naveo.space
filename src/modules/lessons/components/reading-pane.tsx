import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"

import { mdxComponents } from "@/common/components/mdx-components"

type Props = {
  body: string
}

// Reading pane wrapper. Typography is owned inline via Tailwind child
// selectors so the player doesn't rely on the legacy lessons/styles.css
// `.crew-lesson .mdx > *` rules. Width is constrained for readability
// inside the right-hand reading pane.
export function ReadingPane({ body }: Props) {
  return (
    <div
      className="prose-naveo flex max-w-[62ch] flex-col gap-4 text-ink-2 [&>blockquote]:m-0 [&>blockquote]:border-l-[3px] [&>blockquote]:border-stat-xp [&>blockquote]:pl-3.5 [&>blockquote]:italic [&>blockquote]:text-ink-2 [&>h1]:m-0 [&>h1]:font-display [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:leading-tight [&>h1]:tracking-tight [&>h1]:text-ink-1 [&>h2]:mt-4 [&>h2]:font-display [&>h2]:text-lg [&>h2]:font-bold [&>h2]:tracking-tight [&>h2]:text-ink-1 [&>h3]:mt-2.5 [&>h3]:font-display [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:text-ink-1 [&>ol]:m-0 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:text-[14px] [&>ol]:leading-[1.7] [&>ol]:text-ink-2 [&>ol_li::marker]:font-mono [&>ol_li::marker]:font-bold [&>ol_li::marker]:text-stat-xp [&>p>code]:rounded [&>p>code]:border [&>p>code]:border-line-strong [&>p>code]:bg-bg-sunken [&>p>code]:px-1.5 [&>p>code]:py-px [&>p>code]:font-mono [&>p>code]:text-[12.5px] [&>p>code]:text-track-prompting [&>p]:m-0 [&>p]:text-[14.5px] [&>p]:leading-[1.65] [&>p]:text-ink-2 [&>ul]:m-0 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:text-[14px] [&>ul]:leading-[1.7] [&>ul]:text-ink-2 [&>ul_li::marker]:text-stat-xp"
    >
      <MDXRemote
        source={body}
        components={mdxComponents}
        options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
      />
    </div>
  )
}
