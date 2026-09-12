/**
 * Runnable check: npx tsx src/lib/categories.check.ts
 * Validates category brand integrity, CMS blocks, and dictionary coverage.
 */
import assert from 'node:assert/strict'
import { CATEGORY_BRAND } from '@/lib/category-brand'
import { CMS_BLOCKS, type CmsBlockKey } from '@/lib/cms-blocks'
import { BLOCK_I18N } from '@/lib/cms-blocks.i18n'
import { SEARCH_CATEGORIES } from '@/components/search/CategoryBar'
import { FEATURE_KEYS } from '@/lib/features'

const HEX_RE = /^#[0-9A-Fa-f]{6}$/

// 1. Verify CATEGORY_BRAND tokens
for (const [key, brand] of Object.entries(CATEGORY_BRAND)) {
  assert.ok(HEX_RE.test(brand.hue), `Category ${key} has invalid hue hex: ${brand.hue}`)
  assert.ok(HEX_RE.test(brand.chip), `Category ${key} has invalid chip hex: ${brand.chip}`)
  assert.ok(brand.chipVar.startsWith('var(--chip-'), `Category ${key} has invalid chipVar: ${brand.chipVar}`)
}

// 2. Verify CMS block keys exist for each category
const categoryBlockKeys: CmsBlockKey[] = [
  'home.categories.apartments',
  'home.categories.houses',
  'home.categories.cottages',
  'home.categories.land',
  'home.categories.commercial',
  'home.categories.dailyRent',
  'home.categories.partyHouses',
  'home.categories.selfCheckIn',
  'home.categories.hotels',
  'home.categories.newProjects',
  'home.categories.pools',
  'home.categories.jacuzzi',
  'home.categories.seaView',
  'home.categories.ski',
  'home.categories.petFriendly',
  'home.categories.workspace',
  'home.categories.penthouses',
  'home.categories.cabins',
]

for (const key of categoryBlockKeys) {
  assert.ok(CMS_BLOCKS[key], `Missing CMS_BLOCKS entry for ${key}`)
  for (const [lang, dict] of Object.entries(BLOCK_I18N)) {
    assert.ok(dict[key], `Missing BLOCK_I18N[${lang}] translation for ${key}`)
  }
}

// 3. Verify SEARCH_CATEGORIES in CategoryBar
assert.ok(SEARCH_CATEGORIES.length >= 18, 'Expected at least 18 search categories')
const allIds = SEARCH_CATEGORIES.map((c) => c.id)
assert.ok(allIds.includes('all'))
assert.ok(allIds.includes('apartments'))
assert.ok(allIds.includes('partyHouses'))
assert.ok(allIds.includes('pools'))
assert.ok(allIds.includes('seaView'))
assert.ok(allIds.includes('jacuzzi'))

// 4. Every category feat must be real vocabulary — splitCsv drops unknown
// feats on /search, so a typo here silently shows UNFILTERED results.
const featSet = new Set<string>(FEATURE_KEYS)
for (const c of SEARCH_CATEGORIES) {
  if (c.feat) assert.ok(featSet.has(c.feat), `${c.id}: feat ${c.feat} is not in FEATURE_KEYS`)
}

console.log('categories.check: ok')
