/**
 * QA helper: generate ONE post via OpenRouter using the same prompt as
 * generate.ts and dump the full JSON to stdout for manual review.
 *
 * Usage:
 *   tsx scripts/blog/dump-sample.ts <slug> [--locale es|en] [--model MODEL]
 */
import "dotenv/config"

import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { generateObject } from "ai"
import { z } from "zod"

import { buildSystemPrompt, buildUserPrompt, type GenLocale } from "./prompts"
import { generateTopics } from "./topics"

const DEFAULT_MODEL = "deepseek/deepseek-v4-pro"

const PostSchema = z.object({
  title: z.string().min(1).max(120),
  excerpt: z.string().min(60).max(260),
  content: z.string().min(500),
  metaTitle: z.string().min(1).max(80),
  metaDescription: z.string().min(80).max(220),
  tags: z.array(z.string().min(1)).min(3).max(10),
})

async function main(): Promise<void> {
  const slug = process.argv[2]
  if (!slug || slug.startsWith("--")) {
    console.error("Usage: tsx scripts/blog/dump-sample.ts <slug> [--locale es|en] [--model MODEL]")
    process.exit(1)
  }

  let locale: GenLocale = "es"
  const localeIdx = process.argv.indexOf("--locale")
  if (localeIdx !== -1) {
    const v = process.argv[localeIdx + 1]
    if (v !== "es" && v !== "en") {
      console.error("--locale must be es | en")
      process.exit(1)
    }
    locale = v
  }

  let model = DEFAULT_MODEL
  const modelIdx = process.argv.indexOf("--model")
  if (modelIdx !== -1) {
    model = process.argv[modelIdx + 1]
  }

  const topic = generateTopics().find((t) => t.slug === slug)
  if (!topic) {
    console.error(`Slug not found: ${slug}`)
    process.exit(1)
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY not set")
    process.exit(1)
  }

  console.log(`\n=== TOPIC ===`)
  console.log(`Title:    ${topic.title}`)
  console.log(`Keyword:  ${topic.keyword}`)
  console.log(`Category: ${topic.category}`)
  console.log(`Intent:   ${topic.intent}`)
  console.log(`Tool:     ${topic.tool ?? "(none)"}`)
  console.log(`Locale:   ${locale}`)
  console.log(`Model:    ${model}`)
  console.log(`\n=== GENERATING ===\n`)

  const router = createOpenRouter({ apiKey })
  const result = await generateObject({
    model: router(model),
    schema: PostSchema,
    system: buildSystemPrompt(locale),
    prompt: buildUserPrompt(topic, locale),
    maxOutputTokens: 6000,
    temperature: 0.7,
  })

  const parsed = result.object

  console.log(`Title:           ${parsed.title}`)
  console.log(`Excerpt:         ${parsed.excerpt}`)
  console.log(`MetaTitle:       ${parsed.metaTitle}`)
  console.log(`MetaDescription: ${parsed.metaDescription}`)
  console.log(`Tags:            ${parsed.tags.join(", ")}`)
  console.log(`Content length:  ${parsed.content.length} chars`)
  console.log(`\n=== CONTENT (HTML) ===\n`)
  console.log(parsed.content)
  console.log(`\n=== USAGE ===`)
  console.log(
    `input: ${result.usage?.inputTokens ?? 0}, output: ${result.usage?.outputTokens ?? 0}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
