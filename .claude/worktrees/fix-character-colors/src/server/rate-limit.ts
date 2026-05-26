import "server-only"

import { db } from "@/server/db"

export type RateLimitResult = {
  ok: boolean
  count: number
  limit: number
  remaining: number
}

const startOfUtcDay = () => {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export async function checkAndIncrement(userId: string, limit: number): Promise<RateLimitResult> {
  const day = startOfUtcDay()

  const row = await db.rateLimit.upsert({
    where: { userId_day: { userId, day } },
    update: { count: { increment: 1 } },
    create: { userId, day, count: 1 },
  })

  return {
    ok: row.count <= limit,
    count: row.count,
    limit,
    remaining: Math.max(0, limit - row.count),
  }
}
