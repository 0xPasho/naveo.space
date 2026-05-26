// Initialize Wallet.nextHeartAt for legacy wallets that still rely on the
// old daily-refill model. Any wallet with hearts < heartsMax and no pending
// nextHeartAt would otherwise sit at sub-max forever (regen tick can't fire
// without a starting timestamp).
//
// For wallets at max (hearts === heartsMax), nextHeartAt stays null.
//
// Usage:  pnpm tsx scripts/backfill-next-heart.ts            (dry-run)
//         pnpm tsx scripts/backfill-next-heart.ts --apply    (writes)

import "dotenv/config"

import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/generated/prisma/client"
import { HEART_REGEN_INTERVAL_MS } from "@/modules/economy/data"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const db = new PrismaClient({ adapter })

const APPLY = process.argv.includes("--apply")

const main = async () => {
  const wallets = await db.wallet.findMany({
    select: { userId: true, hearts: true, heartsMax: true, nextHeartAt: true },
  })
  console.log(`Found ${wallets.length} wallets. Mode: ${APPLY ? "APPLY" : "dry-run"}\n`)

  const now = Date.now()
  let toFix = 0
  for (const w of wallets) {
    const subMax = w.hearts < w.heartsMax
    const noCountdown = w.nextHeartAt === null
    if (subMax && noCountdown) {
      toFix++
      const eta = new Date(now + HEART_REGEN_INTERVAL_MS)
      console.log(`user=${w.userId}  hearts=${w.hearts}/${w.heartsMax}  → set nextHeartAt=${eta.toISOString()}`)
      if (APPLY) {
        await db.wallet.update({
          where: { userId: w.userId },
          data: { nextHeartAt: eta },
        })
      }
    } else if (!subMax && w.nextHeartAt !== null) {
      toFix++
      console.log(`user=${w.userId}  hearts=${w.hearts}/${w.heartsMax}  → clear stale nextHeartAt`)
      if (APPLY) {
        await db.wallet.update({
          where: { userId: w.userId },
          data: { nextHeartAt: null },
        })
      }
    }
  }
  console.log(`\nTotal to fix: ${toFix}${APPLY ? " (applied)" : " (dry-run — re-run with --apply)"}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
