// Backfill `Progress.firstTry` for rows that already existed before the
// field was added. Heuristic (best we can do without a per-grant ledger):
// any completed row with attempts === 1 is assumed first-try. Imperfect for
// users who passed first try and later re-attempted (their attempts now
// > 1) — those keep firstTry=false. New completions going forward are
// precise because recordAttemptForStep freezes firstTry at completion time.
//
// Usage:  pnpm tsx scripts/backfill-first-try.ts            (dry-run)
//         pnpm tsx scripts/backfill-first-try.ts --apply    (writes)

import "dotenv/config"

import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const db = new PrismaClient({ adapter })

const APPLY = process.argv.includes("--apply")

async function main() {
  const candidates = await db.progress.count({
    where: { status: "completed", attempts: 1, firstTry: false },
  })
  console.log(
    `Found ${candidates} completed Progress rows with attempts=1 and firstTry=false.`,
  )
  if (!APPLY) {
    console.log("(dry-run — pass --apply to write)")
    return
  }
  const result = await db.progress.updateMany({
    where: { status: "completed", attempts: 1, firstTry: false },
    data: { firstTry: true },
  })
  console.log(`Updated ${result.count} rows.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
