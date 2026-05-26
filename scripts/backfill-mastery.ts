// Seed MasteryRecord rows for users who completed steps BEFORE the SRS
// module shipped. Without this, the /practice review rail stays empty
// for existing users until they happen to re-attempt steps.
//
// Strategy: for every Progress row with status='completed' that has no
// corresponding MasteryRecord, create one with intervalDays=1 and a
// nextReviewAt randomly staggered across the next 7 days. The stagger
// prevents the rail from flooding with 100+ items on day one — instead
// the user gets a sustainable trickle as they open the app over the
// following week.
//
// Idempotent. Re-running picks up only Progress rows that still don't
// have a MasteryRecord; existing records are never overwritten.
//
// Usage:  pnpm tsx scripts/backfill-mastery.ts            (dry-run)
//         pnpm tsx scripts/backfill-mastery.ts --apply    (writes)

import "dotenv/config"

import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const db = new PrismaClient({ adapter })

const APPLY = process.argv.includes("--apply")
const STAGGER_DAYS = 7
const MS_PER_DAY = 86_400_000

const main = async () => {
  // All completed Progress rows. We don't filter by user — the script is
  // meant to be a one-time backfill across the whole table.
  const completed = await db.progress.findMany({
    where: { status: "completed" },
    select: {
      userId: true,
      stepId: true,
      stepLocale: true,
      completedAt: true,
    },
  })
  console.log(
    `Found ${completed.length} completed Progress rows. Mode: ${APPLY ? "APPLY" : "dry-run"}\n`,
  )

  // Pull existing MasteryRecord composite ids in one query to filter
  // candidates locally instead of N round-trips.
  const existing = await db.masteryRecord.findMany({
    select: { userId: true, stepId: true, stepLocale: true },
  })
  const existingKeys = new Set(
    existing.map((r) => `${r.userId}::${r.stepId}::${r.stepLocale}`),
  )

  const candidates = completed.filter(
    (c) => !existingKeys.has(`${c.userId}::${c.stepId}::${c.stepLocale}`),
  )
  console.log(`Candidates to backfill: ${candidates.length}\n`)

  if (candidates.length === 0) {
    console.log("Nothing to do.")
    return
  }

  const now = new Date()
  let created = 0
  for (const c of candidates) {
    // Random offset in [0, STAGGER_DAYS) days so the queue fills smoothly.
    const offsetMs = Math.floor(Math.random() * STAGGER_DAYS * MS_PER_DAY)
    const nextReviewAt = new Date(now.getTime() + offsetMs)

    if (APPLY) {
      await db.masteryRecord.create({
        data: {
          userId: c.userId,
          stepId: c.stepId,
          stepLocale: c.stepLocale,
          intervalDays: 1,
          ease: 2.5,
          nextReviewAt,
          lastReviewedAt: c.completedAt ?? now,
          lapses: 0,
          streak: 1,
        },
      })
    }
    created += 1
    if (created % 100 === 0) {
      console.log(`  ${created}/${candidates.length}…`)
    }
  }

  console.log(
    `\n${APPLY ? "Created" : "Would create"} ${created} MasteryRecord rows.${APPLY ? "" : "\n(dry-run — re-run with --apply to write)"}`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
