import { PrismaPg } from "@prisma/adapter-pg"
import { Client } from "pg"

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

// Reuse the client across Next.js dev hot-reloads to avoid exhausting pool slots.
export const db = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

/* ------------------------------------------------------------------ */
/*  Circuit breaker                                                   */
/* ------------------------------------------------------------------ */

let health: { ok: boolean; at: number } | undefined

/**
 * One fast probe, cached 60s. When Postgres is unreachable, data layers
 * short-circuit to their static fallbacks instead of paying ~1s per doomed
 * query (or worse) across a 1000-page SSG build.
 *
 * ponytail: process-global breaker. Upgrade path: pg stat statements /
 * per-query timeout if a driver ever exposes one that survives pool churn.
 */
export async function dbAvailable(): Promise<boolean> {
  if (health && Date.now() - health.at < 60_000) return health.ok
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    health = { ok: false, at: Date.now() }
    return false
  }
  // Raw pg.Client with a hard connect timeout — NOT a raced Prisma query,
  // which keeps running in the background and leaks a pool slot per probe.
  let ok = false
  const probe = new Client({ connectionString, connectionTimeoutMillis: 4_000 })
  try {
    await probe.connect()
    ok = true
  } catch {
    ok = false
  } finally {
    await probe.end().catch(() => {})
  }
  health = { ok, at: Date.now() }
  return ok
}
