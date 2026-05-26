import { getTranslations } from "next-intl/server"

import { Link } from "@/common/i18n/navigation"
import {
  GEMS_PER_COURSE,
  PLAYER_STATS_PLACEHOLDER,
} from "@/modules/users/placeholder-stats"

type SigningOfficer = "vega" | "atlas" | "echo" | "forge"

type Props = {
  // The course / track context for breadcrumb / link.
  trackTitle: string
  courseTitle: string
  // Counts to show in the run-box.
  stepsCleared: number
  totalSteps: number
  xpEarned: number
  // Mascot to render — defaults to "echo" (the signing officer).
  signingOfficer?: SigningOfficer
  // Where the "BACK TO COURSE" / "NEXT TRACK" CTAs link.
  courseHref: string
  nextTrackHref?: string | null
  // Live streak from gamification — falls back to placeholder when not signed
  // in (anon view of the cleared page).
  streakDays?: number
}

const PLACEHOLDER_GEMS_REWARD = GEMS_PER_COURSE

// Lesson cleared celebration screen. Mirrors the design's LessonDebrief —
// two-column layout: left `.levelup` celebration hero with confetti + crown +
// XP number, right column with Echo checklist + rewards card. Placeholder
// gems/streak values until a real progress system lands.
export async function LessonDebrief({
  trackTitle,
  courseTitle,
  stepsCleared,
  totalSteps,
  xpEarned,
  signingOfficer = "echo",
  courseHref,
  nextTrackHref,
  streakDays = PLAYER_STATS_PLACEHOLDER.streak,
}: Props) {
  const t = await getTranslations("lessons.debrief")
  const officerName = signingOfficer.charAt(0).toUpperCase() + signingOfficer.slice(1)

  return (
    <div className="crew-lesson">
      <div className="lp-debrief">
        <div className="lp-debrief-grid">
          <div className="levelup">
            <div className="confetti" />
            <img
              src="/icons/crown.svg"
              className="crown"
              alt=""
            />
            <div className="num">+ {xpEarned}</div>
            <div className="eyebrow gold">
              {t("eyebrow", { track: trackTitle, course: courseTitle })}
            </div>
            <h2>{t("title")}</h2>
            <p>{t("subtitle", { officer: officerName })}</p>
            <div
              className="row gap-3"
              style={{ marginTop: 6, display: "flex", gap: 12 }}
            >
              <Link href={courseHref} className="btn btn-cta">
                {t("ctaContinue")}
              </Link>
              {nextTrackHref ? (
                <Link href={nextTrackHref} className="btn btn-cyan">
                  {t("ctaNextTrack")}
                </Link>
              ) : null}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="echo-panel">
              <div className="h">
                <img src={`/cast/${signingOfficer}.svg`} alt="" />
                {t("checklist.title", {
                  officer: officerName.toUpperCase(),
                  steps: stepsCleared,
                })}
              </div>
              <div className="crit-row">
                <span className="crit-badge pass">✓</span>
                <div>{t("checklist.items.allCleared")}</div>
                <span className="crit-reason">
                  {t("checklist.values.steps", {
                    done: stepsCleared,
                    total: totalSteps,
                  })}
                </span>
              </div>
              <div className="crit-row">
                <span className="crit-badge pass">✓</span>
                <div>{t("checklist.items.signed", { officer: officerName })}</div>
                <span className="crit-reason">
                  {t("checklist.values.signed")}
                </span>
              </div>
              <div className="crit-row">
                <span className="crit-badge pass">✓</span>
                <div>{t("checklist.items.criteria")}</div>
                <span className="crit-reason">
                  {t("checklist.values.criteria")}
                </span>
              </div>
              <div className="crit-row">
                <span className="crit-badge pass">✓</span>
                <div>{t("checklist.items.tracked")}</div>
                <span className="crit-reason">
                  {t("checklist.values.tracked", { xp: xpEarned })}
                </span>
              </div>
            </div>

            <div className="reward-card">
              <div className="eyebrow">{t("rewards.title")}</div>
              <div className="reward-row">
                <div className="reward-cell xp">
                  <img src="/icons/xp-bolt.svg" alt="" />
                  <div>
                    <div className="val">
                      {t("rewards.xpVal", { xp: xpEarned })}
                    </div>
                    <div className="lab">{t("rewards.xpLab")}</div>
                  </div>
                </div>
                <div className="reward-cell gems">
                  <img src="/icons/gem.svg" alt="" />
                  <div>
                    <div className="val">
                      {t("rewards.gemsVal", { gems: PLACEHOLDER_GEMS_REWARD })}
                    </div>
                    <div className="lab">{t("rewards.gemsLab")}</div>
                  </div>
                </div>
                <div className="reward-cell streak">
                  <img src="/icons/streak-flame.svg" alt="" />
                  <div>
                    <div className="val">
                      {t("rewards.streakVal", {
                        days: streakDays,
                      })}
                    </div>
                    <div className="lab">{t("rewards.streakLab")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
