import assert from 'node:assert/strict'
import {
  formatGel,
  isServiceCategoryId,
  pickLocText,
  providerBySlug,
  providersOf,
  renoBudget,
  RENO_PACKAGES,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_IDS,
  SERVICE_PROVIDERS,
  serviceCategory,
  serviceSlug,
} from './services'

assert.equal(SERVICE_CATEGORIES.length, SERVICE_CATEGORY_IDS.length)
assert.equal(new Set(SERVICE_CATEGORY_IDS).size, SERVICE_CATEGORY_IDS.length)
for (const c of SERVICE_CATEGORIES) {
  assert.ok(isServiceCategoryId(c.id), c.id)
  assert.equal(serviceCategory(c.id)?.id, c.id)
  assert.ok(c.name.ka.length > 1)
  assert.ok(c.brand.hue.startsWith('#'))
}

const slugs = SERVICE_PROVIDERS.map((p) => p.slug)
assert.equal(new Set(slugs).size, slugs.length)
for (const p of SERVICE_PROVIDERS) {
  assert.ok(isServiceCategoryId(p.category), p.slug)
  assert.equal(serviceSlug(p.slug), p.slug)
  assert.ok(p.phone.startsWith('+995'))
  assert.ok(p.description.ka.length >= 40, p.slug)
}

assert.equal(providersOf('renovation').length >= 1, true)
assert.equal(providersOf('nope').length, 0)
assert.equal(providerBySlug('atelier-frame')?.category, 'renovation')
assert.equal(providerBySlug('missing'), undefined)

assert.equal(renoBudget(100, 550, 'თბილისი'), 55_000)
assert.equal(renoBudget(100, 550, 'ქუთაისი'), 39_600)
assert.equal(renoBudget(5, 550), renoBudget(10, 550))
assert.equal(renoBudget(900, 550), renoBudget(400, 550))
assert.equal(RENO_PACKAGES.some((x) => x.id === 'black'), true)

assert.equal(pickLocText({ ka: 'ა', en: 'a', ru: 'а' }, 'ka'), 'ა')
assert.equal(pickLocText({ ka: 'ა', en: 'a', ru: 'а' }, 'en'), 'a')
assert.equal(pickLocText({ ka: 'ა', en: 'a', ru: 'а' }, 'he'), 'a')
assert.ok(formatGel(1000).includes('1'))
assert.ok(formatGel(1000).includes('₾'))

assert.equal(serviceSlug('  Atelier  Frame  '), 'atelier-frame')
assert.equal(serviceSlug('კვ. ფასი'), 'კვ-ფასი')

console.log('services.check: ok')
