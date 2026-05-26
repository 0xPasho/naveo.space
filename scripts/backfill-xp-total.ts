// Recompute Xp.total from historical completed Progress rows. The HUD reads
// the real ledger (Xp.total), but historically awardXp wasn't always wired
// up — so users whose first completions predate the gamification module
// (or whose awardXp calls were silently swallowed) currently show 0 XP.
//
// This script replays xpForStep over every completed Progress row for every
// user, summing per-user, and updates Xp.total in place. Idempotent: only
// raises Xp.total when the replayed value is higher than what's stored
// (never lowers, so manual grants and live awardXp remain authoritative).
//
// Usage:  pnpm tsx scripts/backfill-xp-total.ts            (dry-run)
//         pnpm tsx scripts/backfill-xp-total.ts --apply    (writes)

import "dotenv/config"

import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const db = new PrismaClient({ adapter })

const APPLY = process.argv.includes("--apply")

// Mirrors src/modules/gamification/data.ts — kept inline to avoid the
// server-only guard.
const XP_BY_EXERCISE_KIND: Record<string, number> = {
  "prompt-anatomy": 8,
  "prompt-AB": 8,
  "prompt-tag-fill": 10,
  "prompt-task": 12,
  "conversation-goal": 15,
  "prompt-assemble": 8,
  "tool-description": 12,
  "mcp-debug": 8,
  "tool-schema-author": 14,
  "tool-handler-implement": 16,
}
const XP_DEFAULT_PER_EXERCISE = 10
const XP_FIRST_TRY_MULTIPLIER = 1.5

type Frontmatter = { exercise?: { kind?: string }; xp?: number }

const xpForStep = (fm: Frontmatter, firstTry: boolean): number => {
  if (!fm.exercise) return 0
  const declared = fm.xp
  const base =
    declared ??
    (fm.exercise.kind ? XP_BY_EXERCISE_KIND[fm.exercise.kind] : undefined) ??
    XP_DEFAULT_PER_EXERCISE
  return firstTry ? Math.floor(base * XP_FIRST_TRY_MULTIPLIER) : base
}

const main = async () => {
  const xpRows = await db.xp.findMany({ select: { userId: true, total: true } })
  console.log(`Found ${xpRows.length} Xp rows. Mode: ${APPLY ? "APPLY" : "dry-run"}\n`)

  for (const xp of xpRows) {
    const completed = await db.progress.findMany({
      where: { userId: xp.userId, status: "completed" },
      select: { stepId: true, stepLocale: true, attempts: true },
    })

    let replayed = 0
    let withExercise = 0
    let narrative = 0

    for (const p of completed) {
      const piece = await db.contentPiece.findUnique({
        where: { id_locale: { id: p.stepId, locale: p.stepLocale } },
        select: { frontMatter: true },
      })
      if (!piece) continue
      const fm = piece.frontMatter as Frontmatter
      const earned = xpForStep(fm, p.attempts === 1)
      if (fm.exercise) withExercise++
      else narrative++
      replayed += earned
    }

    const drift = replayed - xp.total
    console.log(
      `user=${xp.userId}  completed=${completed.length} (exercise=${withExercise}, narrative=${narrative})  ` +
        `replayed=${replayed}  dbTotal=${xp.total}  → ${drift > 0 ? `BUMP +${drift}` : "no change"}`,
    )

    if (APPLY && drift > 0) {
      await db.xp.update({
        where: { userId: xp.userId },
        data: { total: replayed },
      })
    }
  }

  console.log(`\nDone.${APPLY ? "" : " (dry-run — re-run with --apply to write)"}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
