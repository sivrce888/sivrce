/**
 * Search duplicate collapsing — pure, no DB.
 * The dedupe-fraud cron owns DuplicateCluster rows; this folds same-flat
 * reposts (owner + N agents) into one representative card at search time.
 * Rank mirrors pickRepresentative (verified → oldest); page-level only, so
 * totalHits keeps counting matches while the page shows best representatives.
 * ponytail: caller supplies membership (one indexed query); cross-page
 * collapsing only if dupes-per-page ever justifies it.
 */

export interface CollapseHit {
  id: string
  [key: string]: unknown
}

export interface ClusterRef {
  clusterId: string
  /** True cluster size (all pages) — the chip stays truthful on any page. */
  memberCount: number
}

function isVerified(h: CollapseHit): boolean {
  return (h as { verified?: unknown }).verified === true
}

function rankTime(h: CollapseHit): number {
  const raw = (h as { createdAt?: unknown }).createdAt
  const t = raw instanceof Date ? raw.getTime() : Date.parse(String(raw ?? ''))
  return Number.isFinite(t) ? (t as number) : Number.MAX_SAFE_INTEGER
}

export function collapseHits<T extends CollapseHit>(
  hits: T[],
  clusterOf: Map<string, ClusterRef>,
): { hits: (T & { dupeCount?: number })[]; merged: number } {
  const byCluster = new Map<string, T[]>()
  for (const h of hits) {
    const ref = clusterOf.get(h.id)
    if (!ref) continue
    const g = byCluster.get(ref.clusterId)
    if (g) g.push(h)
    else byCluster.set(ref.clusterId, [h])
  }
  let merged = 0
  const out: (T & { dupeCount?: number })[] = []
  for (const h of hits) {
    const ref = clusterOf.get(h.id)
    if (!ref) {
      out.push(h)
      continue
    }
    const g = byCluster.get(ref.clusterId)!
    if (g.length === 1) {
      out.push(ref.memberCount > 1 ? { ...h, dupeCount: ref.memberCount } : h)
      continue
    }
    const sorted = [...g].sort((a, b) => Number(isVerified(b)) - Number(isVerified(a)) || rankTime(a) - rankTime(b))
    if (sorted[0]!.id === h.id) out.push({ ...h, dupeCount: ref.memberCount })
    else merged += 1
  }
  return { hits: out, merged }
}
