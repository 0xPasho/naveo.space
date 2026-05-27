import type { BlogLocale } from "./types"

export function formatDate(dateStr: string | null, locale: BlogLocale): string {
  if (!dateStr) return ""
  const bcp = locale === "es" ? "es-ES" : "en-US"
  return new Date(dateStr).toLocaleDateString(bcp, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function buildCanonicalUrl(path: string, siteUrl: string): string {
  const base = siteUrl.replace(/\/+$/, "")
  const suffix = path.startsWith("/") ? path : `/${path}`
  return `${base}${suffix}`
}

// ---------- HTML sanitizer ----------
//
// Blog content is LLM-generated and stored as raw HTML. Even with prompt
// constraints, a prompt-injected job or a tampered DB row can plant
// `<script>` / `onerror=` / `javascript:` payloads that fire in the
// reader's browser. We sanitize at render time (and at write time in
// scripts/blog/generate.ts) using a strict allowlist:
//
//   - Allowed tags: h2-h6, p, ul, ol, li, strong, em, b, i, code, pre,
//     blockquote, a, br, hr.
//   - Allowed attributes per tag (see ALLOWED_ATTRS).
//   - URLs in href/src must start with http://, https://, mailto:, or be
//     a relative path. Anything else (javascript:, data:, vbscript:) is
//     stripped entirely.
//   - All event-handler attributes (`on*=`) are stripped.
//
// This is a denylist-leaning allowlist — we tokenize tags, then keep the
// ones in ALLOWED and rewrite their attributes. The text between tags is
// preserved as-is; browsers handle entity decoding. We do NOT parse a full
// DOM (no jsdom dep); a regex tokenizer plus per-tag attribute filtering
// is sufficient for the static content we render.

const ALLOWED_TAGS = new Set([
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "b",
  "i",
  "code",
  "pre",
  "blockquote",
  "a",
  "br",
  "hr",
])

const VOID_TAGS = new Set(["br", "hr"])

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "rel", "target"]),
}

const SAFE_URL_SCHEMES = /^(https?:|mailto:|\/[^/]|#|$)/i

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

// Pull attribute pairs out of an opening-tag inner string. Matches
// `name="value"`, `name='value'`, `name=value`, and bare `name`.
const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`<>]+)))?/g

function sanitizeAttrs(tag: string, inner: string): string {
  const allowed = ALLOWED_ATTRS[tag]
  if (!allowed) return ""
  const out: string[] = []
  let match: RegExpExecArray | null
  ATTR_RE.lastIndex = 0
  while ((match = ATTR_RE.exec(inner)) !== null) {
    const name = match[1].toLowerCase()
    if (!allowed.has(name)) continue
    // Strip event handlers defensively even if the allowlist let them
    // through (it doesn't, but keep the guard).
    if (name.startsWith("on")) continue
    const raw = match[2] ?? match[3] ?? match[4] ?? ""
    if (name === "href" || name === "src") {
      if (!SAFE_URL_SCHEMES.test(raw)) continue
    }
    if (name === "target") {
      // Allow only `_blank`; anything else (eg `_top`) could be abused.
      if (raw !== "_blank") continue
      // Force rel=noopener noreferrer on _blank links.
      out.push(`target="_blank" rel="noopener noreferrer"`)
      continue
    }
    if (name === "rel") {
      // If a rel was supplied, keep the noopener/noreferrer/nofollow
      // tokens only.
      const tokens = raw
        .split(/\s+/)
        .filter((t) => ["noopener", "noreferrer", "nofollow"].includes(t.toLowerCase()))
      if (tokens.length === 0) continue
      out.push(`rel="${escapeHtml(tokens.join(" "))}"`)
      continue
    }
    out.push(`${name}="${escapeHtml(raw)}"`)
  }
  return out.length === 0 ? "" : " " + out.join(" ")
}

// Tokenize: split into runs of text and tags. We don't reconstruct nesting
// — the browser will handle malformed structure gracefully — but we DO
// drop disallowed tags entirely (open and close) along with their inner
// content for `<script>`/`<style>` so payloads inside them don't leak as
// visible text.
const DANGEROUS_TAGS_WITH_CONTENT = ["script", "style", "iframe", "object", "embed", "svg", "math", "form", "noscript", "template"]

export function sanitizeBlogHtml(input: string): string {
  let html = input
  for (const tag of DANGEROUS_TAGS_WITH_CONTENT) {
    const re = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}\\s*>`, "gi")
    html = html.replace(re, "")
    // Self-closing or stray opening (eg `<svg ... />` without close).
    const lone = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi")
    html = html.replace(lone, "")
  }

  // Tokenize tags. Each match captures either an opening/closing tag.
  return html.replace(/<\/?\s*([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (whole, rawName: string, attrs: string) => {
    const name = rawName.toLowerCase()
    if (!ALLOWED_TAGS.has(name)) return ""
    const isClosing = whole.startsWith("</")
    if (isClosing) {
      if (VOID_TAGS.has(name)) return ""
      return `</${name}>`
    }
    const safeAttrs = sanitizeAttrs(name, attrs ?? "")
    if (VOID_TAGS.has(name)) return `<${name}${safeAttrs} />`
    return `<${name}${safeAttrs}>`
  })
}
