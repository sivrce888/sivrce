// ponytail: og:image hero only; gallery scrape + R2 (cdn.sivrce.ge) upload when R2 creds land
/**
 * mirror-project-renders.ts — mirrors official project renders to
 * public/images/projects/<slug>.webp.
 *
 * Strategy per project:
 *   1. official developer site: listing pages + sitemap.xml → match project
 *      page by distinctive slug tokens → og:image (→ JSON-LD → twitter:image)
 *   2. korter.ge fallback: korter.ge/en/<slug>-<city> (og:title must mention
 *      a distinctive token) or korter developer listing match
 *   3. failed
 *
 * Modes:
 *   default        run mirror for selected projects (chunkable)
 *   --revert       revert FAILED batch-1 img fields back to /images/np1.webp
 *   --apply-batch2 write successful batch-2 img updates into professionals.ts
 *
 * Flags: --batch=1|2 --from=N --limit=M --slugs=a,b,c --dry
 * Manifest: ../research/renders-manifest-2026-07.json (upserted per project).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { PROJECTS } from '../src/data/professionals'
import { NEW_PROJECTS_TBILISI } from '../src/data/projects-new-tbilisi'
import { NEW_PROJECTS_BATUMI } from '../src/data/projects-new-batumi'
import { NEW_PROJECTS_REGIONS } from '../src/data/projects-new-regions'

const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'images', 'projects')
const MANIFEST = path.resolve(ROOT, '..', 'research', 'renders-manifest-2026-07.json')
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const FETCH_TIMEOUT_MS = 20_000
const SPACING_MS = 300

type ManifestEntry = {
  slug: string
  status: 'ok' | 'failed'
  source: 'official' | 'korter' | null
  sourceUrl: string | null
  batch: 1 | 2
}

type Target = {
  slug: string
  name: string
  dev: string
  city: string
  file: 'tbilisi' | 'batumi' | 'regions' | 'professionals'
}

// ── developer site config (research/developers-verify-2026-07.md) ──────────
const DEV_SITES: Record<string, { base: string; listings: string[] }> = {
  'm2-development': { base: 'https://m2.ge', listings: ['/en/projects', '/en/offers'] },
  archi: { base: 'https://archi.ge', listings: ['/en/projects'] },
  axis: { base: 'https://www.axis.ge', listings: ['/en/projects', '/en/projects/current/'] },
  blox: { base: 'https://blox.ge', listings: ['/en', '/en/projects'] },
  biograpi: { base: 'https://biograpi.ge', listings: ['/en/projects'] },
  'domus-development': { base: 'https://domusi.com', listings: ['/en/projects', '/en'] },
  'white-square': { base: 'https://w2.ge', listings: ['/en/projects'] },
  'next-group': { base: 'https://next-property.com', listings: ['/en', '/en/projects'] },
  'orbi-group': { base: 'https://orbi.ge', listings: ['/en/projects'] },
  'inn-development': { base: 'https://www.inndevelopment.ge', listings: ['/en'] },
  metropol: { base: 'https://metropol.ge', listings: ['/en', '/en/projects'] },
  'mardi-holding': { base: 'https://mardi.ge', listings: ['/en', '/en/projects'] },
  'gumbati-holding': { base: 'https://gumbati.ge', listings: ['/en/projects', '/en'] },
  'european-village': { base: 'https://europeanvillage.info', listings: ['/en', '/en/projects'] },
  'tekto-group': { base: 'https://tekto.ge', listings: ['/en/projects', '/en'] },
  'horizon-group': { base: 'https://horizonsbatumi.com', listings: ['/en', '/projects'] },
  tempo: { base: 'https://tempoholding.ge', listings: ['/en', '/en/projects'] },
  'reside-development': { base: 'https://reside.ge', listings: ['/en/projects', '/en'] },
  redco: { base: 'https://redco.ge', listings: ['/en/projects', '/en'] },
  'tower-group': { base: 'https://towergroup.ge', listings: ['/en', '/en/projects'] },
  'crystal-group': { base: 'https://crystal.ge', listings: ['/en', '/en/projects'] },
  'tbilisi-hills': { base: 'https://tbilisihills.ge', listings: ['/en', '/en'] },
  dirsi: { base: 'https://dirsi.ge', listings: ['/en', '/en/projects'] },
  anagi: { base: 'https://anagi.ge', listings: ['/en'] },
  'alliance-group': { base: 'https://alliancegroup.ge', listings: ['/en', '/en/projects'] },
}

// ka city → korter.ge city slug
const KORTER_CITY: Record<string, string> = {
  'თბილისი': 'tbilisi',
  'ბათუმი': 'batumi',
  'რუსთავი': 'rustavi',
  'ქუთაისი': 'kutaisi',
  'თელავი': 'telavi',
  'ბაკურიანი': 'bakuriani',
  'გუდაური': 'gudauri',
  'შეკვეტილი': 'shekvetili',
  'ქობულეთი': 'kobuleti',
  'წიხისძირი': 'tsikhisdziri',
  'გონიო': 'gonio',
  'წყნეთი': 'tskneti',
  'კვარიათი': 'kvariati',
}

const BIG_DEVS_B2 = new Set([
  'm2-development', 'archi', 'axis', 'blox', 'alliance-group', 'orbi-group',
  'dirsi', 'anagi', 'biograpi', 'domus-development', 'metropol',
  'mardi-holding', 'gumbati-holding',
])

const STOP = new Set([
  'at', 'the', 'by', 'in', 'on', 'of', 'and', 'a', 'an', 'new', 'group',
  'development', 'holding', 'residence', 'residences', 'project', 'complex',
  'ge', 'en', 'ka', 'ru', 'www', 'com',
])

// ── tiny utils ─────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
let lastReq = 0

const htmlCache = new Map<string, string | null>()

async function fetchText(url: string): Promise<string | null> {
  if (htmlCache.has(url)) return htmlCache.get(url)!
  const gap = Date.now() - lastReq
  if (gap < SPACING_MS) await sleep(SPACING_MS - gap)
  lastReq = Date.now()
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,*/*' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    })
    if (!res.ok) {
      htmlCache.set(url, null)
      return null
    }
    const text = await res.text()
    htmlCache.set(url, text)
    return text
  } catch {
    htmlCache.set(url, null)
    return null
  }
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
  const gap = Date.now() - lastReq
  if (gap < SPACING_MS) await sleep(SPACING_MS - gap)
  lastReq = Date.now()
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA, accept: 'image/webp,image/png,image/jpeg,image/gif;q=0.9,*/*;q=0.1' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') ?? ''
    if (ct && !ct.includes('image') && !ct.includes('octet-stream')) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

function resolveUrl(href: string, pageUrl: string): string | null {
  try {
    return new URL(href, pageUrl).toString()
  } catch {
    return null
  }
}

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/m²/g, 'm2')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0)
}

/** exact token hit, or Georgian-style -ze suffix fuzzy hit (chkondideli ~ chkondidelze) */
function tokenHit(need: string, have: Set<string>): boolean {
  if (have.has(need)) return true
  if (need.length < 10 || /\d/.test(need)) return false
  for (const h of have) {
    if (h.length < 10) continue
    let i = 0
    while (i < need.length && i < h.length && need[i] === h[i]) i++
    if (i >= 8) return true
  }
  return false
}

/** distinctive tokens: slug tokens (name as fallback) minus dev alias minus stopwords */
function distinctiveTokens(t: Target): string[] {
  const devTokens = new Set(tokens(t.dev))
  const pick = (raw: string[]): string[] => {
    const out: string[] = []
    for (const tok of raw) {
      if (STOP.has(tok) || devTokens.has(tok)) continue
      if (tok.length < 3 && !/^\d+$/.test(tok)) continue
      if (!out.includes(tok)) out.push(tok)
    }
    return out
  }
  const fromSlug = pick(tokens(t.slug))
  return fromSlug.length > 0 ? fromSlug : pick(tokens(t.name))
}

function extractLinks(html: string, pageUrl: string): string[] {
  const links = new Set<string>()
  for (const m of html.matchAll(/href="([^"#]+)"/g)) {
    const u = resolveUrl(m[1]!, pageUrl)
    if (u && u.startsWith('http')) links.add(u)
  }
  // sitemap <loc>
  for (const m of html.matchAll(/<loc>([^<]+)<\/loc>/g)) links.add(m[1]!.trim())
  return [...links]
}

/** score candidate page URLs against the project; best full-match wins */
function matchProjectPage(t: Target, candidates: string[]): string | null {
  const need = distinctiveTokens(t)
  if (need.length === 0) return null
  let best: { url: string; score: number } | null = null
  for (const url of candidates) {
    let pathname = ''
    try {
      pathname = new URL(url).pathname.toLowerCase()
    } catch {
      continue
    }
    if (/\.(css|js|png|jpe?g|webp|svg|ico|woff2?|pdf)$/i.test(pathname)) continue
    const have = new Set(tokens(pathname))
    const hits = need.filter((tok) => tokenHit(tok, have))
    if (hits.length < need.length) continue // require ALL distinctive tokens
    // tie-break: more total slug tokens present, then shorter path
    const slugHits = tokens(t.slug).filter((tok) => tokenHit(tok, have)).length
    const score = slugHits * 100 - pathname.length
    if (!best || score > best.score) best = { url, score }
  }
  return best?.url ?? null
}

function extractImage(html: string, pageUrl: string): string | null {
  const meta = (re: RegExp): string | null => {
    const m = html.match(re)
    return m?.[1] ? resolveUrl(m[1].trim(), pageUrl) : null
  }
  const og =
    meta(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
    meta(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ??
    meta(/<meta[^>]+property=["']og:image:url["'][^>]+content=["']([^"']+)["']/i) ??
    meta(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ??
    meta(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)
  if (og && !og.endsWith('.svg')) return og
  // JSON-LD image
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]!) as unknown
      const stack: unknown[] = [data]
      while (stack.length) {
        const cur = stack.pop()
        if (!cur || typeof cur !== 'object') continue
        if (Array.isArray(cur)) {
          stack.push(...cur)
          continue
        }
        const rec = cur as Record<string, unknown>
        if (typeof rec.image === 'string' && /^https?:\/\//.test(rec.image)) return rec.image
        if (Array.isArray(rec.image) && typeof rec.image[0] === 'string') return rec.image[0] as string
        stack.push(...Object.values(rec))
      }
    } catch {
      /* bad json-ld */
    }
  }
  return null
}

function titleOf(html: string): string {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
  if (og?.[1]) return og[1].toLowerCase()
  const t = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return (t?.[1] ?? '').toLowerCase()
}

async function saveWebp(buf: Buffer, slug: string): Promise<boolean> {
  try {
    await mkdir(OUT_DIR, { recursive: true })
    await sharp(buf)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(OUT_DIR, `${slug}.webp`))
    return true
  } catch {
    return false
  }
}

// ── strategies ─────────────────────────────────────────────────────────────
async function tryOfficial(t: Target): Promise<string | null> {
  const cfg = DEV_SITES[t.dev]
  if (!cfg) return null
  const candidates = new Set<string>()
  for (const lp of cfg.listings) {
    const url = cfg.base + lp
    const html = await fetchText(url)
    if (html) for (const l of extractLinks(html, url)) candidates.add(l)
  }
  // sitemap fallback (JS-rendered sites)
  const sm = await fetchText(cfg.base + '/sitemap.xml')
  if (sm) for (const l of extractLinks(sm, cfg.base)) candidates.add(l)
  const page = matchProjectPage(t, [...candidates])
  if (!page) return null
  const html = await fetchText(page)
  if (!html) return null
  // sanity for weak short tokens only: a single short token (gonio, midtown)
  // needs og:title confirmation; long/multi-token URL matches self-verify
  const alpha = distinctiveTokens(t).filter((x) => /[a-z]/.test(x) && x.length >= 4)
  const weak = alpha.length === 1 && alpha[0]!.length <= 7
  if (weak && !alpha.some((tok) => titleOf(html).includes(tok))) return null
  const img = extractImage(html, page)
  if (!img) return null
  const buf = await fetchBuffer(img)
  if (!buf || buf.length < 5_000) return null
  if (!(await saveWebp(buf, t.slug))) return null
  return page
}

async function tryKorter(t: Target): Promise<string | null> {
  const cities = new Set<string>()
  const mapped = KORTER_CITY[t.city]
  if (mapped) cities.add(mapped)
  if (t.file === 'tbilisi') cities.add('tbilisi')
  if (t.file === 'batumi') cities.add('batumi')
  cities.add('tbilisi')
  cities.add('batumi')
  const need = distinctiveTokens(t).filter((x) => /[a-z]/.test(x) && x.length >= 4)

  const checkPage = async (url: string): Promise<string | null> => {
    const html = await fetchText(url)
    if (!html) return null
    const title = titleOf(html)
    // verify the page actually is about this project
    if (need.length > 0 && !need.some((tok) => title.includes(tok))) return null
    const img = extractImage(html, url)
    if (!img) return null
    const buf = await fetchBuffer(img)
    if (!buf || buf.length < 5_000) return null
    if (!(await saveWebp(buf, t.slug))) return null
    return url
  }

  // direct slug variants: full slug, phase number stripped, dev prefix
  // stripped, dev-first-token + rest (korter slug ≈ ours but not exact)
  const slugVariants = new Set<string>([t.slug])
  const noPhase = t.slug.replace(/-\d+$/, '')
  if (noPhase !== t.slug) slugVariants.add(noPhase)
  const devToks = tokens(t.dev)
  const rest = tokens(t.slug).filter((tok) => !devToks.includes(tok) && tok !== 'at')
  if (rest.length > 0) {
    slugVariants.add(rest.join('-'))
    if (devToks[0]) slugVariants.add(`${devToks[0]}-${rest.join('-')}`)
  }
  for (const variant of slugVariants) {
    for (const city of cities) {
      const got = await checkPage(`https://korter.ge/en/${variant}-${city}`)
      if (got) return got
    }
  }
  // korter developer listing match (relaxed: numeric tokens + ≥1 strong alpha
  // token required, og:title still verified inside checkPage)
  const devVariants = new Set<string>([t.dev])
  if (devToks[0]) devVariants.add(devToks[0])
  devVariants.add(t.dev.replace(/-(development|group|holding|ge)$/, ''))
  const numeric = distinctiveTokens(t).filter((x) => /^\d+$/.test(x))
  for (const dv of devVariants) {
    if (!dv) continue
    const devUrl = `https://korter.ge/en/${dv}`
    const devHtml = await fetchText(devUrl)
    if (!devHtml) continue
    const links = extractLinks(devHtml, devUrl).filter((l) => l.includes('korter.ge/en/'))
    let best: string | null = null
    let bestHits = 0
    for (const url of links) {
      let pathname = ''
      try {
        pathname = new URL(url).pathname.toLowerCase()
      } catch {
        continue
      }
      const have = new Set(tokens(pathname))
      if (!numeric.every((n) => have.has(n))) continue
      const hits = need.filter((tok) => have.has(tok)).length
      if (hits > bestHits) {
        best = url
        bestHits = hits
      }
    }
    if (best && bestHits > 0) {
      const got = await checkPage(best)
      if (got) return got
    }
  }
  return null
}

// ── targets ────────────────────────────────────────────────────────────────
function batch1Targets(): Target[] {
  const files = [
    { arr: NEW_PROJECTS_TBILISI, file: 'tbilisi' as const },
    { arr: NEW_PROJECTS_BATUMI, file: 'batumi' as const },
    { arr: NEW_PROJECTS_REGIONS, file: 'regions' as const },
  ]
  const out: Target[] = []
  for (const { arr, file } of files)
    for (const p of arr)
      if (p.img.startsWith('/images/projects/'))
        out.push({ slug: p.slug, name: p.name, dev: p.developerSlug, city: p.city, file })
  return out
}

function batch2Targets(): Target[] {
  const newSlugs = new Set(batch1Targets().map((t) => t.slug))
  const out: Target[] = []
  for (const p of PROJECTS) {
    if (newSlugs.has(p.slug)) continue
    // ponytail: all remaining stock heroes (np* + p*), not only BIG_DEVS
    if (!/^\/images\/(np|p)\d+\.webp$/.test(p.img)) continue
    out.push({ slug: p.slug, name: p.name, dev: p.developerSlug, city: p.city, file: 'professionals' })
  }
  return out
}

// ── manifest ───────────────────────────────────────────────────────────────
async function loadManifest(): Promise<Map<string, ManifestEntry>> {
  if (!existsSync(MANIFEST)) return new Map()
  try {
    const arr = JSON.parse(await readFile(MANIFEST, 'utf8')) as ManifestEntry[]
    return new Map(arr.map((e) => [`${e.batch}:${e.slug}`, e]))
  } catch {
    return new Map()
  }
}

async function saveManifest(map: Map<string, ManifestEntry>): Promise<void> {
  const arr = [...map.values()].sort((a, b) => a.batch - b.batch || a.slug.localeCompare(b.slug))
  await mkdir(path.dirname(MANIFEST), { recursive: true })
  await writeFile(MANIFEST, JSON.stringify(arr, null, 2) + '\n')
}

// ── data-file edits ────────────────────────────────────────────────────────
const DATA_FILES: Record<Target['file'], string> = {
  tbilisi: 'src/data/projects-new-tbilisi.ts',
  batumi: 'src/data/projects-new-batumi.ts',
  regions: 'src/data/projects-new-regions.ts',
  professionals: 'src/data/professionals.ts',
}

async function revertFailedBatch1(manifest: Map<string, ManifestEntry>): Promise<void> {
  const targets = new Map(batch1Targets().map((t) => [t.slug, t]))
  const byFile = new Map<string, string[]>()
  for (const e of manifest.values()) {
    if (e.batch !== 1 || e.status !== 'failed') continue
    const t = targets.get(e.slug)
    if (!t) continue
    const rel = DATA_FILES[t.file]
    byFile.set(rel, [...(byFile.get(rel) ?? []), e.slug])
  }
  for (const [rel, slugs] of byFile) {
    const abs = path.join(ROOT, rel)
    let src = await readFile(abs, 'utf8')
    for (const slug of slugs) {
      const from = `img: '/images/projects/${slug}.webp',`
      if (src.includes(from)) {
        src = src.replace(from, `img: '/images/np1.webp',`)
        console.log(`reverted ${slug} → /images/np1.webp (${rel})`)
      }
    }
    await writeFile(abs, src)
  }
}

async function applyBatch2(manifest: Map<string, ManifestEntry>): Promise<void> {
  const abs = path.join(ROOT, DATA_FILES.professionals)
  let src = await readFile(abs, 'utf8')
  for (const e of manifest.values()) {
    if (e.batch !== 2 || e.status !== 'ok') continue
    const marker = `slug: '${e.slug}',`
    const i = src.indexOf(marker)
    if (i === -1) {
      console.log(`skip ${e.slug}: slug not found in professionals.ts`)
      continue
    }
    const tail = src.slice(i, i + 800)
    const m = tail.match(/img: '\/images\/np\d+\.webp',/)
    if (!m || m.index === undefined) continue
    const at = i + m.index
    src = src.slice(0, at) + `img: '/images/projects/${e.slug}.webp',` + src.slice(at + m[0].length)
    console.log(`batch2 img updated: ${e.slug}`)
  }
  await writeFile(abs, src)
}

// ── main ───────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const flag = (name: string): string | null => {
    const hit = args.find((a) => a.startsWith(`--${name}=`))
    return hit ? hit.split('=')[1]! : null
  }
  const has = (name: string): boolean => args.includes(`--${name}`)

  const manifest = await loadManifest()

  if (has('revert')) {
    await revertFailedBatch1(manifest)
    return
  }
  if (has('apply-batch2')) {
    await applyBatch2(manifest)
    return
  }

  const batch = flag('batch') === '2' ? 2 : 1
  let targets = batch === 2 ? batch2Targets() : batch1Targets()
  const only = flag('slugs')
  if (only) {
    const set = new Set(only.split(','))
    targets = targets.filter((t) => set.has(t.slug))
  }
  const from = Number(flag('from') ?? 0)
  const limit = flag('limit') ? Number(flag('limit')) : targets.length
  targets = targets.slice(from, from + limit)
  const dry = has('dry')

  console.log(`batch ${batch}: ${targets.length} projects (from=${from} limit=${limit})`)
  await mkdir(OUT_DIR, { recursive: true })

  let okOfficial = 0
  let okKorter = 0
  let failed = 0
  for (const t of targets) {
    const outPath = path.join(OUT_DIR, `${t.slug}.webp`)
    if (existsSync(outPath)) {
      console.log(`skip ${t.slug} (file exists)`)
      manifest.set(`${batch}:${t.slug}`, { slug: t.slug, status: 'ok', source: manifest.get(`${batch}:${t.slug}`)?.source ?? 'official', sourceUrl: manifest.get(`${batch}:${t.slug}`)?.sourceUrl ?? null, batch: batch as 1 | 2 })
      okOfficial++
      continue
    }
    if (dry) {
      console.log(`dry ${t.slug} [${t.dev}] tokens=${distinctiveTokens(t).join(',')}`)
      continue
    }
    let sourceUrl = await tryOfficial(t)
    let source: 'official' | 'korter' | null = sourceUrl ? 'official' : null
    if (!sourceUrl) {
      sourceUrl = await tryKorter(t)
      source = sourceUrl ? 'korter' : null
    }
    const status = sourceUrl ? 'ok' : 'failed'
    manifest.set(`${batch}:${t.slug}`, { slug: t.slug, status, source, sourceUrl, batch: batch as 1 | 2 })
    await saveManifest(manifest)
    if (source === 'official') okOfficial++
    else if (source === 'korter') okKorter++
    else failed++
    console.log(`${status === 'ok' ? 'OK ' : 'FAIL'} ${t.slug} ${source ? `(${source}: ${sourceUrl})` : ''}`)
  }
  await saveManifest(manifest)
  console.log(`\nbatch ${batch} done: official=${okOfficial} korter=${okKorter} failed=${failed}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
