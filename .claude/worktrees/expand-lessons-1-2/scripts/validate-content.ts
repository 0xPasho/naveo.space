import { readFile, readdir, stat } from "node:fs/promises"
import path from "node:path"

import matter from "gray-matter"
import { parse as parseYaml } from "yaml"

import { SUPPORTED_LOCALES } from "../src/modules/content/data"
import {
  CourseYamlSchema,
  StepFrontmatterSchema,
  TracksYamlSchema,
} from "../src/modules/content/lib"

const CONTENT_ROOT = path.resolve(process.cwd(), "content")

const dirExists = async (p: string): Promise<boolean> => {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

const errors: string[] = []
const ok: string[] = []

const validateLocale = async (locale: string) => {
  const localeRoot = path.join(CONTENT_ROOT, locale)
  if (!(await dirExists(localeRoot))) return

  const tracksFile = path.join(localeRoot, "tracks.yaml")
  const tracksRaw = await readFile(tracksFile, "utf8")
  const tracksParsed = TracksYamlSchema.safeParse(parseYaml(tracksRaw))
  if (!tracksParsed.success) {
    errors.push(`tracks.yaml (${locale}): ${tracksParsed.error.message}`)
    return
  }
  ok.push(`tracks.yaml (${locale})`)

  for (const track of tracksParsed.data.tracks) {
    for (const courseSlug of track.courses) {
      const courseDir = path.join(localeRoot, "steps", courseSlug)
      const courseYamlPath = path.join(courseDir, "_course.yaml")
      if (!(await dirExists(courseYamlPath))) {
        errors.push(`missing _course.yaml: ${courseYamlPath}`)
        continue
      }

      const courseRaw = await readFile(courseYamlPath, "utf8")
      const courseFm = CourseYamlSchema.safeParse(parseYaml(courseRaw))
      if (!courseFm.success) {
        errors.push(`_course.yaml ${courseSlug} (${locale}): ${courseFm.error.message}`)
        continue
      }
      ok.push(`course ${courseSlug} (${locale})`)

      const entries = await readdir(courseDir)
      const stepFiles = entries.filter((f) => f.endsWith(".mdx")).sort()
      for (const f of stepFiles) {
        const raw = await readFile(path.join(courseDir, f), "utf8")
        const parsed = matter(raw)
        const stepFm = StepFrontmatterSchema.safeParse(parsed.data)
        if (!stepFm.success) {
          errors.push(`${courseSlug}/${f} (${locale}): ${stepFm.error.message}`)
          continue
        }
        ok.push(`step ${courseSlug}/${f} (${locale})`)
      }
    }
  }
}

const main = async () => {
  for (const locale of SUPPORTED_LOCALES) {
    await validateLocale(locale)
  }
  console.log(`OK: ${ok.length}`)
  for (const o of ok) console.log("  ✓", o)
  if (errors.length === 0) {
    console.log("All content validates.")
    process.exit(0)
  }
  console.log(`\nERRORS: ${errors.length}`)
  for (const e of errors) console.log("  ✕", e)
  process.exit(1)
}

main()
