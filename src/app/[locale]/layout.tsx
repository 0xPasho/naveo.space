import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Fredoka, JetBrains_Mono, Nunito } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";

import { routing } from "@/common/i18n/routing";
import "../globals.css";

// Clerk appearance — wires the auth UI to the Naveo Bridge tokens so the
// flow doesn't feel like a generic modal dropped over the gamified site.
// Primary CTA renders as a chunky 3D mint pill; card uses the elev-3 lift.
const CLERK_APPEARANCE = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#19d9c4",
    colorBackground: "#131a26",
    colorText: "#f3f6fb",
    colorTextSecondary: "#c5cee0",
    colorInputBackground: "#080c13",
    colorInputText: "#f3f6fb",
    colorDanger: "#ff4e73",
    colorSuccess: "#19d9c4",
    borderRadius: "16px",
    fontFamily:
      "Nunito, ui-sans-serif, system-ui, -apple-system, sans-serif",
  },
  elements: {
    card: {
      borderRadius: "24px",
      border: "2px solid rgba(255,255,255,0.06)",
      boxShadow:
        "0 6px 0 0 rgba(0,0,0,0.6), 0 14px 24px -10px rgba(0,0,0,0.55)",
    },
    formButtonPrimary: {
      background: "#19d9c4",
      color: "#052420",
      borderRadius: "16px",
      fontFamily: "Nunito, ui-sans-serif, system-ui, sans-serif",
      fontWeight: 800,
      letterSpacing: "0.04em",
      textTransform: "uppercase" as const,
      padding: "14px 26px",
      boxShadow: "0 5px 0 0 #0d9b8a",
      "&:hover": {
        background: "#19d9c4",
      },
      "&:active": {
        transform: "translateY(4px)",
        boxShadow: "0 0 0 0 #0d9b8a",
      },
    },
    socialButtonsBlockButton: {
      borderRadius: "16px",
      borderWidth: "2px",
      fontWeight: 700,
    },
    formFieldInput: {
      borderRadius: "14px",
      borderWidth: "2px",
    },
    footerActionLink: { color: "#19d9c4" },
  },
} as const;

// Naveo Bridge fonts — Fredoka (display, chunky rounded), Nunito (body/UI),
// JetBrains Mono (code). See docs/design-system.md.
const fontDisplay = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const fontSans = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Naveo",
  description: "Aprende a coordinarte con la crew. IA aplicada, paso a paso.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <head>
        <Script
          defer
          src="https://analytics.pasho.dev/script.js"
          data-website-id="f9cfe1ce-a46f-485a-8182-e180b5e1314b"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <ClerkProvider appearance={CLERK_APPEARANCE}>
            {children}
          </ClerkProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
