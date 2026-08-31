/**
 * Runnable lock: every registered city has a page; AI crawlers get a real llms.txt.
 * Run: npx tsx src/lib/llms-txt.check.ts
 */
import assert from 'node:assert/strict'
import { NEIGHBORHOODS } from '@/data/neighborhoods'
import { BUILDINGS } from '@/data/buildings'
import { DEVELOPERS, PROJECTS } from '@/data/professionals'
import { CITIES, CITY_PROSE, DISTRICTS, parseSeoSlug } from './seo-pages'
import { llmsFullTxt, llmsTxt } from './llms-txt'

const short = llmsTxt()
assert.ok(short.startsWith('# sivrce'), 'llms.txt needs an H1')
assert.ok(short.includes('https://sivrce.ge/sale'), 'llms.txt missing sale hub')
assert.ok(short.includes('https://sivrce.ge/pledge'), 'llms.txt missing pledge hub')
assert.ok(short.includes('llms-full.txt'), 'llms.txt must point at the full catalog')
assert.ok(short.includes('/neighborhoods'), 'llms.txt missing neighborhoods hub')
assert.ok(short.includes('უძრავი ქონება'), 'llms.txt missing Georgian identity')
assert.ok(short.includes('/daily'), 'llms.txt missing daily hub')
assert.ok(!/myhome|ss\.ge/i.test(short), 'llms.txt must not name competitors')

const full = llmsFullTxt()
assert.ok(full.startsWith('# sivrce'), 'llms-full.txt needs an H1')
assert.ok(full.length > 8000, 'llms-full.txt too thin for a catalog')
assert.ok(!/myhome|ss\.ge/i.test(full), 'llms-full must not name competitors')

const inventory = new Set(['tbilisi', 'batumi', 'kutaisi'])
for (const c of CITIES) {
  assert.ok(parseSeoSlug([c.slug]), `${c.slug} must resolve to a page`)
  assert.ok(full.includes(`/${c.slug}`), `llms-full missing city ${c.slug}`)
  if (!inventory.has(c.slug)) {
    const prose = CITY_PROSE[c.slug]
    assert.ok(prose, `${c.slug} needs CITY_PROSE (no listings yet)`)
    assert.ok(prose.lede.length > 80, `${c.slug} lede too short`)
    assert.ok(prose.body.length >= 2, `${c.slug} needs ≥2 body paras`)
    assert.ok(prose.body.every((p) => p.length > 40), `${c.slug} thin body`)
    assert.ok(prose.faqs.length >= 2, `${c.slug} needs ≥2 FAQs`)
    assert.ok(prose.coords, `${c.slug} needs coords for Place JSON-LD`)
  }
}

const ledes = Object.values(CITY_PROSE).map((p) => p.lede)
assert.equal(ledes.length, new Set(ledes).size, 'CITY_PROSE ledes must be unique')

// Every SEO district has a neighbourhood guide (slug aliases: chughureti → chugureti).
const nbhSlugs = new Set(NEIGHBORHOODS.map((n) => n.slug))
const nbhAlias: Record<string, string> = { chughureti: 'chugureti' }
for (const d of DISTRICTS) {
  const slug = nbhAlias[d.slug] ?? d.slug
  assert.ok(nbhSlugs.has(slug), `district ${d.slug} missing neighborhood guide (${slug})`)
  assert.ok(full.includes(`/neighborhoods/${slug}`), `llms-full missing neighbourhood ${slug}`)
  if (parseSeoSlug(['sale', 'apartments', d.citySlug, d.slug])) {
    assert.ok(full.includes(`/sale/apartments/${d.citySlug}/${d.slug}`), `llms-full missing live sale hub ${d.slug}`)
  }
  if (parseSeoSlug(['daily', 'apartments', d.citySlug, d.slug])) {
    assert.ok(full.includes(`/daily/apartments/${d.citySlug}/${d.slug}`), `llms-full missing live daily hub ${d.slug}`)
  }
}

const nbhDescs = NEIGHBORHOODS.map((n) => n.description.ka)
assert.equal(nbhDescs.length, new Set(nbhDescs).size, 'neighbourhood ka descriptions must be unique')
assert.ok(
  NEIGHBORHOODS.every((n) => n.description.ka.length > 80 && n.description.en.length > 60),
  'neighbourhood descriptions too thin',
)
assert.ok(
  NEIGHBORHOODS.filter((n) => n.type === 'Neighborhood').every((n) => n.districts.length > 0),
  'neighbourhood guides need a listing district key',
)

for (const b of BUILDINGS) {
  assert.ok(full.includes(`/buildings/${b.slug}`), `llms-full missing building ${b.slug}`)
}
for (const p of PROJECTS) {
  assert.ok(full.includes(`/projects/${p.slug}`), `llms-full missing project ${p.slug}`)
}
for (const d of DEVELOPERS) {
  assert.ok(full.includes(`/developers/${d.slug}`), `llms-full missing developer ${d.slug}`)
}

console.log(
  `llms-txt: ${CITIES.length} cities, ${DISTRICTS.length} districts, ${NEIGHBORHOODS.length} guides, ${BUILDINGS.length} buildings, ${PROJECTS.length} projects, ${DEVELOPERS.length} developers ✓`,
)
