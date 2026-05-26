"use client"

import { SignInButton, useUser } from "@clerk/nextjs"
import { LogIn, Send } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { ChatMessage } from "@/common/components/chat-message"
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
import type { CharacterSlug } from "@/modules/content/types"
import { CrewCharacter, toCrewSlug } from "@/modules/crew"
import { askTutor } from "@/modules/tutor/actions"
import type { TutorMessage } from "@/modules/tutor/types"

// Tutor IA drawer — chat surface anchored to the right of the lesson player.
//
// State is shared between the header trigger button and the drawer panel via
// `TutorContext`. The drawer reads the current step's locator (`stepRef`)
// from context so it can pass it to the `askTutor` server action — that's how
// the tutor's answers stay anchored to the step the student is looking at.

type StepRef = {
  trackSlug: string
  courseSlug: string
  stepSlug: string
}

const DEFAULT_PERSONA: CharacterSlug = "vega"

type TutorContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  close: () => void
  stepRef: StepRef
  locale: string
  personaSlug: CharacterSlug
}

const TutorContext = createContext<TutorContextValue | null>(null)

const useTutor = () => {
  const ctx = useContext(TutorContext)
  if (!ctx) {
    throw new Error("useTutor must be used inside <TutorProvider>")
  }
  return ctx
}

type ProviderProps = {
  children: React.ReactNode
  stepRef: StepRef
  locale: string
  // Lead character of the step, derived from frontmatter.characters[0] or
  // exercise.personaSlug upstream. Null when the step doesn't declare one.
  leadCharacter: CharacterSlug | null
}

export function TutorProvider({
  children,
  stepRef,
  locale,
  leadCharacter,
}: ProviderProps) {
  const [open, setOpen] = useState(false)

  const toggle = useCallback(() => setOpen((prev) => !prev), [])
  const close = useCallback(() => setOpen(false), [])

  const personaSlug = leadCharacter ?? DEFAULT_PERSONA

  const value = useMemo(
    () => ({ open, setOpen, toggle, close, stepRef, locale, personaSlug }),
    [open, toggle, close, stepRef, locale, personaSlug],
  )

  return <TutorContext.Provider value={value}>{children}</TutorContext.Provider>
}

export function TutorFab() {
  const t = useTranslations("lessons")
  const { open, toggle, personaSlug } = useTutor()
  const personaName = t(`tutor.personaName.${personaSlug}`)
  const crewSlug = toCrewSlug(personaSlug)
  const [hintDismissed, setHintDismissed] = useState(false)

  const showHint = !open && !hintDismissed

  const handleClick = () => {
    setHintDismissed(true)
    toggle()
  }

  return (
    <div className="pointer-events-none fixed bottom-[100px] right-6 z-40 flex items-center gap-3">
      {showHint ? (
        <button
          type="button"
          onClick={handleClick}
          aria-label={t("tutor.hintAria")}
          className="pointer-events-auto relative rounded-lg border-2 border-stat-xp/35 bg-bg-surface/95 px-3.5 py-2.5 font-sans text-sm font-semibold text-ink-1 shadow-elev-3 backdrop-blur transition-colors duration-fast hover:border-stat-xp/65 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-soft"
        >
          {t("tutor.hint")}
        </button>
      ) : null}
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={open}
        aria-label={open ? t("tutor.closeAria") : t("tutor.openAria")}
        className="pointer-events-auto relative inline-flex size-16 items-center justify-center overflow-visible rounded-full border-2 border-stat-xp/55 bg-bg-deep p-0 shadow-[0_6px_0_0_var(--stat-xp-shadow),0_12px_22px_rgba(0,0,0,0.45)] outline-none transition-[transform,box-shadow] duration-fast ease-out hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-4 focus-visible:ring-primary-soft"
      >
        {crewSlug ? (
          <CrewCharacter slug={crewSlug} size="full" title={personaName} />
        ) : (
          <span className="grid size-full place-items-center font-mono text-2xl font-bold text-stat-xp">
            {personaName.charAt(0)}
          </span>
        )}
      </button>
    </div>
  )
}

export function TutorDrawer() {
  const t = useTranslations("lessons.tutor")
  const { open, setOpen, stepRef, locale, personaSlug } = useTutor()
  const { user, isLoaded } = useUser()
  // We render the anon prompt only once Clerk has hydrated to avoid a flash
  // of the sign-in CTA for signed-in users on first paint.
  const isAnon = isLoaded && !user

  const personaName = t(`personaName.${personaSlug}`)
  const crewSlug = toCrewSlug(personaSlug)

  // Conversation transcript. The opener is rendered as the first assistant
  // message but is NOT sent to the model — the model gets only real turns.
  const [transcript, setTranscript] = useState<TutorMessage[]>([])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll on new messages or while a reply is in flight.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [transcript.length, sending, open])

  const onSend = async () => {
    const text = draft.trim()
    if (!text || sending) return
    const userMsg: TutorMessage = { role: "user", content: text }
    const next = [...transcript, userMsg]
    setTranscript(next)
    setDraft("")
    setSending(true)
    setError(null)
    try {
      const res = await askTutor({
        ...stepRef,
        locale,
        transcript: next,
      })
      if (res.ok) {
        setTranscript([...next, res.reply])
      } else {
        setError(t(`errors.${res.error}`))
      }
    } catch {
      setError(t("errors.network"))
    } finally {
      setSending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex w-[400px] max-w-[calc(100vw-32px)] flex-col gap-0 p-0 sm:max-w-[400px]"
      >
        <SheetHeader className="flex flex-row items-center gap-3 border-b-2 border-line-strong p-4">
          <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-stat-xp/35 bg-stat-xp/14">
            {crewSlug ? (
              <CrewCharacter
                slug={crewSlug}
                expression={sending ? "thinking" : "neutral"}
                size="full"
              />
            ) : null}
          </div>
          <div className="flex flex-col">
            <SheetTitle className="text-sm">
              {t("title")} {"·"} {personaName}
            </SheetTitle>
            <SheetDescription className="flex items-center font-mono text-[10px] uppercase tracking-wider text-track-prompting">
              <span
                className="mr-1.5 inline-block size-1.5 rounded-full bg-track-prompting shadow-[0_0_6px_var(--track-prompting)]"
                aria-hidden
              />
              {t("statusLabel")}
            </SheetDescription>
          </div>
        </SheetHeader>

        <div
          ref={scrollRef}
          className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
        >
          <ChatMessage
            role="assistant"
            content={t("opener")}
            personaSlug={personaSlug}
            personaName={personaName}
          />

          {transcript.map((m, i) => (
            <ChatMessage
              key={i}
              role={m.role}
              content={m.content}
              userImageUrl={user?.imageUrl}
              userName={user?.firstName ?? user?.username ?? null}
              personaSlug={personaSlug}
              personaName={personaName}
            />
          ))}

          {sending ? (
            <ChatMessage
              role="assistant"
              content={t("typing", { name: personaName })}
              personaSlug={personaSlug}
              personaName={personaName}
              pending
            />
          ) : null}
        </div>

        {error ? (
          <div className="mx-4 mb-2 rounded-md border-2 border-danger bg-danger-soft px-3 py-2 font-sans text-xs font-semibold text-danger">
            {error}
          </div>
        ) : null}

        {isAnon ? (
          <div className="flex flex-col gap-2 border-t-2 border-line-strong p-4">
            <p className="font-display font-bold text-sm text-ink-1">
              {t("anon.title")}
            </p>
            <p className="font-sans text-xs font-semibold leading-relaxed text-ink-2">
              {t("anon.body")}
            </p>
            <SignInButton mode="modal">
              <Button type="button" className="self-start">
                <LogIn className="size-4" strokeWidth={2.5} />
                {t("anon.cta")}
              </Button>
            </SignInButton>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_auto] gap-2 border-t-2 border-line-strong p-3.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  onSend()
                }
              }}
              placeholder={t("inputPlaceholder")}
              disabled={sending}
              className={cn(
                "rounded-md border-2 border-line-strong bg-bg-sunken px-3 py-2",
                "font-mono text-[12.5px] text-ink-1 outline-none placeholder:text-ink-3",
                "transition-colors duration-fast focus:border-primary",
                "disabled:opacity-50",
              )}
            />
            <Button
              type="button"
              size="icon"
              onClick={onSend}
              aria-label={t("sendAria")}
              disabled={sending || draft.trim().length === 0}
            >
              <Send className="size-4" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
