import "server-only"

import { getStep } from "@/modules/content/service"
import type { ContentLocale, Step } from "@/modules/content/types"
import { getCourse, getTrack } from "@/modules/content/service"
import { TASK_MODEL } from "@/modules/llm/data"
import { callChat } from "@/modules/llm/service"

import { DEFAULT_TUTOR_NAME, DEFAULT_TUTOR_SLUG, MAX_BODY_CHARS } from "./data"
import { buildTutorSystemPrompt } from "./lib"
import type { TutorMessage } from "./types"

const summarizeExercise = (step: Step): string | undefined => {
  const ex = step.frontMatter.exercise
  if (!ex) return undefined
  if (ex.kind === "prompt-task") {
    return `Tipo: prompt-task\nTarea: ${ex.task}`
  }
  if (ex.kind === "conversation-goal") {
    return `Tipo: conversation-goal\nObjetivo: ${ex.goal}`
  }
  if (ex.kind === "prompt-anatomy") {
    return `Tipo: prompt-anatomy. El alumno está etiquetando partes de un prompt.`
  }
  if (ex.kind === "prompt-AB") {
    return `Tipo: prompt-AB.\nPregunta: ${ex.question}`
  }
  if (ex.kind === "prompt-tag-fill") {
    return `Tipo: prompt-tag-fill. Tags requeridos: ${ex.requiredTags.join(", ")}`
  }
  return `Tipo: ${ex.kind}`
}

export async function loadTutorContext(input: {
  trackSlug: string
  courseSlug: string
  stepSlug: string
  locale: string
}): Promise<{
  track: { title: string }
  course: { title: string }
  step: Step
} | null> {
  const locale = input.locale as ContentLocale
  const [step, course, track] = await Promise.all([
    getStep(input.stepSlug, locale, input.courseSlug),
    getCourse(input.courseSlug, locale),
    getTrack(input.trackSlug, locale),
  ])
  if (!step || !course || !track) return null
  if (step.courseSlug !== input.courseSlug) return null
  return { track, course, step }
}

export async function askTutor(args: {
  trackSlug: string
  courseSlug: string
  stepSlug: string
  locale: string
  transcript: TutorMessage[]
}): Promise<{ ok: true; reply: string } | { ok: false; error: string }> {
  const ctx = await loadTutorContext(args)
  if (!ctx) return { ok: false, error: "not-found" }

  const personaSlug = DEFAULT_TUTOR_SLUG
  const personaName = DEFAULT_TUTOR_NAME

  const system = buildTutorSystemPrompt({
    personaSlug,
    personaName,
    trackTitle: ctx.track.title,
    courseTitle: ctx.course.title,
    stepTitle: ctx.step.title,
    stepBody: ctx.step.body.slice(0, MAX_BODY_CHARS),
    exerciseSummary: summarizeExercise(ctx.step),
  })

  try {
    const reply = await callChat({
      model: TASK_MODEL,
      system,
      messages: args.transcript,
      maxTokens: 600,
    })
    return { ok: true, reply: reply.text }
  } catch {
    return { ok: false, error: "model-call-failed" }
  }
}
