/**
 * listing-slug self-check — run: npm run check:seo-slug
 * Fails if transliteration drifts from the romanization Georgians type into
 * Google, or if any listing's canonical path stops carrying the keyword.
 */
import assert from 'node:assert'
import { LISTINGS } from '@/data/listings'
import { footerKeywordCols } from './seo-pages'
import { listingPath, listingSlug, listingKeyword, listingKeywordIn, listingDisplayTitle, transliterateKa } from './listing-slug'
import { translate } from '@/lib/i18n/dicts'
import { LANGS } from '@/lib/i18n/core'

assert.equal(transliterateKa('იყიდება 3-ოთახიანი ბინა გლდანში'), 'iyideba-3-otaxiani-bina-gldanshi')
assert.equal(transliterateKa('იყიდება 2-ოთახიანი ბინა ორთაჭალაში'), 'iyideba-2-otaxiani-bina-ortachalashi')
assert.equal(transliterateKa('იყიდება 2-საძინებლიანი ბინა ვაკეში'), 'iyideba-2-sadzinebliani-bina-vakeshi')
assert.equal(transliterateKa('ქირავდება დღიურად ბინა ძველ თბილისში'), 'kiravdeba-dghiurad-bina-dzvel-tbilisshi')
assert.equal(transliterateKa('  —  '), '')

const l = LISTINGS.find((x) => x.propType === 'apartment' && x.beds > 0)!
const slug = listingSlug(l)
assert.match(slug, /^[a-z0-9-]+$/, `slug not url-safe: ${slug}`)
assert.ok(slug.includes('sadzinebliani-bina'), `keyword missing: ${slug}`)
// canonical path: keyword slug + public-number id when known, uuid fallback resolves too
assert.ok(listingPath(l).endsWith(`/${slug}`), `keyword missing: ${listingPath(l)}`)
assert.match(
  listingPath({ ...l, publicId: 10000046 }),
  /^\/listing\/\d{7,9}\//,
  `public id not used: ${listingPath(l)}`,
)
assert.match(listingPath(l), /^\/listing\/[a-z0-9-]+\//, `unresolvable key: ${listingPath(l)}`)
assert.ok(listingKeyword({ ...l, dealType: 'buy' as never }).length > 0, 'db dialect must not crash slug')

const de = {
  id: 'berlin-mitte-torstrasse-140',
  country: 'DE',
  title: 'Altbau-Wohnung mit Südbalkon in der Torstraße',
  dealType: 'sale' as const,
  propType: 'apartment' as const,
  rooms: 3,
  beds: 2,
  district: 'Mitte',
  city: 'Berlin',
}
assert.equal(listingKeyword(de), de.title)
assert.equal(listingSlug(de), 'altbau-wohnung-mit-suedbalkon-in-der-torstrasse')
assert.ok(!listingKeyword(de).includes('იყიდება'), 'DE keyword must stay Latin')

// every listing in the catalog produces a non-empty, url-safe slug
for (const x of LISTINGS) {
  const s = listingSlug(x)
  assert.ok(s.length > 0, `empty slug for ${x.id}`)
  assert.match(s, /^[a-z0-9-]+$/, `unsafe slug for ${x.id}: ${s}`)
}

const landLease = LISTINGS.find((x) => x.dealType === 'rent' && x.propType === 'land')
assert.ok(landLease, 'catalog needs a land lease listing')
assert.ok(listingKeyword(landLease).includes('გაიცემა იჯარით'), 'land rent title must be იჯარა')
assert.ok(listingSlug(landLease).includes('gaitsema-ijarit'), `lease slug missing იჯარა: ${listingSlug(landLease)}`)

// footer keyword columns: exact-query anchors, only real pages, both district cols present
const cols = footerKeywordCols()
assert.ok(cols.length >= 4, `expected ≥4 footer cols, got ${cols.length}`)
assert.ok(cols.some((c) => c.id === 'sale-tbilisi' && c.links.length > 0), 'sale-tbilisi col empty')
const cityCol = cols.find((c) => c.id === 'cities')
assert.ok(cityCol && cityCol.links.length >= 10, 'cities col thin')
assert.ok(cityCol.links.every((l) => !l.label.ka.includes('იყიდება')), 'cities must be short names, not H1s')
const saleTb = cols.find((c) => c.id === 'sale-tbilisi')
assert.ok(saleTb && saleTb.links.every((l) => !l.label.ka.includes('იყიდება')), 'sale-tbilisi must be place names, not H1s')
const popCol = cols.find((c) => c.id === 'popular')
assert.ok(popCol && popCol.links.length >= 5, 'popular col thin')
assert.ok(popCol.links.every((l) => !l.href.startsWith('/search')), 'popular links must be indexed hubs')
for (const c of cols)
  for (const l of c.links) {
    assert.match(l.href, /^\/[a-z0-9/-]+$/, `bad footer href: ${l.href}`)
    assert.ok(l.label.ka.length > 0 && l.label.en.length > 0 && l.label.ru.length > 0, `label missing: ${l.href}`)
  }

console.log(`listing-slug OK — ${LISTINGS.length} listings, e.g. ${listingPath(l)}`)
console.log(`footer cols OK — ${cols.map((c) => `${c.id}:${c.links.length}`).join(', ')}`)

// Localized keyword: every non-ka reader gets a Latin/own-script title, no Mkhedruli.
{
  const vake = { id: 'x', dealType: 'sale' as const, propType: 'apartment' as const, rooms: 4, beds: 3, district: 'ვაკე', city: 'თბილისი', title: 'იყიდება ბინა ვაკეში' }
  const tr = (lang: (typeof LANGS)[number]) => (k: Parameters<typeof translate>[1]) => translate(lang, k)
  assert.equal(listingKeywordIn(vake, 'en', tr('en')), '3-bedroom apartment for sale in Vake, Tbilisi')
  assert.equal(listingKeywordIn(vake, 'ka', tr('ka')), listingKeyword(vake))
  for (const lang of LANGS) {
    if (lang === 'ka') continue
    const shown = listingDisplayTitle(vake, lang, tr(lang))
    assert.ok(!/[\u10A0-\u10FF]/.test(shown), `${lang} title leaks Mkhedruli: ${shown}`)
    assert.ok(!/\{\w+\}/.test(shown), `${lang} title has unfilled slot: ${shown}`)
  }
  assert.equal(listingDisplayTitle(vake, 'ka', tr('ka')), vake.title)
  assert.equal(listingDisplayTitle({ ...vake, title: 'Penthouse with a view' }, 'en', tr('en')), 'Penthouse with a view')
}
