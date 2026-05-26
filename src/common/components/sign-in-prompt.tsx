"use client"

import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { ArrowRight, LogIn } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button, Card, Eyebrow } from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"

type Props = {
  heading: string
  body: string
  // Optional override for the eyebrow chip. Defaults to the common "guest
  // mode" label so anon prompts feel consistent across the platform.
  eyebrow?: string
  // Optional secondary destination shown next to the auth CTAs (typically
  // /tracks so guests can explore content without an account first).
  exploreHref?: string
  exploreLabel?: string
}

// Anon prompt card shown wherever a route requires sign-in. Replaces the
// silent redirects that left users staring at a flicker, and renders both
// Sign In (existing user) and Sign Up (new user) modal triggers from
// Clerk so the auth flow is one click away.
export function SignInPrompt({
  heading,
  body,
  eyebrow,
  exploreHref,
  exploreLabel,
}: Props) {
  const t = useTranslations("common.signInPrompt")
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-12 md:px-8">
      <Card className="p-8">
        <Eyebrow className="text-primary">{eyebrow ?? t("eyebrow")}</Eyebrow>
        <h1 className="mt-3 font-display font-bold text-3xl leading-tight tracking-tight text-ink-1 sm:text-4xl">
          {heading}
        </h1>
        <p className="mt-4 max-w-2xl font-sans font-semibold text-base leading-relaxed text-ink-2">
          {body}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <SignInButton mode="modal">
            <Button type="button">
              <LogIn className="size-4" strokeWidth={2.5} />
              {t("signIn")}
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button type="button" variant="secondary">
              {t("signUp")}
            </Button>
          </SignUpButton>
          {exploreHref ? (
            <Button
              variant="outline"
              render={<Link href={exploreHref} />}
            >
              {exploreLabel ?? t("explore")}
              <ArrowRight className="size-4" strokeWidth={2.5} />
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
