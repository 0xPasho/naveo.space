import "dotenv/config"

import { readFile, readdir, stat } from "node:fs/promises"
import path from "node:path"

import { PrismaPg } from "@prisma/adapter-pg"
import matter from "gray-matter"
import { parse as parseYaml } from "yaml"

import type { ContentLocale, RelationKind } from "../src/modules/content/data"
import { SUPPORTED_LOCALES } from "../src/modules/content/data"
import {
  CourseYamlSchema,
  DailyFrontmatterSchema,
  StepFrontmatterSchema,
  TracksYamlSchema,
  hashContent,
} from "../src/modules/content/lib"
import { PrismaClient } from "../src/generated/prisma/client"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const CONTENT_ROOT = path.resolve(process.cwd(), "content")

type Stats = {
  upserted: number
  unchanged: number
  warnings: string[]
}

// Namespace step IDs by their course slug so that two courses can have a
// step with the same slug (e.g. each track may have a `capstone`) without
// colliding on the ContentPiece PK `(id, locale)`. Other types (track,
// course, concept, ...) keep flat ids — their slugs are globally unique.
const pieceId = (
  type: string,
  slug: string,
  parentSlug?: string | null,
) =>
  type === "step" && parentSlug
    ? `step:${parentSlug}/${slug}`
    : `${type}:${slug}`

const stripOrderPrefix = (filename: string) =>
  filename.replace(/\.mdx$/, "").replace(/^\d+[-_]/, "")

type PieceUpsert = {
  type: string
  slug: string
  title: string
  parentSlug: string | null
  order: number | null
  frontMatter: object
  body: string
}

const upsertPiece = async (locale: ContentLocale, piece: PieceUpsert, stats: Stats) => {
  const id = pieceId(piece.type, piece.slug, piece.parentSlug)
  const hash = hashContent(piece.body, piece.frontMatter)

  const existing = await prisma.contentPiece.findUnique({
    where: { id_locale: { id, locale } },
    select: { hash: true },
  })

  if (existing?.hash === hash) {
    stats.unchanged += 1
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const frontMatterJson = piece.frontMatter as any

  await prisma.contentPiece.upsert({
    where: { id_locale: { id, locale } },
    create: {
      id,
      locale,
      type: piece.type,
      slug: piece.slug,
      title: piece.title,
      hash,
      frontMatter: frontMatterJson,
      body: piece.body,
      parentSlug: piece.parentSlug,
      order: piece.order,
    },
    update: {
      title: piece.title,
      hash,
      frontMatter: frontMatterJson,
      body: piece.body,
      parentSlug: piece.parentSlug,
      order: piece.order,
    },
  })
  stats.upserted += 1
}

type PendingRelation = { kind: RelationKind; toSlug: string; toType: string }

const upsertRelations = async (
  locale: ContentLocale,
  fromId: string,
  rels: PendingRelation[],
  stats: Stats,
) => {
  // Frontmatter is the single source of truth: drop and rebuild outgoing edges.
  await prisma.pieceRelation.deleteMany({
    where: { fromId, fromLocale: locale },
  })

  for (const r of rels) {
    const toId = pieceId(r.toType, r.toSlug)
    const target = await prisma.contentPiece.findUnique({
      where: { id_locale: { id: toId, locale } },
      select: { id: true },
    })
    if (!target) {
      stats.warnings.push(
        `relation skipped: ${fromId} -> ${toId} (${r.kind}); target piece does not exist yet`,
      )
      continue
    }
    await prisma.pieceRelation.create({
      data: {
        fromId,
        fromLocale: locale,
        toId,
        toLocale: locale,
        kind: r.kind,
      },
    })
  }
}

const dirExists = async (p: string): Promise<boolean> => {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

const buildDailyQuests = async (
  locale: ContentLocale,
  localeRoot: string,
  stats: Stats,
) => {
  const dailyDir = path.join(localeRoot, "daily")
  if (!(await dirExists(dailyDir))) return

  const entries = await readdir(dailyDir)
  const dailyFiles = entries.filter((f) => f.endsWith(".mdx")).sort()

  for (const f of dailyFiles) {
    const filePath = path.join(dailyDir, f)
    const raw = await readFile(filePath, "utf8")
    const parsed = matter(raw)

    const dailyFmResult = DailyFrontmatterSchema.safeParse(parsed.data)
    if (!dailyFmResult.success) {
      stats.warnings.push(
        `frontmatter invalid in ${filePath}: ${dailyFmResult.error.message}`,
      )
      continue
    }
    const dailyFm = dailyFmResult.data
    const slug = stripOrderPrefix(f)

    await upsertPiece(
      locale,
      {
        type: "daily",
        slug,
        title: dailyFm.title,
        parentSlug: null,
        order: null,
        frontMatter: dailyFm,
        body: parsed.content,
      },
      stats,
    )
  }
}

const buildLocale = async (locale: ContentLocale, stats: Stats) => {
  const localeRoot = path.join(CONTENT_ROOT, locale)
  if (!(await dirExists(localeRoot))) {
    return
  }

  await buildDailyQuests(locale, localeRoot, stats)

  const tracksFile = path.join(localeRoot, "tracks.yaml")
  if (!(await dirExists(tracksFile))) {
    stats.warnings.push(`tracks.yaml missing for locale ${locale}: ${tracksFile}`)
    return
  }

  const tracksRaw = await readFile(tracksFile, "utf8")
  const tracksParsed = TracksYamlSchema.parse(parseYaml(tracksRaw))

  for (const track of tracksParsed.tracks) {
    await upsertPiece(
      locale,
      {
        type: "track",
        slug: track.slug,
        title: track.title,
        parentSlug: null,
        order: track.order,
        frontMatter: track,
        body: "",
      },
      stats,
    )

    for (const courseSlug of track.courses) {
      const courseDir = path.join(localeRoot, "steps", courseSlug)
      const courseYamlPath = path.join(courseDir, "_course.yaml")
      if (!(await dirExists(courseYamlPath))) {
        stats.warnings.push(
          `track ${track.slug} references course ${courseSlug} but ${courseYamlPath} is missing`,
        )
        continue
      }

      const courseRaw = await readFile(courseYamlPath, "utf8")
      const courseFm = CourseYamlSchema.parse(parseYaml(courseRaw))

      if (courseFm.slug !== courseSlug) {
        stats.warnings.push(
          `course slug mismatch in ${courseYamlPath}: dir=${courseSlug} yaml.slug=${courseFm.slug}`,
        )
      }

      await upsertPiece(
        locale,
        {
          type: "course",
          slug: courseSlug,
          title: courseFm.title,
          parentSlug: track.slug,
          order: courseFm.order,
          frontMatter: courseFm,
          body: "",
        },
        stats,
      )

      const entries = await readdir(courseDir)
      const stepFiles = entries.filter((f) => f.endsWith(".mdx")).sort()

      for (const f of stepFiles) {
        const filePath = path.join(courseDir, f)
        const raw = await readFile(filePath, "utf8")
        const parsed = matter(raw)

        const stepFmResult = StepFrontmatterSchema.safeParse(parsed.data)
        if (!stepFmResult.success) {
          stats.warnings.push(
            `frontmatter invalid in ${filePath}: ${stepFmResult.error.message}`,
          )
          continue
        }
        const stepFm = stepFmResult.data
        const slug = stripOrderPrefix(f)

        await upsertPiece(
          locale,
          {
            type: "step",
            slug,
            title: stepFm.title,
            parentSlug: courseSlug,
            order: stepFm.order,
            frontMatter: stepFm,
            body: parsed.content,
          },
          stats,
        )

        const stepIdValue = pieceId("step", slug, courseSlug)
        const rels: PendingRelation[] = [
          ...(stepFm.teaches ?? []).map((s) => ({
            kind: "teaches" as const,
            toSlug: s,
            toType: "concept",
          })),
          ...(stepFm.requires ?? []).map((s) => ({
            kind: "requires" as const,
            toSlug: s,
            toType: "concept",
          })),
          ...(stepFm.referencesPatterns ?? []).map((s) => ({
            kind: "references" as const,
            toSlug: s,
            toType: "pattern",
          })),
          ...(stepFm.watchOutFor ?? []).map((s) => ({
            kind: "watchOutFor" as const,
            toSlug: s,
            toType: "antipattern",
          })),
        ]
        await upsertRelations(locale, stepIdValue, rels, stats)
      }
    }
  }
}

const main = async () => {
  const stats: Stats = { upserted: 0, unchanged: 0, warnings: [] }

  for (const locale of SUPPORTED_LOCALES) {
    await buildLocale(locale, stats)
  }

  console.log(`upserted:  ${stats.upserted}`)
  console.log(`unchanged: ${stats.unchanged}`)
  if (stats.warnings.length > 0) {
    console.log(`warnings (${stats.warnings.length}):`)
    for (const w of stats.warnings) console.log(`  - ${w}`)
  }
  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})
