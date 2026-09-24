/**
 * Backfills official-source provenance onto the static GE catalog from the
 * ProjectDirectory DB (korter/myhome/ss imports) into
 * src/data/project-sources.gen.json — merged into PROJECTS in professionals.ts.
 *
 * Match rule (never invent): same ka city AND normalized-name equality, or
 * containment with both names ≥6 chars AND developer strings compatible when
 * both sides are known. Ambiguous rows stay unlinked — missing data stays
 * missing. Rows that already carry a sourceUrl are never overwritten.
 *
 * Re-run after DB ingests: tsx scripts/derive-project-sources.ts
 * Locked by src/data/catalog-integrity.check.ts.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { PROJECTS, getDeveloper } from '../src/data/professionals'
import { GEO_CITIES } from '../src/data/georgia-locations'

async function main() {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!
  }
  const { db } = await import('../src/lib/db')

  const GE = new Set(GEO_CITIES)
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u10a0-\u10ff]+/g, '')

  const rows = await db.projectDirectory.findMany({
    where: { sourceUrl: { not: null }, city: { in: [...GE] } },
    select: { name: true, city: true, sourceUrl: true, developer: true },
  })
  const byCity = new Map<string, { n: string; url: string; dev: string }[]>()
  for (const r of rows) {
    const n = norm(r.name ?? '')
    if (!n || !r.sourceUrl) continue
    const list = byCity.get(r.city!) ?? []
    list.push({ n, url: r.sourceUrl, dev: norm(r.developer ?? '') })
    byCity.set(r.city!, list)
  }

  const out: Record<string, string> = {}
  for (const p of PROJECTS) {
    if (!GE.has(p.city) || p.sourceUrl) continue
    const pn = norm(p.name)
    const devName = norm(p.developerSlug ? (getDeveloper(p.developerSlug)?.name.en ?? '') : '')
    const devOk = (c: { dev: string }) =>
      // Developer gate: both known and disjoint → not the same project.
      !devName || !c.dev || devName.includes(c.dev) || c.dev.includes(devName)
    const cands = byCity.get(p.city) ?? []
    // Exact normalized name wins; containment only fills what exact missed —
    // "Centropolis B" must not inherit the "Centropolis" (A) page.
    const hit =
      cands.find((c) => c.n === pn && devOk(c)) ??
      cands.find(
        (c) => pn.length >= 6 && c.n.length >= 6 && (pn.includes(c.n) || c.n.includes(pn)) && devOk(c),
      )
    if (!hit) continue
    out[p.slug] = hit.url
  }

  const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(
    new URL('../src/data/project-sources.gen.json', import.meta.url),
    JSON.stringify(sorted, null, 1) + '\n',
  )
  console.log(`project-sources: linked ${Object.keys(sorted).length} GE projects`)
  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
