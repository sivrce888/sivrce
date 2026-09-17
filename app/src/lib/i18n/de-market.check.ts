/**
 * Self-check: Germany-market chrome overlay (no network).
 * Run: npx tsx src/lib/i18n/de-market.check.ts
 */
import assert from 'node:assert/strict'
import { stayLine } from '../listing-format'
import type { DictKey } from './ka'
import { de } from './de'
import { en } from './en'
import { DE_SITE_KEYWORDS, DE_SITE_META, deMarketOverlay, withDeMarketDict } from './de-market'

const BANNED = /Tiflis|Tbilisi|Georgien|Georgia|Batumi|NAPR|Chavchavadze|Vake|Saburtalo/i

for (const lang of ['de', 'en'] as const) {
  const o = deMarketOverlay(lang)
  assert.ok(o && Object.keys(o).length >= 8, `${lang} overlay too thin`)
  for (const [k, v] of Object.entries(o)) {
    assert.ok((k as DictKey) in de, `overlay key missing from dict shape: ${k}`)
    assert.ok(v && v.length >= 8, `${lang}.${k} empty`)
    assert.ok(!BANNED.test(v), `${lang}.${k} still Georgia-flavoured: ${v}`)
  }
}

assert.equal(deMarketOverlay('ka'), null, 'ka stays Georgia-German on sivrce.ge')
assert.equal(deMarketOverlay('ru'), null)

const merged = withDeMarketDict(de, 'de')
assert.notEqual(merged, de, 'must clone — never mutate the dict table')
assert.equal(merged['search.keywordPlaceholder'], deMarketOverlay('de')!['search.keywordPlaceholder'])
assert.ok(merged['search.keywordPlaceholder'] !== de['search.keywordPlaceholder'])
assert.equal(de['footer.location'], 'Tiflis, Georgien', 'Georgia-German dict must stay for sivrce.ge/de')

const enMerged = withDeMarketDict(en, 'en')
assert.ok(!BANNED.test(enMerged['search.keywordPlaceholder']))
assert.equal(withDeMarketDict(en, 'ru'), en, 'non de/en overlay is identity')

assert.ok(DE_SITE_META.de && !BANNED.test(DE_SITE_META.de.title))
assert.ok(DE_SITE_META.de && !BANNED.test(DE_SITE_META.de.description))
assert.ok(DE_SITE_META.en && !BANNED.test(DE_SITE_META.en.title))
assert.ok(DE_SITE_KEYWORDS.de?.includes('immobilien deutschland'))
assert.ok(DE_SITE_KEYWORDS.en?.includes('real estate germany'))

assert.equal(stayLine({ rooms: 3, beds: 2 }, (k) => (k === 'spec.rooms' ? 'Zimmer' : 'Schlafzimmer'), 'de'), '3 Zimmer')
assert.equal(stayLine({ rooms: 1, beds: 0 }, (k) => (k === 'spec.rooms' ? 'Zimmer' : 'Schlafzimmer'), 'de'), '1 Zimmer')
assert.equal(
  stayLine({ rooms: 3, beds: 2 }, (k) => (k === 'spec.rooms' ? 'Rooms' : 'Bedrooms'), 'en'),
  '2 Bedrooms · 3 Rooms',
  'non-DE stayLine stays bedrooms-first',
)

console.log('de-market.check: OK ✓ — Germany chrome overlay is Georgia-free')
