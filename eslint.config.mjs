import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Naveo "Bridge" — styling discipline.
 *
 * Enforces the "no CSS direct" policy described in CLAUDE.md and
 * docs/design-system.md. The legacy *.css files were all deleted in May
 * 2026; everything renders from primitives in src/common/components/ui/
 * backed by tokens in src/app/globals.css (the single allowed stylesheet).
 *
 * 1. Hex / oklch / rgb literals in .tsx / .ts → error. All color usage
 *    goes through Tailwind tokens (bg-track-mcp, text-stat-xp, etc.).
 *
 * 2. New imports of *.css from anywhere except globals.css → error.
 *
 * NOTE on globs: Next App Router uses bracketed directories like
 * `[locale]` and grouped folders like `(site)`. Both `[`/`]` and `(`/`)`
 * are special glob characters, so we use `**` or `*` segments to bypass.
 */

const STYLING_RULES = {
  "no-restricted-syntax": [
    "error",
    {
      selector: "Literal[value=/#[0-9a-fA-F]{6}\\b/]",
      message:
        "Hex color literals are banned in components. Use a Tailwind utility (bg-track-mcp, text-stat-xp). Tokens live in src/app/globals.css.",
    },
    {
      selector: "Literal[value=/oklch\\s*\\(/]",
      message:
        "oklch() literals are banned in components. Use a Tailwind utility backed by a token in src/app/globals.css.",
    },
    {
      selector: "TemplateElement[value.raw=/oklch\\s*\\(/]",
      message:
        "oklch() literals are banned in components. Use a Tailwind utility backed by a token in src/app/globals.css.",
    },
    {
      selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{6}\\b/]",
      message:
        "Hex color literals are banned in components. Use a Tailwind utility backed by a token in src/app/globals.css.",
    },
  ],

  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: [
            "@/modules/*/styles.css",
            "@/common/layout/styles.css",
            "*/styles.css",
            "*/profile-styles.css",
          ],
          message:
            "No new *.css imports. Only src/app/globals.css is allowed (see CLAUDE.md → Styling rules).",
        },
      ],
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".claude/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  {
    files: ["src/**/*.{ts,tsx}"],
    rules: STYLING_RULES,
  },

  // Allowlist for legitimate hex / oklch literals.
  // Each entry here is debt or a justified exception; the comment above
  // each line explains why.
  {
    files: [
      // Third-party config bridges (Clerk appearance) — needs literal hex.
      "src/app/*/layout.tsx",
      // Raster / OG image generation — hex required by image API.
      "**/opengraph-image.tsx",
      // Design-system preview page literally documents the palette.
      "**/dev/design-system/page.tsx",
      // Palette data files — source of truth for the catalog/cast/crew/
      // dashboard color schemes.
      "**/modules/dashboard/data.ts",
      "**/modules/catalog/data.ts",
      "**/modules/cast/data.ts",
      "**/modules/crew/data.ts",
      "**/modules/crew/lib.tsx",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
]);

export default eslintConfig;
