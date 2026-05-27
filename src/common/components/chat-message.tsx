import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/common/lib/utils"
import { CrewCharacter, toCrewSlug } from "@/modules/crew"

type Props = {
  role: "user" | "assistant"
  content: string
  // User side
  userImageUrl?: string | null
  userName?: string | null
  // Assistant side (the persona). Pass the crew slug — we render the inline
  // painterly mascot. Falls back to initials for unknown slugs.
  personaSlug?: string | null
  personaName?: string | null
  // Pending = render with muted/italic styling. Used while the assistant
  // reply is in flight. Also swaps the persona to its "thinking" expression.
  pending?: boolean
  className?: string
}

const initialsOf = (name: string | null | undefined, fallback: string): string => {
  if (!name) return fallback
  const trimmed = name.trim()
  if (!trimmed) return fallback
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0]! + parts[1][0]!).toUpperCase()
}

function ChatMarkdown({ content }: { content: string }) {
  return (
    <div
      className={cn(
        "font-sans text-sm font-semibold leading-relaxed text-ink-1",
        "[&_p]:m-0 [&_p+p]:mt-2",
        "[&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-ink-2",
        "[&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-ink-2",
        "[&_strong]:font-bold [&_strong]:text-ink-1",
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ className, ...props }) => (
            <a
              className={cn(
                "font-bold text-primary underline underline-offset-2 hover:text-primary/80",
                className,
              )}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          table: ({ className, ...props }) => (
            <div className="my-2 overflow-x-auto rounded-md border-2 border-line-soft bg-bg-sunken">
              <table
                className={cn(
                  "w-full border-collapse text-xs",
                  "[&_th]:bg-bg-raised [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-display [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-ink-3",
                  "[&_td]:border-t [&_td]:border-line-soft [&_td]:px-2.5 [&_td]:py-1.5 [&_td]:text-ink-2",
                  className,
                )}
                {...props}
              />
            </div>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = /language-/.test(className ?? "")
            return isBlock ? (
              <code
                className={cn(
                  "block overflow-x-auto rounded-sm bg-bg-sunken p-3 font-mono text-xs leading-relaxed text-ink-2",
                  className,
                )}
                {...props}
              >
                {children}
              </code>
            ) : (
              <code
                className={cn(
                  "rounded-xs bg-bg-sunken px-1.5 py-0.5 font-mono text-xs text-primary",
                  className,
                )}
                {...props}
              >
                {children}
              </code>
            )
          },
          pre: ({ className, ...props }) => (
            <pre
              className={cn(
                "my-2 overflow-x-auto rounded-md border-2 border-line-soft bg-bg-sunken p-0",
                className,
              )}
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export function ChatMessage({
  role,
  content,
  userImageUrl,
  userName,
  personaSlug,
  personaName,
  pending = false,
  className,
}: Props) {
  const isUser = role === "user"
  const fallbackInitials = isUser
    ? initialsOf(userName, "TU")
    : initialsOf(personaName, "AI")
  const crewSlug = !isUser ? toCrewSlug(personaSlug) : null

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
        className,
      )}
    >
      <div
        className={cn(
          "grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-line-strong bg-bg-raised font-display font-bold text-xs text-ink-1",
        )}
        aria-hidden
      >
        {isUser ? (
          userImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userImageUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="size-full object-cover"
            />
          ) : (
            <span>{fallbackInitials}</span>
          )
        ) : crewSlug ? (
          <CrewCharacter
            slug={crewSlug}
            expression={pending ? "thinking" : "neutral"}
            size="full"
            flat
          />
        ) : (
          <span>{fallbackInitials}</span>
        )}
      </div>
      <div
        className={cn(
          "min-w-0 flex-1 rounded-lg border-2 px-4 py-3",
          isUser
            ? "border-primary/30 bg-primary-soft"
            : "border-line-soft bg-bg-surface",
          pending && "opacity-60 italic",
        )}
      >
        <ChatMarkdown content={content} />
      </div>
    </div>
  )
}
