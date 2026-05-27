import { sanitizeBlogHtml } from "@/modules/blog/lib"

type Props = {
  html: string
}

// Dark-mode prose styling for AI-generated post HTML. We sanitize at render
// time even though the generator script also sanitizes at write time —
// defense in depth, and we want to be safe if rows pre-date the write-time
// guard. See `sanitizeBlogHtml` in modules/blog/lib.ts for the allowlist.
export function BlogProse({ html }: Props) {
  return (
    <div
      className="blog-prose text-[color:var(--foreground)] text-[17px] leading-[1.75]"
      dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(html) }}
    />
  )
}
