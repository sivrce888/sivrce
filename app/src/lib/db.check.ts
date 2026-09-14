/**
 * Runnable check: tsx src/lib/db.check.ts
 *
 * Locks the circuit-breaker contract. A dead/slow Postgres must produce a
 * verdict fast: the probe is raced against PROBE_DEADLINE_MS so one page with N
 * sequential safeQuery calls can't stall N × the pool's 8s connect timeout
 * (that is what made project/developer prerenders take >180s).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./db.ts', import.meta.url), 'utf8')

// ——— probe is bounded ———
const deadline = src.match(/const PROBE_DEADLINE_MS = ([\d_]+)/)
assert.ok(deadline, 'PROBE_DEADLINE_MS must exist — an unbounded probe hangs SSR')
const deadlineMs = Number(deadline![1].replace(/_/g, ''))
assert.ok(deadlineMs > 0 && deadlineMs <= 3_000, `probe deadline ${deadlineMs}ms must be ≤3000ms`)
assert.ok(/Promise\.race\(/.test(src), 'probeDb must race the query against the deadline')
assert.ok(/clearTimeout\(/.test(src), 'probe timer must be cleared (no dangling handle per probe)')

// ——— the verdict must resolve before the fail-cache expires, or every call re-probes ———
const failTtl = src.match(/const ttl = health\?\.ok \? ([\d_]+) : ([\d_]+)/)
assert.ok(failTtl, 'dbAvailable must cache ok/fail verdicts with different TTLs')
const okTtlMs = Number(failTtl![1].replace(/_/g, ''))
const failTtlMs = Number(failTtl![2].replace(/_/g, ''))
assert.ok(failTtlMs > deadlineMs, `fail TTL ${failTtlMs}ms must outlast the ${deadlineMs}ms probe`)
assert.ok(okTtlMs >= failTtlMs, 'a healthy verdict should be cached at least as long as a failure')

// ——— pool stays at the cost-locked shape ———
const poolMax = src.match(/max:\s*(\d+)/)
assert.ok(poolMax && Number(poolMax[1]) <= 3, 'pool max >3 exhausts Supabase pooler slots (perf-cost-lock)')
assert.ok(/connectionTimeoutMillis:\s*8_000/.test(src), 'query connect timeout stays 8s')
assert.ok(/allowExitOnIdle:\s*true/.test(src), 'allowExitOnIdle keeps Fluid isolates from pinning slots')

// ——— safeQuery must bound a reachable-but-slow query too ———
const guards = readFileSync(new URL('./guards.ts', import.meta.url), 'utf8')
const qDeadline = guards.match(/const QUERY_DEADLINE_MS = ([\d_]+)/)
assert.ok(qDeadline, 'safeQuery needs QUERY_DEADLINE_MS — the breaker cannot see a slow-but-up DB')
const qMs = Number(qDeadline![1].replace(/_/g, ''))
assert.ok(qMs > 0 && qMs <= 15_000, `query deadline ${qMs}ms must stay well under Next's 180s page budget`)
assert.ok(/Promise\.race\(/.test(guards), 'safeQuery must race the query against its deadline')
assert.ok(/clearTimeout\(/.test(guards), 'safeQuery must clear its timer')
assert.ok(
  /if \(!\(await dbAvailable\(\)\)\) return fallback/.test(guards),
  'safeQuery must keep the circuit breaker short-circuit',
)

console.log(
  `db.check: ok — probe ≤${deadlineMs}ms, query ≤${qMs}ms, fail cached ${failTtlMs}ms, ` +
    `ok cached ${okTtlMs}ms, pool max ${poolMax![1]}`,
)
