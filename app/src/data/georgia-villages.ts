/**
 * Georgia village catalog — every settlement by municipality (4,5k+ rows).
 * Server-only consumers (/api/suggest, locations page) so client bundles
 * never pay for it — same split as georgia-streets.
 * Refresh: `python3 scripts/sync-villages.py`
 */
import data from './georgia-villages.json'

type Catalog = { source: string; villages: Record<string, string[]> }

const VILLAGES = (data as Catalog).villages

/** Villages of one municipality, sorted ka. */
export function villagesOf(muni: string): string[] {
  return VILLAGES[muni] ?? []
}

/** Municipality names that have villages. */
export function villageMunis(): string[] {
  return Object.keys(VILLAGES)
}

/** Every village with its municipality — /api/suggest index. */
export function allVillages(): { ka: string; muni: string }[] {
  const out: { ka: string; muni: string }[] = []
  for (const muni of villageMunis()) {
    for (const ka of VILLAGES[muni]!) out.push({ ka, muni })
  }
  return out
}

export const VILLAGE_COUNT = allVillages().length
