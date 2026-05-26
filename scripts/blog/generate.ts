import "dotenv/config"

import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { generateObject } from "ai"
import { readFile, writeFile, mkdir } from "fs/promises"
import { join, dirname } from "path"
import pg from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { z } from "zod"

import { PrismaClient } from "../../src/generated/prisma/client"

import { buildSystemPrompt, buildUserPrompt, type GenLocale } from "./prompts"
import { generateTopics, type BlogTopic } from "./topics"

// Model lives in OpenRouter — same provider pattern as src/modules/llm/service.ts.
// Switch to a heavier model by passing --model on the CLI if a topic needs it.
const DEFAULT_MODEL = "deepseek/deepseek-v4-pro"
const SCRIPT_DIR = __dirname
const CHECKPOINT_PATH = join(SCRIPT_DIR, ".checkpoint.json")
const FAILURES_PATH = join(SCRIPT_DIR, ".failures.json")
const MAX_TOKENS = 6000
const TEMPERATURE = 0.7
const LOCALES: GenLocale[] = ["es", "en"]

const PostSchema = z.object({
  title: z.string().min(1).max(120),
  excerpt: z.string().min(60).max(260),
  content: z.string().min(500),
  metaTitle: z.string().min(1).max(80),
  metaDescription: z.string().min(80).max(220),
  tags: z.array(z.string().min(1)).min(3).max(10),
})
type GeneratedPost = z.infer<typeof PostSchema>

interface CliArgs {
  dry: boolean
  list: boolean
  limit: number | null
  concurrency: number
  category: string | null
  tool: string | null
  intent: string | null
  onlySlug: string | null
  resetCheckpoint: boolean
  locale: GenLocale | "both"
  model: string
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const out: CliArgs = {
    dry: false,
    list: false,
    limit: null,
    concurrency: 3,
    category: null,
    tool: null,
    intent: null,
    onlySlug: null,
    resetCheckpoint: false,
    locale: "both",
    model: DEFAULT_MODEL,
  }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === "--dry") out.dry = true
    else if (a === "--list") out.list = true
    else if (a === "--reset-checkpoint") out.resetCheckpoint = true
    else if (a === "--limit") out.limit = parseInt(args[++i], 10)
    else if (a === "--concurrency") out.concurrency = parseInt(args[++i], 10)
    else if (a === "--category") out.category = args[++i]
    else if (a === "--tool") out.tool = args[++i]
    else if (a === "--intent") out.intent = args[++i]
    else if (a === "--slug") out.onlySlug = args[++i]
    else if (a === "--model") out.model = args[++i]
    else if (a === "--locale") {
      const v = args[++i]
      if (v !== "es" && v !== "en" && v !== "both") {
        console.error(`--locale must be es | en | both (got ${v})`)
        process.exit(1)
      }
      out.locale = v
    } else if (a === "--help" || a === "-h") {
      printHelp()
      process.exit(0)
    }
  }
  return out
}

function printHelp(): void {
  console.log(`
Usage: tsx scripts/blog/generate.ts [options]

  --list                Print topics and exit (no API calls, no DB writes)
  --dry                 Generate via API but do not write to DB
  --limit N             Process at most N topic×locale jobs (after filters)
  --concurrency N       Parallel API calls (default 3)
  --locale L            Target locale: es | en | both (default both)
  --category CATEGORY   Only topics in one category
  --tool TOOL           Only topics for a given tool slug
  --intent INTENT       Only topics with a given intent
  --slug SLUG           Only the topic with this slug (for QA on a single prompt)
  --model MODEL         OpenRouter model ID (default ${DEFAULT_MODEL})
  --reset-checkpoint    Ignore the checkpoint file and re-process everything
  --help                Show this help

Env: OPENROUTER_API_KEY, DATABASE_URL
`)
}

async function callModel(
  router: ReturnType<typeof createOpenRouter>,
  modelId: string,
  topic: BlogTopic,
  locale: GenLocale,
  attempt = 0,
): Promise<GeneratedPost> {
  try {
    const result = await generateObject({
      model: router(modelId),
      schema: PostSchema,
      system: buildSystemPrompt(locale),
      prompt: buildUserPrompt(topic, locale),
      maxOutputTokens: MAX_TOKENS,
      temperature: TEMPERATURE,
    })
    return result.object
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : ""
    const retriable = name === "RateLimitError" || name === "APICallError"
    if (retriable && attempt < 3) {
      const delay = 1500 * Math.pow(2, attempt)
      await new Promise((r) => setTimeout(r, delay))
      return callModel(router, modelId, topic, locale, attempt + 1)
    }
    throw err
  }
}

interface CheckpointEntry {
  generatedAt: string
}
interface Checkpoint {
  completed: Record<string, CheckpointEntry>
}

function jobKey(slug: string, locale: GenLocale): string {
  return `${locale}:${slug}`
}

async function loadCheckpoint(): Promise<Checkpoint> {
  try {
    const raw = await readFile(CHECKPOINT_PATH, "utf-8")
    return JSON.parse(raw) as Checkpoint
  } catch {
    return { completed: {} }
  }
}

async function saveCheckpoint(cp: Checkpoint): Promise<void> {
  await mkdir(dirname(CHECKPOINT_PATH), { recursive: true })
  await writeFile(CHECKPOINT_PATH, JSON.stringify(cp, null, 2), "utf-8")
}

function filterTopics(all: BlogTopic[], args: CliArgs): BlogTopic[] {
  let list = all
  if (args.category) list = list.filter((t) => t.category === args.category)
  if (args.tool) list = list.filter((t) => t.tool === args.tool)
  if (args.intent) list = list.filter((t) => t.intent === args.intent)
  if (args.onlySlug) list = list.filter((t) => t.slug === args.onlySlug)
  return list
}

interface Job {
  topic: BlogTopic
  locale: GenLocale
}

function buildJobs(filtered: BlogTopic[], locale: CliArgs["locale"]): Job[] {
  const locales = locale === "both" ? LOCALES : [locale]
  const jobs: Job[] = []
  for (const topic of filtered) {
    for (const l of locales) jobs.push({ topic, locale: l })
  }
  return jobs
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++
      await worker(items[idx], idx)
    }
  })
  await Promise.all(runners)
}

async function main(): Promise<void> {
  const args = parseArgs()
  const all = generateTopics()
  const filtered = filterTopics(all, args)

  if (args.list) {
    console.log(`Topics: ${filtered.length}${filtered.length !== all.length ? ` (filtered from ${all.length})` : ""}`)
    for (const t of filtered) {
      const tool = t.tool ? `[${t.tool}] ` : ""
      console.log(`  ${t.category.padEnd(12)} ${t.intent.padEnd(13)} ${tool}${t.title}`)
    }
    return
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is not set in .env")
    process.exit(1)
  }

  const checkpoint = args.resetCheckpoint ? { completed: {} } : await loadCheckpoint()
  let jobs = buildJobs(filtered, args.locale).filter(
    (j) => !checkpoint.completed[jobKey(j.topic.slug, j.locale)],
  )
  if (args.limit != null) jobs = jobs.slice(0, args.limit)

  console.log(
    `Model: ${args.model} — ${jobs.length} jobs to run (filtered topics: ${filtered.length}, completed in checkpoint: ${Object.keys(checkpoint.completed).length})${args.dry ? " [DRY — no DB writes]" : ""}`,
  )

  if (jobs.length === 0) {
    console.log("Nothing to do. Use --reset-checkpoint to re-generate.")
    return
  }

  const router = createOpenRouter({ apiKey })

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  let generated = 0
  let failed = 0
  const failures: { slug: string; locale: GenLocale; reason: string }[] = []
  const padTotal = String(jobs.length).length

  await runPool(jobs, args.concurrency, async (job, i) => {
    const label = `[${String(i + 1).padStart(padTotal, " ")}/${jobs.length}]`
    try {
      const post = await callModel(router, args.model, job.topic, job.locale)

      if (!args.dry) {
        await prisma.blogPost.upsert({
          where: {
            locale_slug: { locale: job.locale, slug: job.topic.slug },
          },
          create: {
            locale: job.locale,
            slug: job.topic.slug,
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            category: job.topic.category,
            tags: post.tags,
            metaTitle: post.metaTitle,
            metaDescription: post.metaDescription,
            translationKey: job.topic.translationKey,
            published: true,
            publishedAt: new Date(),
          },
          update: {
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            tags: post.tags,
            metaTitle: post.metaTitle,
            metaDescription: post.metaDescription,
            translationKey: job.topic.translationKey,
          },
        })

        checkpoint.completed[jobKey(job.topic.slug, job.locale)] = {
          generatedAt: new Date().toISOString(),
        }
        if (generated % 10 === 0) await saveCheckpoint(checkpoint)
      }

      generated++
      console.log(`${label} + ${job.locale} ${job.topic.slug}  —  ${post.title}`)
    } catch (err) {
      failed++
      const reason = err instanceof Error ? err.message : String(err)
      failures.push({ slug: job.topic.slug, locale: job.locale, reason })
      console.log(`${label} x ${job.locale} ${job.topic.slug}  —  ${reason}`)
    }
  })

  if (!args.dry) await saveCheckpoint(checkpoint)
  if (failures.length) {
    await writeFile(FAILURES_PATH, JSON.stringify(failures, null, 2), "utf-8")
  }

  console.log(
    `\nSummary: ${generated} generated, ${failed} failed${args.dry ? " (dry run — nothing saved to DB)" : ""}`,
  )
  if (failures.length) console.log(`Failures written to ${FAILURES_PATH}`)

  await prisma.$disconnect()
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
