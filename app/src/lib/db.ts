import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

import { PrismaClient } from "@/generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// Node 24+ pg treats sslmode=require as verify-full; Supabase pooler breaks
// that ("self-signed in chain"). uselibpqcompat restores libpq require=
// encrypt-without-CA-verify. Upgrade: pin Supabase CA when Node defaults flip.
function withPgSslCompat(url: string) {
  if (/uselibpqcompat=/i.test(url) || /sslmode=disable/i.test(url)) return url
  return `${url}${url.includes("?") ? "&" : "?"}uselibpqcompat=true`
}

function getPool(): Pool {
  if (globalForPrisma.pool) return globalForPrisma.pool
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  // ponytail: 1 conn per Fluid isolate. Bump max to 3 if p99 wait shows queueing.
  globalForPrisma.pool = new Pool({
    connectionString: withPgSslCompat(connectionString),
    max: 1,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 3_000,
    allowExitOnIdle: true,
  })
  return globalForPrisma.pool
}

function createClient() {
  return new PrismaClient({ adapter: new PrismaPg(getPool()) })
}

// Reuse the client across Next.js dev hot-reloads to avoid exhausting pool slots.
export const db = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

/* ------------------------------------------------------------------ */
/*  Circuit breaker                                                   */
/* ------------------------------------------------------------------ */

let health: { ok: boolean; at: number } | undefined
let inflight: Promise<boolean> | undefined

/**
 * One fast probe, cached 60s. When Postgres is unreachable, data layers
 * short-circuit to their static fallbacks instead of paying ~1s per doomed
 * query (or worse) across a 1000-page SSG build.
 *
 * ponytail: process-global breaker + coalesced in-flight probe. Cold homepage
 * used to fire 3 parallel DNS probes (layout meta, layout body, Hero).
 * Upgrade path: pg stat statements / per-query timeout if a driver ever
 * exposes one that survives pool churn.
 */
export async function dbAvailable(): Promise<boolean> {
  // ponytail: ok caches 60s; fail caches 3s. 60s-closed after an 800ms probe miss emptied /sale and 404'd every listing.
  const ttl = health?.ok ? 60_000 : 3_000
  if (health && Date.now() - health.at < ttl) return health.ok
  if (inflight) return inflight
  inflight = probeDb().finally(() => {
    inflight = undefined
  })
  return inflight
}

async function probeDb(): Promise<boolean> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    health = { ok: false, at: Date.now() }
    return false
  }
  // Same Pool Prisma uses — a second Client was a leaked pooler slot per probe.
  let ok = false
  try {
    await getPool().query("SELECT 1")
    ok = true
  } catch {
    ok = false
  }
  health = { ok, at: Date.now() }
  return ok
}
