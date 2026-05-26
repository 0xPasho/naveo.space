// Find Progress rows whose (stepId, stepLocale) no longer exists in
// ContentPiece. These are leftovers from content rebuilds where slugs
// changed — they inflate "completed" counts and can never be re-attempted.
//
// Usage:  pnpm tsx scripts/cleanup-orphan-progress.ts            (dry-run)
//         pnpm tsx scripts/cleanup-orphan-progress.ts --apply    (deletes)

import "dotenv/config"

import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const db = new PrismaClient({ adapter })

const APPLY = process.argv.includes("--apply")

const main = async () => {
  const allProgress = await db.progress.findMany({
    select: { userId: true, stepId: true, stepLocale: true, status: true, completedAt: true },
  })
  console.log(`Total Progress rows: ${allProgress.length}`)

  const stepIds = [...new Set(allProgress.map((p) => p.stepId))]
  const stepLocales = [...new Set(allProgress.map((p) => p.stepLocale))]

  const pieces = await db.contentPiece.findMany({
    where: {
      type: "step",
      id: { in: stepIds },
      locale: { in: stepLocales },
    },
    select: { id: true, locale: true },
  })
  const pieceKeys = new Set(pieces.map((p) => `${p.id}|${p.locale}`))

  const orphans = allProgress.filter(
    (p) => !pieceKeys.has(`${p.stepId}|${p.stepLocale}`),
  )
  console.log(`Orphan Progress rows: ${orphans.length}`)

  // Group orphan keys for the report
  const grouped = new Map<string, { stepId: string; stepLocale: string; users: Set<string>; completed: number }>()
  for (const o of orphans) {
    const k = `${o.stepId}|${o.stepLocale}`
    const e = grouped.get(k) ?? { stepId: o.stepId, stepLocale: o.stepLocale, users: new Set(), completed: 0 }
    e.users.add(o.userId)
    if (o.status === "completed") e.completed++
    grouped.set(k, e)
  }

  console.log(`\nDistinct orphan steps: ${grouped.size}`)
  for (const e of grouped.values()) {
    console.log(`  ${e.stepId.padEnd(50)} locale=${e.stepLocale}  users=${e.users.size}  completed=${e.completed}`)
  }

  if (APPLY && orphans.length > 0) {
    let deleted = 0
    for (const o of orphans) {
      const res = await db.progress.delete({
        where: {
          userId_stepId_stepLocale: {
            userId: o.userId,
            stepId: o.stepId,
            stepLocale: o.stepLocale,
          },
        },
      })
      if (res) deleted++
    }
    console.log(`\nDeleted ${deleted} orphan Progress rows.`)
  } else {
    console.log(`\n(dry-run — re-run with --apply to delete)`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
