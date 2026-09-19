#!/usr/bin/env node
/**
 * enrich-world-media.mjs — license-safe remote media for WORLD_PROJECTS.
 *
 * Only Wikimedia Commons (free-licensed by policy: CC-BY/SA, CC0, public
 * domain) + Wikipedia REST summaries. No developer-site scraping here:
 * renders are copyrighted and mirroring them would bloat the 96MiB/4500-file
 * tree (see scripts/mirror-project-renders.ts for the capped GE/DE pipeline).
 *
 * Output: src/data/world-project-media.ts — hotlinked 1280px Commons thumbs
 * (upload.wikimedia.org CDN, zero repo bytes) with author/license/file-page
 * provenance per image. professionals.ts merges them into project galleries.
 *
 * Usage:
 *   node scripts/enrich-world-media.mjs --slugs=burj-khalifa,marina-bay-sands
 *   node scripts/enrich-world-media.mjs --limit=40 --offset=0   # relevance order
 *   node scripts/enrich-world-media.mjs --all                   # full sweep (slow)
 *   node scripts/enrich-world-media.mjs --all --missing-only  # only slugs with no media yet
 * Flags: --images-per=N (default 3) --dry
 *
 * ponytail: no video discovery — YouTube IDs must be hand-verified (oEmbed);
 * invented IDs render "Video unavailable". Upgrade: --verify-video slug,url.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WORLD_TS = path.join(ROOT, 'src', 'data', 'world-projects.ts')
const OUT_TS = path.join(ROOT, 'src', 'data', 'world-project-media.ts')
const UA = 'SivrcePlatform/1.0 (https://sivrce.com; contact@sivrce.com)'
const SPACING_MS = 300
const JUNK_TITLE = /(logo|icon|avatar|badge|sprite|flag|coat.of.arms|map|diagram|floor.?plan|site.?plan|master.?plan|section|elevation|timetable|ticket|menu|screenshot|imbiss|kiosk)/i
/** Slugs with no verifiable freely-licensed structure photos yet — hero only until Commons catches up. */
const EXCLUDE_SLUGS = new Set(['neom-the-line', 'red-sea-project'])
/** Per-slug title substrings (lowercase) that proved wrong-subject. */
const BLOCKLIST = {
  'lotte-world-tower': ['busan'],
  'hudson-yards': ['room in between'],
  'porsche-design-tower-miami': ['motor show', 'stuttgart'],
}
/** Per-slug Commons query when the catalog name under-specifies the landmark. */
const QUERY_OVERRIDE = { 'la-defense': 'Grande Arche Paris La Defense', 'grand-tower-frankfurt': 'Grand Tower Frankfurt Europaviertel' }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let lastReq = 0
async function polite(url, opts = {}) {
  const gap = Date.now() - lastReq
  if (gap < SPACING_MS) await sleep(SPACING_MS - gap)
  lastReq = Date.now()
  const res = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000), redirect: 'follow', ...opts })
  return res
}

function catalog() {
  const src = readFileSync(WORLD_TS, 'utf8')
  const rows = []
  for (const m of src.matchAll(/\{ slug: '([^']+)'[^}]*?name: '((?:[^'\\]|\\.)*)'[^}]*?city: '((?:[^'\\]|\\.)*)'/gs)) {
    rows.push({ slug: m[1], name: m[2].replace(/\\'/g, "'"), city: m[3].replace(/\\'/g, "'") })
  }
  return rows
}

function loadExisting() {
  try {
    const src = readFileSync(OUT_TS, 'utf8')
    const start = src.indexOf('WORLD_PROJECT_MEDIA')
    const body = src.slice(src.indexOf('{', start), src.lastIndexOf('}') + 1)
    return new Function(`return (${body})`)()
  } catch { return {} }
}

const stripHtml = (s) => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140)

async function commonsImages(name, city, per, slug) {
  const queries = QUERY_OVERRIDE[slug] ? [QUERY_OVERRIDE[slug]] : [`"${name}"`, `"${name}" ${city}`]
  const seen = new Set()
  const out = []
  const blocked = BLOCKLIST[slug] ?? []
  for (const q of queries) {
    if (out.length >= per) break
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search'
      + `&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=10`
      + '&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiextmetadatafilter=LicenseShortName|Artist'
      + '&format=json&formatversion=2'
    let json
    try {
      const res = await polite(url)
      if (!res.ok) continue
      json = await res.json()
    } catch { continue }
    for (const p of json?.query?.pages ?? []) {
      const info = p.imageinfo?.[0]
      if (!info || seen.has(p.title)) continue
      seen.add(p.title)
      if (!/^image\/(jpeg|png|webp)$/.test(info.mime || '')) continue
      if ((info.width || 0) < 900 || (info.size || 0) < 30000) continue
      if (JUNK_TITLE.test(p.title)) continue
      if (blocked.some((b) => p.title.toLowerCase().includes(b))) continue
      const file = p.title.replace(/^File:/, '')
      const imgUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1280`
      out.push({
        url: imgUrl, file,
        page: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
        author: stripHtml(info.extmetadata?.Artist?.value) || undefined,
        license: stripHtml(info.extmetadata?.LicenseShortName?.value) || 'see file page',
      })
      if (out.length >= per) break
    }
  }
  // Verify thumbs resolve to real images (HEAD, no bulk download).
  const verified = []
  for (const c of out) {
    try {
      const res = await polite(c.url, { method: 'HEAD' })
      const ct = res.headers.get('content-type') || ''
      if (res.ok && ct.startsWith('image')) {
        const { file: _f, ...rest } = c
        verified.push(rest)
      }
    } catch { /* unverifiable thumb never ships */ }
    if (verified.length >= per) break
  }
  return verified
}

async function main() {
  const args = process.argv.slice(2)
  const flag = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split('=')[1] ?? null
  const dry = args.includes('--dry')
  const missingOnly = args.includes('--missing-only')
  const per = Number(flag('images-per') ?? 3)
  const all = catalog()
  const bySlug = new Map(all.map((p) => [p.slug, p]))
  const existing = dry ? {} : loadExisting()
  let targets
  if (flag('slugs')) targets = flag('slugs').split(',').map((s) => bySlug.get(s.trim())).filter(Boolean)
  else targets = all
  if (missingOnly && !flag('slugs')) targets = targets.filter((t) => !existing[t.slug] && !EXCLUDE_SLUGS.has(t.slug))
  if (!flag('slugs') && !args.includes('--all')) {
    const limit = Number(flag('limit') ?? 40)
    const offset = Number(flag('offset') ?? 0)
    targets = targets.slice(offset, offset + limit)
  }
  if (args.includes('--all') && (flag('limit') || flag('offset'))) {
    const limit = Number(flag('limit') ?? targets.length)
    const offset = Number(flag('offset') ?? 0)
    targets = targets.slice(offset, offset + limit)
  }
  console.log(`${dry ? 'DRY ' : ''}enriching ${targets.length} world projects (images-per=${per}${missingOnly ? ' missing-only' : ''})`)
  let ok = 0, fail = 0
  for (const t of targets) {
    if (EXCLUDE_SLUGS.has(t.slug)) { delete existing[t.slug]; continue }
    const images = await commonsImages(t.name, t.city, per, t.slug)
    if (images.length === 0) { fail++; console.log(`FAIL ${t.slug} (${t.name})`); continue }
    ok++
    console.log(`${dry ? 'DRY-OK' : 'OK'} ${t.slug} +${images.length}`)
    if (!dry) existing[t.slug] = { images }
    if (!dry && (ok + fail) % 25 === 0) writeOutput(existing) // checkpoint every 25
  }
  if (dry || ok === 0) { console.log(`done: ok=${ok} fail=${fail}`); return }
  writeOutput(existing)
  console.log(`done: ok=${ok} fail=${fail} slugs=${Object.keys(existing).length}`)
}

function writeOutput(existing) {
  const entries = Object.entries(existing).sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, v]) => `  '${slug}': ${JSON.stringify(v, null, 4).split('\n').join('\n  ')}`).join(',\n')
  writeFileSync(OUT_TS,
    `/**\n * World project media — freely-licensed remote images (Wikimedia Commons).\n`
    + ` * Generated by scripts/enrich-world-media.mjs — do not hand-edit; rerun the script.\n`
    + ` * Hotlinked 1280px thumbs (zero repo bytes); author/license/file-page per image.\n */\n`
    + `export type WorldMediaImage = { url: string; page: string; author?: string; license?: string }\n`
    + `export type WorldProjectMedia = { images: WorldMediaImage[]; videos?: string[] }\n`
    + `export const WORLD_PROJECT_MEDIA: Record<string, WorldProjectMedia> = {\n${entries}\n}\n`)
}

main().catch((e) => { console.error(e); process.exit(1) })
