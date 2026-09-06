/**
 * Self-check for bilingual name transliteration (SEO alternateName).
 * Run: npx tsx src/lib/bilingual.check.ts
 */
import assert from 'node:assert/strict'

import { PROJECTS } from '../data/professionals'
import { altName, altNameList, toGeorgian, toLatin } from './bilingual'

// Known brand adaptations (search-engine grade, not academic translit)
assert.equal(toGeorgian('Archi Universe'), 'არჩი უნივერსი')
assert.equal(toGeorgian('Downtown Residence'), 'დაუნტაუნი რეზიდენსი')
assert.equal(toGeorgian('Sky Tower'), 'სკაი ტაუერი')
assert.equal(toGeorgian('Batumi Riviera Tower'), 'ბათუმი რივიერა ტაუერი')
assert.equal(toGeorgian('m² Green Apartment'), 'მ² გრინი აპარტმენტი')
assert.equal(toGeorgian('m² at Chkondideli'), 'მ² at ჩკონდიდელი')
// Phonetics, never translation: 'Group' → 'გროუპი', NEVER 'ჯგუფი'
assert.equal(toGeorgian('ORBI Group'), 'ორბი გროუპი')
assert.ok(!toGeorgian('ORBI Group').includes('ჯგუფი'))
// Toponyms + brand words restored via dictionary
assert.equal(toGeorgian('Tbilisi Downtown'), 'თბილისი დაუნტაუნი')
assert.equal(toGeorgian('White Square'), 'ვაიტი სკვერი')
assert.equal(toGeorgian('ORBI City'), 'ორბი სითი')
assert.equal(toGeorgian('Axis Towers'), 'აქსისი ტაუერსი')
assert.equal(toGeorgian('ORBI Sea Towers'), 'ორბი სი ტაუერსი')
assert.equal(toGeorgian('Villa Kokhta'), 'ვილა კოხტა')
assert.equal(toGeorgian('Archi Nutsubidze'), 'არჩი ნუცუბიძე')
assert.equal(toGeorgian('Alliance Palace'), 'ალიანსი პალასი')
assert.equal(toGeorgian('Barceló Residences'), 'ბარცელო რეზიდენსესი')
// Roman numerals stay Latin; 'View' → 'ვიუ'; romanized ka toponyms restore
assert.equal(toGeorgian('Forms Tsatskhvebi III 14'), 'ფორმსი ცაცხვები III 14')
assert.equal(toGeorgian('Gulfstream SeaView'), 'გულფსტრიმი სივიუ')
assert.equal(toGeorgian('Blox Krtsanisi'), 'ბლოქსი კრწანისი')
assert.equal(toGeorgian('Solium Ponichala'), 'სოლიუმი პონიჭალა')
assert.equal(toLatin('არჩი უნივერსი'), 'Archi Universi')
assert.equal(toLatin('დირსი'), 'Dirsi')
assert.equal(toLatin('თბილისი'), 'Tbilisi')

// altName: picks the other script, mixed names pass tokens through
assert.equal(altName('Archi Universe'), 'არჩი უნივერსი')
assert.equal(altName('დირსი'), 'Dirsi')
assert.equal(altName('OMNIA ისანი'), 'ომნია ისანი')
assert.equal(altName('m²'), 'მ²')
assert.equal(altName(''), '')
assert.equal(altName('123'), '')

// Determinism + catalog sweep: every project yields a distinct other-script name
for (const p of PROJECTS) {
  const a = altName(p.name)
  assert.equal(a, altName(p.name), `unstable: ${p.name}`)
  if (/[a-z\u10d0-\u10ff]/i.test(p.name)) assert.ok(a, `no alt for: ${p.name}`)
  assert.notEqual(a, p.name)
}

// altNameList: dedupes variants, drops the canonical name, adds the translit
assert.deepEqual(altNameList('Downtown Residence', ['Downtown Residence', 'Downtown Residence']), [
  'დაუნტაუნი რეზიდენსი',
])
// DIRSI variant already covers Latin — no second derived form
assert.deepEqual(altNameList('დირსი', ['დირსი', 'DIRSI', 'Дирси']), ['DIRSI', 'Дирси'])
// A real ka variant covers the other script — no derived translit noise
assert.deepEqual(altNameList('Nino Beridze', ['ნინო ბერიძე', 'Нино Бердзе']), [
  'ნინო ბერიძე',
  'Нино Бердзе',
])

console.log(`bilingual.check: OK (${PROJECTS.length} projects swept)`)
