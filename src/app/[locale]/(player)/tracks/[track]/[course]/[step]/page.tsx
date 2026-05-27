import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { currentUser } from "@/server/auth"
import type { ContentLocale } from "@/modules/content/types"
import { getWallet } from "@/modules/economy/service"
import { getStepWithNeighbors } from "@/modules/lessons/service"
import { LessonPlayerView } from "@/modules/lessons/lesson-player-view"
import { getOrCreateUser } from "@/modules/users/service"

type Props = {
  params: Promise<{
    locale: ContentLocale
    track: string
    course: string
    step: string
  }>
}

export default async function StepPage({ params }: Props) {
  const { locale, track, course, step } = await params
  setRequestLocale(locale)

  const clerkUser = await currentUser()
  const userId = clerkUser?.id ?? null

  const data = await getStepWithNeighbors(track, course, step, locale, userId)
  if (!data) notFound()

  // Read the user's current wallet so StepShell can disable Comprobar
  // when hearts are empty, and TutorDrawer can disable Send when the user
  // can't afford a tutor question. Anon users always pass — they're not
  // yet bound by the hearts / gems economy.
  let hearts = Number.POSITIVE_INFINITY
  let gems = Number.POSITIVE_INFINITY
  if (clerkUser) {
    const user = await getOrCreateUser(clerkUser.id)
    const wallet = await getWallet(user.id)
    hearts = wallet.hearts
    gems = wallet.gems
  }

  // The `key` forces a full remount of the lesson player tree whenever
  // the URL slug changes. Without it, React reuses the StepShell, the
  // TutorProvider/TutorFab/TutorDrawer instances across step navigations
  // and their local state (payload, result, transcript, draft,
  // hintDismissed, …) leaks from one step to the next — the
  // "pre-selected MCQ" bug.
  return (
    <LessonPlayerView
      key={`${track}/${course}/${step}`}
      data={data}
      locale={locale}
      hearts={hearts}
      gems={gems}
      isSignedIn={Boolean(clerkUser)}
    />
  )
}
