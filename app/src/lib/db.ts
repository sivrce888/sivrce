import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })
}

// Reuse the client across Next.js dev hot-reloads to avoid exhausting Neon connections.
export const db = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

/* ------------------------------------------------------------------ */
/*  Circuit breaker                                                   */
/* ------------------------------------------------------------------ */

let health: { ok: boolean; at: number } | undefined

/**
 * One fast probe, cached 60s. When Neon is down / over quota, data layers
 * short-circuit to their static fallbacks instead of paying ~1s per doomed
 * query (or worse) across a 1000-page SSG build.
 *
 * ponytail: process-global breaker. Upgrade path: pg stat statements /
 * per-query timeout if a driver ever exposes one that survives pool churn.
 */
export async function dbAvailable(): Promise<boolean> {
  if (health && Date.now() - health.at < 60_000) return health.ok
  if (!process.env.DATABASE_URL) {
    health = { ok: false, at: Date.now() }
    return false
  }
  const ok = await Promise.race([
    db.$queryRaw`SELECT 1`.then(
      () => true,
      () => false,
    ),
    new Promise<false>((resolve) => setTimeout(() => resolve(false), 5_000)),
  ])
  health = { ok, at: Date.now() }
  return ok
}
