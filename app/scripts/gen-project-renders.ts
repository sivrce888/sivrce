/**
 * First-party renders for the DE catalog (Berlin + Germany-national).
 * Same brand language as gen-project-heroes-2026-08.ts (sv-navy / sv-blue /
 * sv-orange, typographic cards — NOT fake photos). Every card is derived from
 * real Project data (floors/flats/done/finish/coords); window-lit pattern is
 * the only deterministic pseudo-random, seeded by slug.
 * Run: npx tsx scripts/gen-project-renders.ts
 * Fails non-zero if any catalog img is still missing afterwards.
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { PROJECTS } from '../src/data/professionals'
import type { Project } from '../src/data/professionals'
import { NEW_PROJECTS_BERLIN } from '../src/data/projects-new-berlin'
import { NEW_PROJECTS_GERMANY } from '../src/data/projects-new-germany'

const DIR = path.join(__dirname, '..', 'public', 'images', 'projects')
const W = 1600
const H = 900

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** djb2 — stable per slug so renders never shuffle between runs. */
function hash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function wrap2(name: string, max: number): string[] {
  if (name.length <= max) return [name]
  const words = name.split(' ')
  const lines: string[] = ['']
  for (const w of words) {
    const cur = lines[lines.length - 1]
    if ((cur + ' ' + w).trim().length > max && cur) lines.push(w)
    else lines[lines.length - 1] = (cur + ' ' + w).trim()
  }
  return lines.slice(0, 2)
}

const DEFS = `<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#050B26"/>
    <stop offset="55%" stop-color="#0A1440"/>
    <stop offset="100%" stop-color="#1A3FC0"/>
  </linearGradient>
</defs>`

/** Shared chrome: navy gradient, brand edge bar, kicker — mirrors the hero cards. */
function frame(kicker: string): string {
  return `<rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="0" y="0" width="8" height="${H}" fill="#2E6BFF"/>
  <circle cx="1480" cy="120" r="180" fill="#2E6BFF" fill-opacity="0.12"/>
  <circle cx="200" cy="780" r="220" fill="#FF6A2D" fill-opacity="0.08"/>
  <text x="80" y="120" font-family="system-ui, sans-serif" font-size="22" font-weight="700" letter-spacing="4" fill="#8FB4FF">${esc(kicker)}</text>`
}

/** City from the postal segment ('Köpenicker Straße, 10179 Berlin, Mitte' → BERLIN). */
function cityOf(p: Project): string {
  const m = p.location.match(/\d{5}\s+([^,]+)/)
  return ((m?.[1] ?? p.location.split(',').pop() ?? '').trim()).toUpperCase()
}

/** Card labels follow the market: de (postal rows), ka (Georgian cities), else en. */
function labels(p: Project): { kicker: string; units: string; done: string; pending: string; start: string; loc: string; progress: string } {
  if (/[\u10A0-\u10FF]/.test(p.city)) {
    return { kicker: 'SIVRCE · ახალი აშენება', units: 'ბინა', done: 'მზადაა', pending: 'ჩაბარება', start: 'დაწყება', loc: 'მდებარეობა', progress: 'პროგრესი' }
  }
  if (/\d{5}\s/.test(p.location)) {
    return { kicker: 'SIVRCE · NEUBAU', units: 'Einheiten', done: 'BEZUGSFERTIG', pending: 'FERTIGSTELLUNG', start: 'BAUBEGINN', loc: 'LAGE', progress: 'BAUFORTSCHRITT' }
  }
  return { kicker: 'SIVRCE · NEW BUILD', units: 'units', done: 'READY', pending: 'COMPLETION', start: 'START', loc: 'LOCATION', progress: 'PROGRESS' }
}

function finishLine(p: Project, L: ReturnType<typeof labels> = labels(p)): string {
  return p.done >= 100 ? `${L.done} · ${p.finish}` : `${L.pending} ${p.finish}`
}

function hero(p: Project): Buffer {
  const L = labels(p)
  const lines = wrap2(p.name, 34)
  const nameY = lines.length > 1 ? 380 : 420
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${DEFS}
  ${frame(`${L.kicker} · ${cityOf(p)}`)}
  ${lines.map((l, i) => `<text x="80" y="${nameY + i * 84}" font-family="system-ui, sans-serif" font-size="72" font-weight="800" fill="#FFFFFF">${esc(l)}</text>`).join('\n  ')}
  <text x="80" y="${nameY + (lines.length - 1) * 84 + 80}" font-family="system-ui, sans-serif" font-size="28" font-weight="600" fill="#8FB4FF">${esc(p.location)}</text>
  <rect x="80" y="${H - 118}" width="${finishLine(p, L).length * 15 + 56}" height="52" rx="26" fill="#FF6A2D" fill-opacity="0.16"/>
  <text x="106" y="${H - 84}" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="#FF6A2D">${esc(finishLine(p, L))}</text>
</svg>`
  return Buffer.from(svg)
}

/** Massing study: real floors × flats → silhouette + window grid + crane while under construction. */
function massing(p: Project): Buffer {
  const L = labels(p)
  const r = hash(p.slug)
  const floors = Math.max(3, p.floors ?? Math.round(Math.sqrt(p.flats) * 1.6))
  const bw = Math.min(720, 300 + p.flats * 1.1)
  const bh = Math.min(540, floors * 42)
  const bx = 760 - bw / 2 - (r % 3) * 50
  const by = 810 - bh
  // Low annex right — massing rhythm, height tied to the same project data.
  const abw = Math.max(140, bw * 0.38)
  const abh = Math.max(90, bh * 0.42)
  const abx = Math.min(1480 - abw, bx + bw + 150)
  const aby = 810 - abh
  const cols = Math.max(3, Math.floor(bw / 78))
  const cell = bw / cols
  let win = ''
  for (let c = 0; c < cols; c++) {
    for (let f = 1; f < floors; f++) {
      const wy = by + f * (bh / floors) + (bh / floors) * 0.22
      const wh = (bh / floors) * 0.56
      if (wy + wh > 752) continue // ground-floor retail band, no windows
      const lit = (r + c * 31 + f * 17) % 100 < 12
      win += `<rect x="${(bx + c * cell + cell * 0.24).toFixed(1)}" y="${wy.toFixed(1)}" width="${(cell * 0.52).toFixed(1)}" height="${wh.toFixed(1)}" rx="3" fill="${lit ? '#FF6A2D' : '#8FB4FF'}" fill-opacity="${lit ? 0.55 : 0.16}"/>`
    }
  }
  // Tower crane parked against the right facade while construction runs.
  const mastX = bx + bw + 90
  const crane = p.done < 100
    ? `<g stroke="#8FB4FF" stroke-width="5" fill="none" opacity="0.8">
    <line x1="${mastX}" y1="810" x2="${mastX}" y2="${Math.max(190, by - 130)}"/>
    <line x1="${mastX - 300}" y1="${Math.max(190, by - 130)}" x2="${mastX + 140}" y2="${Math.max(190, by - 130)}"/>
    <line x1="${mastX}" y1="${Math.max(190, by - 130)}" x2="${mastX - 60}" y2="${Math.max(110, by - 210)}"/>
    <line x1="${mastX + 100}" y1="${Math.max(190, by - 130)}" x2="${mastX + 100}" y2="${by + 20}"/>
    <rect x="${mastX - 24}" y="${Math.max(190, by - 130) - 26}" width="48" height="48" fill="#0A1440"/>
  </g>`
    : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${DEFS}
  ${frame(`SIVRCE · MASSING · ${esc(p.name.toUpperCase().slice(0, 40))}`)}
  <rect x="${abx}" y="${aby}" width="${abw}" height="${abh}" fill="#0D1A4D" stroke="#2E6BFF" stroke-opacity="0.4"/>
  <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#0A1440" stroke="#2E6BFF" stroke-opacity="0.45"/>
  <rect x="${bx}" y="764" width="${bw}" height="46" fill="#2E6BFF" fill-opacity="0.3"/>
  <line x1="${bx}" y1="764" x2="${bx + bw}" y2="764" stroke="#8FB4FF" stroke-opacity="0.6" stroke-width="2"/>
  ${win}
  ${crane}
  <line x1="80" y1="810" x2="1520" y2="810" stroke="#8FB4FF" stroke-opacity="0.25" stroke-width="2"/>
  <text x="80" y="862" font-family="system-ui, sans-serif" font-size="26" font-weight="700" fill="#FFFFFF">${p.flats} ${L.units}${p.floors ? ` · ${floors}` : ''}</text>
  <text x="1520" y="862" text-anchor="end" font-family="system-ui, sans-serif" font-size="24" font-weight="600" fill="#8FB4FF">${esc(p.location.split(',').slice(-2).join(',').trim())}</text>
</svg>`
  return Buffer.from(svg)
}

/** Progress: real done% + finish quarter. */
function timeline(p: Project): Buffer {
  const L = labels(p)
  const track = 1160
  const fill = Math.round(track * Math.min(1, p.done / 100))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${DEFS}
  ${frame(`SIVRCE · ${L.progress} · ${esc(p.name.toUpperCase().slice(0, 34))}`)}
  <text x="80" y="400" font-family="system-ui, sans-serif" font-size="260" font-weight="800" fill="#FFFFFF">${p.done}<tspan font-size="120" fill="#8FB4FF">%</tspan></text>
  <text x="80" y="470" font-family="system-ui, sans-serif" font-size="28" font-weight="600" fill="#8FB4FF">${esc(finishLine(p, L))}</text>
  <rect x="80" y="600" width="${track}" height="26" rx="13" fill="#8FB4FF" fill-opacity="0.15"/>
  <rect x="80" y="600" width="${fill}" height="26" rx="13" fill="#FF6A2D"/>
  <circle cx="${80 + fill}" cy="613" r="20" fill="#FF6A2D"/>
  <text x="80" y="700" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="#8FB4FF">${esc(L.start)}</text>
  <text x="${80 + track}" y="700" text-anchor="end" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="#FF6A2D">${esc(p.finish)}</text>
  <text x="1520" y="862" text-anchor="end" font-family="system-ui, sans-serif" font-size="22" font-weight="600" fill="#8FB4FF" fill-opacity="0.8">${esc(p.location)}</text>
</svg>`
  return Buffer.from(svg)
}

/** Location: abstract city grid + pin, real street / district / coords. */
function lage(p: Project): Buffer {
  const r = hash(p.slug + 'lage')
  const L = labels(p)
  let blocks = ''
  for (let i = 0; i < 9; i++) {
    const bw2 = 60 + ((r >> i) % 110)
    const bh2 = 60 + ((r >> (i + 3)) % 150)
    blocks += `<rect x="${(90 + i * 164).toFixed(0)}" y="${(810 - bh2).toFixed(0)}" width="${bw2}" height="${bh2}" fill="#1A3FC0" fill-opacity="0.28"/>`
  }
  const lat = `${Math.abs(p.coords.lat).toFixed(4)}° ${p.coords.lat >= 0 ? 'N' : 'S'}`
  const lng = `${Math.abs(p.coords.lng).toFixed(4)}° ${p.coords.lng >= 0 ? 'E' : 'W'}`
  const parts = p.location.split(',').map((s) => s.trim())
  const city = cityOf(p).toLowerCase()
  let district = (parts[parts.length - 1] ?? '').replace(/^\d{5}\s+/, '')
  if (district.toLowerCase() === city && parts.length > 1) district = parts[parts.length - 2]
  const street = parts.slice(0, -1).join(', ')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${DEFS}
  ${frame(`SIVRCE · ${L.loc} · ${cityOf(p)}`)}
  <g stroke="#2E6BFF" stroke-opacity="0.18" stroke-width="2">
    <line x1="0" y1="260" x2="${W}" y2="260"/><line x1="0" y1="440" x2="${W}" y2="440"/><line x1="0" y1="620" x2="${W}" y2="620"/>
    <line x1="400" y1="160" x2="400" y2="810"/><line x1="800" y1="160" x2="800" y2="810"/><line x1="1200" y1="160" x2="1200" y2="810"/>
  </g>
  ${blocks}
  <circle cx="800" cy="540" r="120" fill="#FF6A2D" fill-opacity="0.12"/>
  <circle cx="800" cy="540" r="56" fill="#FF6A2D" fill-opacity="0.2"/>
  <path d="M800 588 c-30 -38 -48 -62 -48 -88 a48 48 0 1 1 96 0 c0 26 -18 50 -48 88 z" fill="#FF6A2D"/>
  <circle cx="800" cy="500" r="18" fill="#050B26"/>
  <text x="80" y="330" font-family="system-ui, sans-serif" font-size="96" font-weight="800" fill="#FFFFFF">${esc(district)}</text>
  <text x="80" y="390" font-family="system-ui, sans-serif" font-size="30" font-weight="600" fill="#8FB4FF">${esc(street)}</text>
  <text x="80" y="862" font-family="ui-monospace, monospace" font-size="22" fill="#8FB4FF" fill-opacity="0.75">${lat} · ${lng}</text>
</svg>`
  return Buffer.from(svg)
}

const suffixes = ['-massing', '-timeline', '-lage'] as const
const renderers = [massing, timeline, lage]

// Gallery trio is owned by rows whose gallery references it (DE + UAE seeds);
// other corpora keep their own first-party/owner-supplied art.
function galleryPaths(p: Project): string[] {
  return (p.gallery ?? []).filter((g) => suffixes.some((sfx) => g.endsWith(`${sfx}.webp`)))
}

async function main() {
  fs.mkdirSync(DIR, { recursive: true })
  const all: Project[] = PROJECTS
  let heroes = 0
  let cards = 0
  for (const p of all) {
    const heroPath = path.join(DIR, path.basename(p.img))
    if (!fs.existsSync(heroPath)) {
      await sharp(hero(p)).webp({ quality: 86 }).toFile(heroPath)
      heroes++
    }
    for (const g of galleryPaths(p)) {
      const out = path.join(DIR, path.basename(g))
      if (fs.existsSync(out)) continue
      const i = suffixes.findIndex((sfx) => path.basename(g).endsWith(`${sfx}.webp`))
      await sharp(renderers[i](p)).webp({ quality: 80 }).toFile(out)
      cards++
    }
  }
  const missing = all.filter((p) => !fs.existsSync(path.join(DIR, path.basename(p.img))))
  if (missing.length) {
    console.error('STILL MISSING:', missing.map((p) => p.img).join(', '))
    process.exit(1)
  }
  console.log(`renders: +${heroes} heroes (were missing), +${cards} gallery cards, ${all.length} projects. OK`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
