import { cn } from "@/common/lib/utils"

type Props = {
  imageUrl: string | null | undefined
  name: string
  size?: "md" | "lg" | "xl"
  className?: string
}

const sizeClass = {
  md: "size-10 text-sm",
  lg: "size-14 text-base",
  xl: "size-20 text-2xl",
} as const

const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || parts[0] === "") return "?"
  if (parts.length === 1) return parts[0][0]!.toUpperCase()
  return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase()
}

// User avatar with image fallback. Uses Clerk's hosted image when present;
// otherwise renders a brand-tinted disc with the user's initials.
export function UserAvatar({ imageUrl, name, size = "md", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full border border-border bg-muted font-bold uppercase tracking-tight text-foreground",
        sizeClass[size],
        className,
      )}
      aria-hidden
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  )
}
