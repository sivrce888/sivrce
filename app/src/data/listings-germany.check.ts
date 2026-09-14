/**
 * Germany sample inventory integrity.
 * Run: npx tsx src/data/listings-germany.check.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { GERMANY_LISTINGS, filterGermanyInventory, germanyListingById } from './listings-germany'
import { DE_CITIES } from '@/lib/countries/de'
import { MARKETS } from '@/lib/markets'

const DEALS = new Set(['sale', 'rent', 'daily', 'pledge'])
const PROPS = new Set(['apartment', 'house', 'villa', 'commercial', 'land', 'hotel'])
const ids = GERMANY_LISTINGS.map((l) => l.id)

assert.ok(GERMANY_LISTINGS.length >= 100, `need 100+ listings, got ${GERMANY_LISTINGS.length}`)
assert.equal(new Set(ids).size, ids.length, 'duplicate listing id')

for (const d of DEALS) {
  assert.ok(GERMANY_LISTINGS.some((l) => l.dealType === d), `missing deal ${d}`)
}
for (const p of PROPS) {
  assert.ok(GERMANY_LISTINGS.some((l) => l.propType === p), `missing prop ${p}`)
}

const cwd = fs.existsSync(path.join(process.cwd(), 'public/images/de'))
  ? process.cwd()
  : path.join(process.cwd(), 'app')

for (const l of GERMANY_LISTINGS) {
  assert.equal(l.country, 'DE')
  assert.equal(l.currencyOriginal, 'EUR')
  assert.ok((l.priceOriginal ?? 0) > 0, `price ${l.id}`)
  assert.ok(l.coords.lat >= 47.2 && l.coords.lat <= 55.2 && l.coords.lng >= 5.8 && l.coords.lng <= 15.2, `box ${l.id}`)
  assert.ok(/^\d{5}$/.test(l.address.match(/\b(\d{5})\b/)?.[1] ?? ''), `plz ${l.id}`)
  assert.ok(l.images.length >= 2, `photos ${l.id}`)
  assert.ok(l.agent.phone.startsWith('+49 '), `de phone ${l.id}`)
  assert.ok(!l.agent.phone.includes('000000'), `fake phone ${l.id}`)
  assert.ok(l.title.length >= 12 && l.description && l.description.length >= 40, `copy ${l.id}`)
  for (const img of l.images) {
    assert.ok(img.startsWith('/images/de/') && img.endsWith('.webp'), `img path ${l.id}`)
    assert.ok(fs.existsSync(path.join(cwd, 'public', img)), `img file ${img}`)
  }
  const city = DE_CITIES.find((c) => c.de === l.city)
  assert.ok(city, `city row ${l.city} (${l.id})`)
}

assert.ok(GERMANY_LISTINGS.filter((l) => l.badge === 'SUPER VIP').length >= 8, 'home diamond rail')
assert.ok(GERMANY_LISTINGS.filter((l) => l.badge === 'VIP+').length >= 8, 'home vip+ rail')

const launch = MARKETS.de.citySlugs.slice(0, 16)
for (const slug of launch) {
  const row = DE_CITIES.find((c) => c.slug === slug)
  assert.ok(row, `launch city ${slug}`)
  assert.ok(
    GERMANY_LISTINGS.some((l) => l.city === row!.de),
    `inventory ${slug}`,
  )
}

assert.ok(germanyListingById('berlin-mitte-torstrasse-140'))
assert.ok(filterGermanyInventory({ deal: 'rent' }).every((l) => l.dealType === 'rent'))
assert.ok(filterGermanyInventory({ propType: 'house' }).every((l) => l.propType === 'house'))
assert.ok(filterGermanyInventory({ cityNames: ['Berlin', 'berlin'] }).every((l) => /berlin/i.test(l.city)))
assert.ok(filterGermanyInventory({ cityNames: ['München', 'Munich'] }).length > 0)

console.log(
  `listings-germany: ${GERMANY_LISTINGS.length} listings / ${new Set(GERMANY_LISTINGS.map((l) => l.city)).size} cities / deals ${[...DEALS].join(',')} ✓`,
)
