import { getTranslations } from "next-intl/server"

import { Link } from "@/common/i18n/navigation"

import { CrewPreviewCard } from "./components/crew-preview-card"
import { HOME_CREW, HOME_HOW_STEPS, HOME_PILLARS } from "./data"

import "./styles.css"

// Signed-out landing. Logged-in users are redirected to /dashboard from
// page.tsx, so this view is marketing-only. Design language matches the
// dashboard (.crew-dashboard) — same kit.css tokens, just namespaced under
// .crew-home. The (site) layout already provides the .crew-shell + Hud
// chrome; this view just fills the main column.
export async function HomeView() {
  const t = await getTranslations("home")
  const tRoles = await getTranslations("bridge.crew.roles")

  return (
    <div className="crew-home">
      {/* HERO */}
      <section className="home-hero">
        <div>
          <p className="eyebrow">{t("hero.eyebrow")}</p>
          <h1>
            {t("hero.headingLead")}{" "}
            <em>{t("hero.headingAccent")}</em> {t("hero.headingTail")}
          </h1>
          <p className="lead">{t("hero.subheading")}</p>
          <div className="cta-row">
            <Link href="/tracks" className="btn btn-cta">
              {t("hero.ctaPrimary")} →
            </Link>
            <Link href="/tracks" className="btn btn-ghost">
              {t("hero.ctaSecondary")}
            </Link>
          </div>
        </div>
        <div className="mascot-frame">
          <img src="/cast/vega.svg" alt={t("hero.mascotAlt")} />
        </div>
      </section>

      {/* PILLARS */}
      <section className="pillars">
        <div className="section-head">
          <p className="eyebrow">{t("pillars.eyebrow")}</p>
          <h2>{t("pillars.title")}</h2>
        </div>
        <div className="grid">
          {HOME_PILLARS.map((p) => (
            <article key={p.key} className={`pillar ${p.tone}`}>
              <span className="tag">{t(`pillars.items.${p.key}.tag`)}</span>
              <h3>{t(`pillars.items.${p.key}.title`)}</h3>
              <p>{t(`pillars.items.${p.key}.body`)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CREW PREVIEW */}
      <section className="card">
        <div className="card-h">
          <h3 className="title">
            {t("crewPreview.eyebrow")}{" "}
            <span className="accent">{t("crewPreview.eyebrowAccent")}</span>
          </h3>
          <Link href="/crew" className="more">
            {t("crewPreview.openDossiers")}
          </Link>
        </div>
        <p
          style={{
            color: "var(--fg-muted)",
            fontSize: 14,
            margin: "-4px 0 16px",
            maxWidth: "62ch",
          }}
        >
          {t("crewPreview.subtitle")}
        </p>
        <div className="crew-grid">
          {HOME_CREW.map((member) => (
            <CrewPreviewCard
              key={member.slug}
              member={member}
              name={member.name}
              role={tRoles(member.roleKey)}
              blurb={t(`crewPreview.blurbs.${member.slug}`)}
            />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="card">
        <div className="card-h">
          <h3 className="title">{t("howItWorks.eyebrow")}</h3>
        </div>
        <h2
          style={{
            fontSize: 22,
            letterSpacing: "-.02em",
            margin: "0 0 16px",
            fontWeight: 700,
          }}
        >
          {t("howItWorks.title")}
        </h2>
        <div className="how-grid">
          {HOME_HOW_STEPS.map((step) => (
            <article key={step} className="how-step">
              <span className="step">
                {t(`howItWorks.steps.${step}.step`)}
              </span>
              <h3>{t(`howItWorks.steps.${step}.title`)}</h3>
              <p>{t(`howItWorks.steps.${step}.body`)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta">
        <div>
          <p className="eyebrow">{t("finalCta.eyebrow")}</p>
          <h2>{t("finalCta.title")}</h2>
          <p>{t("finalCta.body")}</p>
        </div>
        <div className="cta-row">
          <Link href="/tracks" className="btn btn-cta">
            {t("finalCta.ctaPrimary")} →
          </Link>
          <Link href="/tracks" className="btn btn-ghost">
            {t("finalCta.ctaSecondary")}
          </Link>
        </div>
      </section>
    </div>
  )
}
