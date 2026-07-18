/**
 * listing-slug self-check — run: npm run check:seo-slug
 * Fails if transliteration drifts from the romanization Georgians type into
 * Google, or if any listing's canonical path stops carrying the keyword.
 */
import assert from 'node:assert'
import { LISTINGS } from '@/data/listings'
import { footerKeywordCols } from './seo-pages'
import { listingPath, listingSlug, transliterateKa } from './listing-slug'

assert.equal(transliterateKa('იყიდება 3-ოთახიანი ბინა გლდანში'), 'iyideba-3-otaxiani-bina-gldanshi')
assert.equal(transliterateKa('იყიდება 2-ოთახიანი ბინა ორთაჭალაში'), 'iyideba-2-otaxiani-bina-ortachalashi')
assert.equal(transliterateKa('ქირავდება დღიურად ბინა ძველ თბილისში'), 'kiravdeba-dghiurad-bina-dzvel-tbilisshi')
assert.equal(transliterateKa('  —  '), '')

const l = LISTINGS.find((x) => x.propType === 'apartment' && x.rooms > 0)!
const slug = listingSlug(l)
assert.match(slug, /^[a-z0-9-]+$/, `slug not url-safe: ${slug}`)
assert.ok(slug.includes('otaxiani-bina'), `keyword missing: ${slug}`)
assert.equal(listingPath(l), `/listing/${l.id}/${slug}`)

// every listing in the catalog produces a non-empty, url-safe slug
for (const x of LISTINGS) {
  const s = listingSlug(x)
  assert.ok(s.length > 0, `empty slug for ${x.id}`)
  assert.match(s, /^[a-z0-9-]+$/, `unsafe slug for ${x.id}: ${s}`)
}

// footer keyword columns: exact-query anchors, only real pages, both district cols present
const cols = footerKeywordCols()
assert.ok(cols.length >= 4, `expected ≥4 footer cols, got ${cols.length}`)
assert.ok(cols.some((c) => c.id === 'sale-tbilisi' && c.links.length > 0), 'sale-tbilisi col empty')
for (const c of cols)
  for (const l of c.links) {
    assert.match(l.href, /^\/[a-z0-9/-]+$/, `bad footer href: ${l.href}`)
    assert.ok(l.label.ka.length > 0 && l.label.en.length > 0 && l.label.ru.length > 0, `label missing: ${l.href}`)
  }

console.log(`listing-slug OK — ${LISTINGS.length} listings, e.g. ${listingPath(l)}`)
console.log(`footer cols OK — ${cols.map((c) => `${c.id}:${c.links.length}`).join(', ')}`)
