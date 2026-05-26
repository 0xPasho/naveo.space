import { clerkMiddleware } from "@clerk/nextjs/server"
import createMiddleware from "next-intl/middleware"
import type { NextFetchEvent, NextRequest } from "next/server"

import { routing } from "@/common/i18n/routing"

// next-intl handles locale-prefix redirects/rewrites. We run it first
// because Clerk's "keyless mode" (no publishable key set) short-circuits
// the request and never invokes the handler we'd otherwise pass to it.
const intlMiddleware = createMiddleware(routing)

// Clerk runs as the "auth context" wrapper around intl when keys are present.
const clerkWithIntl = clerkMiddleware((_auth, req) => intlMiddleware(req))

const isRedirectStatus = (status: number) => status >= 300 && status < 400

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const intlResponse = intlMiddleware(req)

  // If next-intl wants to redirect (e.g. `/` -> `/es`), short-circuit without
  // running Clerk: we have no auth context to attach to a redirect anyway.
  if (isRedirectStatus(intlResponse.status)) {
    return intlResponse
  }

  // For real route requests, let Clerk attach its auth headers/cookies and
  // then run intl inside it (so locale resolution still happens).
  return clerkWithIntl(req, event)
}

export const config = {
  matcher: [
    "/",
    "/((?!api|trpc|_next|_vercel|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
