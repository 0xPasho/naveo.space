import { LandingDailyQuest } from "./components/landing-daily-quest"
import { LandingFinalCta } from "./components/landing-final-cta"
import { LandingHero } from "./components/landing-hero"
import { LandingLoopSteps } from "./components/landing-loop-steps"
import { LandingProgressRail } from "./components/landing-progress-rail"
import { LandingRubricDemo } from "./components/landing-rubric-demo"
import { LandingStationsBento } from "./components/landing-stations-bento"
import { LandingTracksBento } from "./components/landing-tracks-bento"

export function HomeView() {
  return (
    <>
      <LandingHero />
      <LandingLoopSteps />
      <LandingRubricDemo />
      <LandingTracksBento />
      <LandingStationsBento />
      <LandingDailyQuest />
      <LandingProgressRail />
      <LandingFinalCta />
    </>
  )
}
