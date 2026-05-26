type Props = {
  html: string
}

// Dark-mode prose styling for AI-generated post HTML. The generator emits
// clean <h2>/<h3>/<p>/<ul>/<ol>/<li>/<strong>/<em>/<code>/<blockquote>.
// We restyle each tag here so we don't pull in @tailwindcss/typography.
export function BlogProse({ html }: Props) {
  return (
    <div
      className="blog-prose text-[color:var(--foreground)] text-[17px] leading-[1.75]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
