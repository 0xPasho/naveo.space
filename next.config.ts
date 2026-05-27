import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

// Baseline security headers applied to every response. CSP is intentionally
// permissive on `script-src` (`'unsafe-inline'`, `'unsafe-eval'`) because Next
// 16 + Clerk inject inline scripts the framework doesn't yet nonce by default.
// Tighten with a nonce strategy once Clerk + Next agree on one. `frame-ancestors
// 'none'` neutralizes clickjacking against the Clerk login flow even with the
// loose script-src, which is the biggest concrete risk.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "img-src 'self' https: data: blob:",
      "media-src 'self' https: data: blob:",
      "font-src 'self' https: data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
      "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://api.openrouter.ai https://openrouter.ai https://api.stripe.com",
      "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

const withNextIntl = createNextIntlPlugin("./src/common/i18n/request.ts")

export default withNextIntl(nextConfig)
