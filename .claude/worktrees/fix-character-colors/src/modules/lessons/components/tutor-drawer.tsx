"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"

// Tutor IA drawer — first-pass visual placeholder.
//
// The lesson player shows a "Tutor IA" pill in the header. Clicking it slides
// in a right-anchored panel with a hardcoded sample conversation between the
// student and Vega (the tutor persona). No real LLM wiring yet — this is the
// design's static preview, ported from `LessonTutor` in the design package.
//
// State is shared across the header trigger and the drawer panel via a small
// React context (`TutorProvider`). Because `lesson-header.tsx` is a server
// component, only the trigger button is a client island — the rest of the
// header stays on the server.

type TutorContextValue = {
  open: boolean
  toggle: () => void
  close: () => void
}

const TutorContext = createContext<TutorContextValue | null>(null)

const useTutor = () => {
  const ctx = useContext(TutorContext)
  if (!ctx) {
    throw new Error("useTutor must be used inside <TutorProvider>")
  }
  return ctx
}

export function TutorProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const toggle = useCallback(() => setOpen((prev) => !prev), [])
  const close = useCallback(() => setOpen(false), [])

  const value = useMemo(() => ({ open, toggle, close }), [open, toggle, close])

  return <TutorContext.Provider value={value}>{children}</TutorContext.Provider>
}

export function TutorButton() {
  const t = useTranslations("lessons")
  const { open, toggle } = useTutor()

  return (
    <button
      type="button"
      className="tutor"
      onClick={toggle}
      aria-expanded={open}
      aria-label={open ? t("tutor.closeAria") : t("tutor.openAria")}
    >
      <span className="dot" />
      {t("bar.tutor")}
    </button>
  )
}

export function TutorDrawer() {
  const t = useTranslations("lessons")
  const { open, close } = useTutor()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, close])

  if (!open) return null

  const personaName = t("tutor.personaName")

  return (
    <div className="tutor-drawer" role="dialog" aria-label={t("tutor.title")}>
      <div className="h">
        <img src="/cast/vega.svg" alt="" />
        <div>
          <div className="name">
            {t("tutor.title")} · {personaName}
          </div>
          <div className="sub">
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--signal-cyan)",
                marginRight: 6,
                boxShadow: "0 0 6px var(--signal-cyan)",
              }}
            />
            {t("tutor.statusLabel")}
          </div>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={t("tutor.closeAria")}
          style={{
            marginLeft: "auto",
            background: "transparent",
            border: 0,
            color: "var(--fg-muted)",
            cursor: "pointer",
            fontSize: 18,
          }}
        >
          ✕
        </button>
      </div>
      <div className="body">
        <div className="cg-msg vega">
          <div className="av">
            <img src="/cast/vega.svg" alt={personaName} />
          </div>
          <div className="b">{t("tutor.sample.openerByPersona")}</div>
        </div>
        <div className="cg-msg you">
          <div className="av">TU</div>
          <div className="b">{t("tutor.sample.userQuestion")}</div>
        </div>
        <div className="cg-msg vega">
          <div className="av">
            <img src="/cast/vega.svg" alt={personaName} />
          </div>
          <div className="b" style={{ whiteSpace: "pre-wrap" }}>
            {t("tutor.sample.personaAnswer")}
          </div>
        </div>
      </div>
      <div className="refs">
        <div>{t("tutor.refsLabel")}</div>
        <div>· {t("tutor.ref1")}</div>
        <div>· {t("tutor.ref2")}</div>
      </div>
      <div className="input">
        <input
          className="cg-input"
          placeholder={t("tutor.inputPlaceholder")}
          disabled
        />
        <button
          type="button"
          className="cg-send"
          aria-label={t("tutor.sendAria")}
          disabled
        >
          ↑
        </button>
      </div>
    </div>
  )
}
