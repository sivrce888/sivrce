/**
 * Self-check: basemap labels stay local + user/EN, never latin/nonlatin-only.
 * Run: npx --yes tsx src/lib/map/map-language.check.ts
 */
import assert from 'node:assert/strict'
import { LANGS } from '@/lib/i18n/core'
import { bilingualTextField, mapLabelField } from './map-language'

function walk(v: unknown, pred: (x: unknown) => boolean): boolean {
  if (pred(v)) return true
  if (Array.isArray(v)) return v.some((x) => walk(x, pred))
  if (v && typeof v === 'object') {
    return Object.entries(v).some(([k, x]) => pred(k) || walk(x, pred))
  }
  return false
}

for (const lang of LANGS) {
  const expr = mapLabelField(lang)
  assert.equal((expr as unknown[])[0], 'let', `${lang} let-bind`)
  assert.ok(walk(expr, (x) => x === 'format'), `${lang} dual format`)
  assert.ok(walk(expr, (x) => x === 'name:en'), `${lang} english fallback`)
  assert.ok(walk(expr, (x) => x === 'name'), `${lang} local name`)
  assert.ok(walk(expr, (x) => x === 'font-scale'), `${lang} smaller second line`)
  assert.ok(!walk(expr, (x) => x === 'name:nonlatin'), `${lang} not script-pair`)
}

const de = JSON.stringify(mapLabelField('de'))
assert.ok(de.includes('name:de'), 'de prefers name:de')
assert.ok(de.includes('name:en'), 'de still keeps English')

const ka = JSON.stringify(mapLabelField('ka'))
assert.ok(ka.includes('name:ka'), 'ka prefers name:ka')
assert.ok(ka.includes('name:en'), 'ka still keeps English')

const en = JSON.stringify(mapLabelField('en'))
assert.ok(en.includes('name:en'), 'en uses name:en')
assert.ok(en.includes('name'), 'en still keeps local (München / Munich)')

const pair = bilingualTextField(
  ['coalesce', ['get', 'name'], ''],
  ['coalesce', ['get', 'nameEn'], ''],
)
const pairJson = JSON.stringify(pair)
assert.ok(pairJson.includes('nameEn'), 'overlay uses nameEn')
assert.ok(pairJson.includes('font-scale'), 'overlay smaller second line')
assert.equal((pair as unknown[])[0], 'let')

console.log('map-language: local + user/EN dual labels ✓')
