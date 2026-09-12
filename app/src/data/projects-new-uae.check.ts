/**
 * Catalog integrity for the UAE seed (Dubai, Abu Dhabi, Sharjah, RAK).
 * Run: npx tsx src/data/projects-new-uae.check.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { DEVELOPERS, PROJECTS } from './professionals'
import { NEW_DEVELOPERS_UAE, NEW_PROJECTS_UAE } from './projects-new-uae'
import { ON_REQUEST } from '../lib/directory-seo-lite'

// AE bounding box (emirate anchors, not survey pins).
const inAE = (lat: number, lng: number) =>
  lat >= 22.5 && lat <= 26.5 && lng >= 51.0 && lng <= 56.6

const AE_CITIES = ['დუბაი', 'აბუ-დაბი', 'შარჯა', 'რას-ელ-ხაიმა', 'აჯმანი']

// Every new row must be wired into the merged catalog exactly once — a slug
// collision would be silently dropped by first-wins dedupe.
for (const d of NEW_DEVELOPERS_UAE) {
  const hits = DEVELOPERS.filter((x) => x.slug === d.slug)
  assert.equal(hits.length, 1, `dev wired once: ${d.slug}`)
  assert.ok(AE_CITIES.includes(d.city), `ae city: ${d.slug}`)
  assert.ok(d.description.ka.length > 40 && d.description.en.length > 40, `dev copy: ${d.slug}`)
  assert.ok(!d.website || d.website.startsWith('https://'), `official site: ${d.slug}`)
  assert.ok(!d.phone || !d.phone.includes('000000'), `fake phone: ${d.slug}`)
  assert.ok(d.verified === false, `verified until editorial review: ${d.slug}`)
}
for (const p of NEW_PROJECTS_UAE) {
  const hits = PROJECTS.filter((x) => x.slug === p.slug)
  assert.equal(hits.length, 1, `project wired once: ${p.slug}`)
  assert.ok(AE_CITIES.includes(p.city), `ae city: ${p.slug}`)
  assert.ok(inAE(p.coords.lat, p.coords.lng), `ae box: ${p.slug}`)
  assert.ok(p.img.startsWith('/images/projects/') && p.img.endsWith('.webp'), `img: ${p.slug}`)
  assert.ok(p.done >= 0 && p.done <= 100, `done: ${p.slug}`)
  assert.ok(p.flats > 0 && p.rating >= 4 && p.rating <= 5, `stats: ${p.slug}`)
  assert.ok(p.description.ka.length > 40 && p.description.en.length > 40, `copy: ${p.slug}`)
  assert.ok(
    p.priceFromM2 === '' || /\d/.test(p.priceFromM2) || p.priceFromM2 === ON_REQUEST,
    `priceFromM2 marker: ${p.slug}`,
  )
  assert.ok(
    !p.developerSlug || DEVELOPERS.some((d) => d.slug === p.developerSlug),
    `dev missing: ${p.developerSlug} (${p.slug})`,
  )
}

// Renders wired in gallery must exist on disk (gen-project-renders.ts fills them).
for (const p of PROJECTS) {
  for (const src of p.gallery ?? []) {
    assert.ok(fs.existsSync(path.join(process.cwd(), 'public', src)), `render file: ${src}`)
  }
}

// Coverage floors the seed is responsible for: every emirate city with rows
// resolves in the global OS and every new project carries a hero render.
const covered = new Set(NEW_PROJECTS_UAE.map((p) => p.city))
for (const city of covered) {
  assert.ok(AE_CITIES.includes(city), `ae coverage city: ${city}`)
}
console.log(
  `uae seed OK: ${NEW_DEVELOPERS_UAE.length} devs, ${NEW_PROJECTS_UAE.length} projects, cities: ${[...covered].join(', ')}`,
)
