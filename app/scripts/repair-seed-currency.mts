/**
 * One-off repair: scripts/seed.ts wrote GE listings' GEL amounts under a USD
 * tag, so every seeded price (and every $/m² stat built on them) read 2.7× the
 * market. Only rows carrying the exact bug signature are touched: ownerless,
 * slug = catalog id, currency USD, price === catalog priceGEL.
 *
 *   npx tsx scripts/repair-seed-currency.mts           # dry run (default)
 *   npx tsx scripts/repair-seed-currency.mts --apply   # writes + revert file
 */
import { writeFileSync } from 'node:fs'
import { config } from 'dotenv'

config({ path: '.env.local' })
const { db } = await import('../src/lib/db')
const { LISTINGS } = await import('../src/data/listings')

const apply = process.argv.includes('--apply')
const bySlug = new Map(LISTINGS.filter((l) => !l.currencyOriginal).map((l) => [l.id, l]))

const rows = await db.listing.findMany({
  where: { slug: { in: [...bySlug.keys()] }, ownerId: null, currency: 'USD' },
  select: { id: true, slug: true, price: true, pricePerSqm: true, title: true },
})

const plan = rows.flatMap((r) => {
  const l = bySlug.get(r.slug!)
  if (!l || r.price !== l.priceGEL || l.priceUSD === l.priceGEL) return []
  return [{ id: r.id, slug: r.slug, title: r.title, from: { price: r.price, pricePerSqm: r.pricePerSqm }, to: { price: l.priceUSD, pricePerSqm: l.perM2USD } }]
})

for (const p of plan) console.log(`${p.slug}  ${p.from.price} → ${p.to.price} USD  (${p.from.pricePerSqm} → ${p.to.pricePerSqm} /m²)  ${p.title.slice(0, 40)}`)
console.log(`${plan.length} of ${rows.length} ownerless USD seed rows match the bug signature.`)

if (apply && plan.length) {
  const revert = `${process.env.HOME}/sivrce-db-reverts/repair-seed-currency-${Date.now()}.json`
  writeFileSync(revert, JSON.stringify(plan.map(({ id, from }) => ({ id, ...from })), null, 1))
  await db.$transaction(plan.map((p) => db.listing.update({ where: { id: p.id }, data: p.to })))
  console.log(`applied. revert data: ${revert}`)
} else if (!apply) {
  console.log('dry run — pass --apply to write.')
}
process.exit(0)
