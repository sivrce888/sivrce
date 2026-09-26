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
 *   --galleries    re-scrape ok entries' provenance page + re-match failed
 *                  entries for the FULL image set: hero + up to GALLERY_CAP
 *                  real photos/renders per project (<slug>-g<N>.webp)
 *   --emit         regenerate src/data/project-galleries.ts from the manifest
 *   --revert       revert FAILED batch-1 img fields back to /images/np1.webp
 *   --apply-batch2 write successful batch-2 img updates into professionals.ts
 *
 * Flags: --batch=1|2 --from=N --limit=M --slugs=a,b,c --max-files=N --dry
 * Manifest: ../research/renders-manifest-2026-07.json (upserted per project).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { PROJECTS } from '../src/data/professionals'
import { CURATED_GALLERIES } from '../src/data/project-galleries-curated'
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
  source: 'official' | 'korter' | 'wikipedia' | null
  sourceUrl: string | null
  batch: 1 | 2
  /** Real mirrored gallery paths, hero excluded — emitted into project-galleries.ts. */
  gallery?: string[]
}

// ponytail: 2/project — repo file cap is 4500 and we sit at ~3500; raise only with a
// lock bump in .cursor/rules/repo-lightweight-lock.mdc (or an R2/CDN mirror).
const GALLERY_CAP = 2
let newFiles = 0
let maxNewFiles = 900
// byte guard: tracked tree is ~55 of 96 MiB — keep new gallery pixels ≤ ~26 MiB
let newBytes = 0
let maxNewBytes = 26 * 1024 * 1024

type Target = {
  slug: string
  name: string
  dev?: string
  city: string
  file: 'tbilisi' | 'batumi' | 'regions' | 'professionals'
  /** Verified provenance page (project-sources.gen.json) — tried before slug guessing. */
  sourceUrl?: string | null
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
  // UAE / Gulf — sitemap.xml fallback does the heavy lifting (listing paths vary)
  'aldar-properties': { base: 'https://www.aldar.com', listings: ['/en/projects'] },
  'emaar-properties': { base: 'https://www.emaar.com', listings: ['/en-ae', '/projects'] },
  'danube-properties': { base: 'https://www.danubeproperties.com', listings: ['/projects'] },
  'damac-properties': { base: 'https://www.damacproperties.com', listings: ['/en/projects', '/projects'] },
  deyaar: { base: 'https://deyaar.ae', listings: ['/projects', '/en'] },
  omniyat: { base: 'https://omniyat.com', listings: ['/projects', '/'] },
  'sobha-realty': { base: 'https://www.sobharealty.com', listings: ['/projects', '/en'] },
  'tiger-properties': { base: 'https://tigerproperties.ae', listings: ['/projects', '/en'] },
  'select-group': { base: 'https://selectgroup.ae', listings: ['/projects', '/en'] },
  'ellington-properties': { base: 'https://ellingtonproperties.ae', listings: ['/projects', '/en'] },
  arada: { base: 'https://arada.com', listings: ['/projects', '/en'] },
  nshama: { base: 'https://nshama.ae', listings: ['/projects', '/en'] },
  'wasl-properties': { base: 'https://waslproperties.ae', listings: ['/projects', '/en'] },
  'red-sea-global': { base: 'https://www.redseaglobal.com', listings: ['/en', '/projects'] },
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

export async function fetchText(url: string): Promise<string | null> {
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
  const devTokens = new Set(tokens(t.dev ?? ''))
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

/** All real content images on the page: og/JSON-LD hero first, then <img> srcs. */
export function extractImages(html: string, pageUrl: string): string[] {
  const out: string[] = []
  const push = (href: string | undefined | null): void => {
    if (!href) return
    const u = resolveUrl(href.trim(), pageUrl)
    if (!u || !/^https?:/.test(u)) return
    if (/\.(svg|gif)([?#]|$)/i.test(u)) return
    // chrome, not content: logos/icons/social badges/sister-site banners
    if (/logo|icon|favicon|sprite|avatar|placeholder|badge|emoji|\/flags?\//i.test(u)) return
    const key = u.split('?')[0]!
    if (out.some((x) => x.split('?')[0] === key)) return
    out.push(u)
  }
  push(extractImage(html, pageUrl))
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0]!
    const srcset = tag.match(/\bsrcset=["']([^"']+)["']/i)?.[1]
    if (srcset) {
      const best = srcset
        .split(',')
        .map((s) => s.trim().split(/\s+/))
        .sort((a, b) => (parseInt(b[b.length - 1]!, 10) || 0) - (parseInt(a[a.length - 1]!, 10) || 0))[0]
      push(best?.[0])
    }
    push(tag.match(/\b(?:data-src|data-original|data-lazy-src)=["']([^"']+)["']/i)?.[1])
    push(tag.match(/\bsrc=["']([^"']+)["']/i)?.[1])
  }
  return out.slice(0, 10)
}

async function saveWebp(buf: Buffer, slug: string): Promise<number> {
  try {
    await mkdir(OUT_DIR, { recursive: true })
    const out = await sharp(buf)
      .rotate()
      .resize({ width: 960, withoutEnlargement: true })
      .webp({ quality: 64, effort: 6 })
      .toFile(path.join(OUT_DIR, `${slug}.webp`))
    return out.size
  } catch {
    return 0
  }
}

// ── strategies ─────────────────────────────────────────────────────────────
type PageHit = { page: string; images: string[] }

/** 16×16 grayscale compare — catches the og:image re-served as the first <img>. */
async function looksLikeHero(buf: Buffer, slug: string): Promise<boolean> {
  const heroPath = path.join(OUT_DIR, `${slug}.webp`)
  if (!existsSync(heroPath)) return false
  try {
    const thumb = (b: Buffer): Promise<Buffer> =>
      sharp(b).resize(16, 16, { fit: 'fill' }).grayscale().raw().toBuffer()
    const [a, b] = await Promise.all([thumb(buf), thumb(await readFile(heroPath))])
    let d = 0
    for (let i = 0; i < a.length; i++) d += Math.abs(a[i]! - b[i]!)
    return d / a.length < 8
  } catch {
    return false
  }
}

/** Download+convert candidates: candidate 0 is the hero, next `cap` fill the gallery. */
export async function capture(
  t: Target,
  images: string[],
  opts: { hero: boolean; gallery: boolean; cap?: number; skipExtras?: number; heroForce?: boolean },
): Promise<{ hero: boolean; gallery: string[] } | null> {
  const cap = opts.cap ?? 0
  let skip = opts.skipExtras ?? 0
  const seen = new Set<string>()
  const cands = images.filter((u) => {
    const key = u.split('?')[0]!
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const hadHero = existsSync(path.join(OUT_DIR, `${t.slug}.webp`))
  let hero = false
  const gallery: string[] = []
  for (let i = 0; i < cands.length; i++) {
    // heroForce: overwrite the generated placeholder card (failed entry with a
    // file on disk never came from a mirror) with the real image
    const wantHero = opts.hero && i === 0 && (!hadHero || !!opts.heroForce)
    const wantExtra = opts.gallery && gallery.length < cap
    if (!wantHero && !wantExtra) break
    if (!wantHero && (newFiles >= maxNewFiles || newBytes >= maxNewBytes)) break
    if (!wantHero && skip > 0) {
      skip--
      continue
    }
    const buf = await fetchBuffer(cands[i]!)
    if (!buf || buf.length < 5_000) continue
    const meta = await sharp(buf).metadata().catch(() => null)
    if (!meta?.width || meta.width < 400) continue
    const ar = meta.height ? meta.width / meta.height : 1
    if (ar < 0.45 || ar > 3.2) continue
    if (wantHero) {
      const sz = await saveWebp(buf, t.slug)
      if (!sz) continue
      hero = true
      newFiles++
      newBytes += sz
    } else if (await looksLikeHero(buf, t.slug)) {
      continue
    } else {
      const rel = `/images/projects/${t.slug}-g${gallery.length + 1}.webp`
      try {
        const out = await sharp(buf)
          .rotate()
          .resize({ width: 832, withoutEnlargement: true })
          .webp({ quality: 58, effort: 6 })
          .toBuffer()
        await writeFile(path.join(ROOT, 'public', rel), out)
        gallery.push(rel)
        newFiles++
        newBytes += out.length
      } catch {
        continue
      }
    }
  }
  return hero || gallery.length > 0 ? { hero, gallery } : null
}

async function matchOfficial(t: Target): Promise<PageHit | null> {
  const cfg = DEV_SITES[t.dev ?? '']
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
  const images = extractImages(html, page)
  if (images.length === 0) return null
  return { page, images }
}

export async function matchKorter(t: Target): Promise<PageHit | null> {
  const cities = new Set<string>()
  const mapped = KORTER_CITY[t.city]
  if (mapped) cities.add(mapped)
  if (t.file === 'tbilisi') cities.add('tbilisi')
  if (t.file === 'batumi') cities.add('batumi')
  cities.add('tbilisi')
  cities.add('batumi')
  const need = distinctiveTokens(t).filter((x) => /[a-z]/.test(x) && x.length >= 4)

  const checkPage = async (url: string, trusted = false): Promise<PageHit | null> => {
    const html = await fetchText(url)
    if (!html) return null
    const title = titleOf(html)
    // verify the page actually is about this project — skipped for verified
    // provenance URLs (DB name+city+developer match), where korter titles use
    // brand names our slugs never contain ("Monogram" vs symbol-residences)
    if (!trusted && need.length > 0 && !need.some((tok) => title.includes(tok))) return null
    const images = extractImages(html, url)
    if (images.length === 0) return null
    return { page: url, images }
  }

  // Verified provenance URL (korter import) — no slug guessing needed.
  if (t.sourceUrl) {
    const got = await checkPage(t.sourceUrl, true)
    if (got) return got
  }

  // direct slug variants: full slug, phase number stripped, dev prefix
  // stripped, dev-first-token + rest (korter slug ≈ ours but not exact)
  const slugVariants = new Set<string>([t.slug])
  const noPhase = t.slug.replace(/-\d+$/, '')
  if (noPhase !== t.slug) slugVariants.add(noPhase)
  const devToks = tokens(t.dev ?? '')
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
  const devVariants = new Set<string>([t.dev ?? ''])
  if (devToks[0]) devVariants.add(devToks[0])
  const devBase = t.dev ?? ''
  if (devBase) devVariants.add(devBase.replace(/-(development|group|holding|ge)$/, ''))
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
/** Cities whose projects should search de.wikipedia before en. */
const GERMAN_CITIES = new Set([
  'berlin', 'munich', 'frankfurt', 'hamburg', 'cologne', 'stuttgart', 'düsseldorf',
  'duesseldorf', 'leipzig', 'dresden', 'nuremberg', 'hannover', 'dortmund', 'essen',
  'bremen', 'bonn', 'potsdam', 'augsburg', 'wiesbaden', 'mannheim', 'karlsruhe',
  'münster', 'bielefeld', 'ბერლინი', 'მიუნხენი', 'ფრანკფურტი', 'ჰამბურგი', 'კელნი',
  'შტუტგარტი', 'დიუსელდორფი', 'ლაიფციგი', 'დრეზდენი', 'ნიურნბერგი', 'ჰანოვერი',
])

/**
 * Public-source fallback for world/landmark rows with no developer page:
 * wiki search → tight title match → article image (CC-scraped, public).
 * German-city rows try de.wikipedia first. Only ≥70% of the name's
 * distinctive tokens may hit — wrong-subject images are worse than no image.
 */
async function matchWikipedia(t: Target): Promise<PageHit | null> {
  const name = t.name.replace(/\s+/g, ' ').trim()
  if (!name || !/[a-z]/i.test(name)) return null
  const langs = GERMAN_CITIES.has(t.city.toLowerCase()) ? ['de', 'en'] : ['en']
  for (const lang of langs) {
    const api =
      `https://${lang}.wikipedia.org/w/api.php?action=query&list=search` +
      `&srsearch=${encodeURIComponent(name)}&srlimit=3&format=json`
    const txt = await fetchText(api)
    if (!txt) continue
    try {
      const hits = (JSON.parse(txt) as { query?: { search?: Array<{ title?: string }> } }).query?.search ?? []
      // slug ∪ name tokens — catches dev-district names ('Astoria' alone → Astoria, Queens)
      const want = [...new Set([...tokens(name), ...tokens(t.slug)])].filter((w) => !STOP.has(w))
      if (want.length === 0) return null
      // short names must match fully ('Central Park' ≠ any other Central Park);
      // longer names tolerate a miss
      const needAll = want.length <= 3
      for (const h of hits) {
        const title = String(h.title ?? '')
        if (!title) continue
        const have = tokens(title)
        const hitsTok = want.filter((w) => have.includes(w) || have.some((hv) => tokenHit(w, new Set([hv]))))
        if (hitsTok.length < (needAll ? want.length : Math.ceil(want.length * 0.7))) continue
        const sumTxt = await fetchText(
          `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`,
        )
        if (!sumTxt) continue
        const sum = JSON.parse(sumTxt) as {
          originalimage?: { source?: string }
          thumbnail?: { source?: string }
          content_urls?: { desktop?: { page?: string } }
          type?: string
        }
        const img = sum.originalimage?.source ?? sum.thumbnail?.source
        if (!img) continue
        // disambiguation/stub summaries carry no real photo — rely on img check above
        const page =
          sum.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`
        return { page, images: [img] }
      }
    } catch {
      continue
    }
  }
  return null
}


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
        out.push({ slug: p.slug, name: p.name, dev: p.developerSlug, city: p.city, file, sourceUrl: p.sourceUrl ?? null })
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
export async function loadManifest(): Promise<Map<string, ManifestEntry>> {
  if (!existsSync(MANIFEST)) return new Map()
  try {
    const arr = JSON.parse(await readFile(MANIFEST, 'utf8')) as ManifestEntry[]
    return new Map(arr.map((e) => [`${e.batch}:${e.slug}`, e]))
  } catch {
    return new Map()
  }
}

export async function saveManifest(map: Map<string, ManifestEntry>): Promise<void> {
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

// ── galleries mode ─────────────────────────────────────────────────────────
async function emitGalleries(manifest: Map<string, ManifestEntry>): Promise<void> {
  const rows: string[] = []
  const seen = new Set<string>()
  // hand-curated slugs live in project-galleries-curated.ts — never emit them here
  const curated = new Set(Object.keys(CURATED_GALLERIES))
  for (const e of [...manifest.values()].sort((a, b) => a.slug.localeCompare(b.slug))) {
    // a slug may sit in both batches — first-wins, matching PROJECTS dedupe
    if (!e.gallery?.length || seen.has(e.slug) || curated.has(e.slug)) continue
    seen.add(e.slug)
    rows.push(`  '${e.slug}': [${e.gallery.map((g) => `'${g}'`).join(', ')}],`)
  }
  const src =
    `// Generated by scripts/mirror-project-renders.ts --galleries — real photos/renders\n` +
    `// mirrored from official sources; provenance per slug in research/renders-manifest-2026-07.json.\n` +
    `export const PROJECT_GALLERIES: Record<string, string[]> = {\n${rows.join('\n')}\n}\n`
  await writeFile(path.join(ROOT, 'src', 'data', 'project-galleries.ts'), src)
  console.log(`emitted src/data/project-galleries.ts (${rows.length} projects)`)
}

async function galleriesMode(
  manifest: Map<string, ManifestEntry>,
  only: Set<string> | null,
  dry: boolean,
): Promise<void> {
  // Pass A — ok entries: re-scrape their provenance page for the full gallery.
  // Sweep 1 gives every covered project one real photo; sweep 2 runs after
  // pass B so hero-less projects win budget before anyone's second image.
  let a = 0
  const runSweep = async (cap: number): Promise<void> => {
    for (const e of [...manifest.values()].sort((x, y) => x.slug.localeCompare(y.slug))) {
      if (only && !only.has(e.slug)) continue
      if (e.status !== 'ok' || !e.sourceUrl) continue
      const have = e.gallery?.length ?? 0
      if (have >= cap) continue
      if (newFiles >= maxNewFiles || newBytes >= maxNewBytes) {
        console.log(`budget reached (${newFiles}/${maxNewFiles}, ${(newBytes / 1048576).toFixed(1)}MiB) — pass A sweep ${cap} stopping`)
        break
      }
      if (dry) {
        console.log(`dry ${e.slug} (A${cap}: ${e.sourceUrl})`)
        continue
      }
      const html = await fetchText(e.sourceUrl)
      if (!html) continue
      const t: Target = { slug: e.slug, name: e.slug, city: '', file: 'professionals' }
      const heroMissing = !existsSync(path.join(OUT_DIR, `${e.slug}.webp`))
      const got = await capture(t, extractImages(html, e.sourceUrl), {
        hero: heroMissing,
        gallery: true,
        cap,
        skipExtras: have,
      })
      if (!got) continue
      e.gallery = [...(e.gallery ?? []), ...got.gallery].filter((x, i, all) => all.indexOf(x) === i)
      if (e.gallery.length > have) {
        a++
        console.log(`A${cap} ${e.slug} +${e.gallery.length - have}`)
        await saveManifest(manifest)
      }
    }
  }
  await runSweep(1)

  // Pass B — failed + never-attempted entries: full re-match, hero + gallery.
  const bySlug = new Map(PROJECTS.map((p) => [p.slug, p]))
  const inManifest = new Set([...manifest.values()].map((e) => e.slug))
  const pending: ManifestEntry[] = [...manifest.values()].filter((e) => e.status === 'failed')
  for (const p of PROJECTS) {
    if (inManifest.has(p.slug)) continue
    // post-July catalogs never went through the mirror — register and try them
    const e: ManifestEntry = { slug: p.slug, status: 'failed', source: null, sourceUrl: null, batch: 1 }
    manifest.set(`1:${p.slug}`, e)
    pending.push(e)
  }
  let b = 0
  for (const e of pending.sort((x, y) => x.slug.localeCompare(y.slug))) {
    if (only && !only.has(e.slug)) continue
    if (e.status !== 'failed') continue
    const p = bySlug.get(e.slug)
    if (!p) continue
    if (newFiles >= maxNewFiles) {
      console.log(`budget reached (${newFiles}/${maxNewFiles}) — pass B stopping`)
      break
    }
    if (dry) {
      console.log(`dry ${e.slug} (B: [${p.developerSlug ?? '-'}] ${p.name})`)
      continue
    }
    const t: Target = {
      slug: p.slug,
      name: p.name,
      dev: p.developerSlug,
      city: p.city,
      file: 'professionals',
      sourceUrl: p.sourceUrl ?? null,
    }
    const hit = (await matchOfficial(t)) ?? (await matchKorter(t)) ?? (await matchWikipedia(t))
    if (!hit) continue
    const got = await capture(t, hit.images, {
      hero: true,
      heroForce: true,
      gallery: true,
      cap: GALLERY_CAP,
    })
    if (!got) continue
    e.status = 'ok'
    e.source = hit.page.includes('korter.ge')
      ? 'korter'
      : hit.page.includes('wikipedia.org')
        ? 'wikipedia'
        : 'official'
    e.sourceUrl = hit.page
    e.gallery = got.gallery
    b++
    console.log(`B ${e.slug} ${e.source} +${got.gallery.length}${got.hero ? ' +hero' : ''}`)
    await saveManifest(manifest)
  }
  await saveManifest(manifest)

  // Sweep 2 — second images for already-covered projects, budget permitting.
  await runSweep(GALLERY_CAP)
  console.log(
    `\ngalleries done: passA=${a} passB=${b} newFiles=${newFiles}/${maxNewFiles} newBytes=${(newBytes / 1048576).toFixed(1)}/${(maxNewBytes / 1048576).toFixed(0)}MiB`,
  )
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
  if (has('emit')) {
    await emitGalleries(manifest)
    return
  }
  if (has('galleries')) {
    maxNewFiles = Number(flag('max-files') ?? 900)
    maxNewBytes = Number(flag('max-mb') ?? 26) * 1024 * 1024
    const only = flag('slugs') ? new Set(flag('slugs')!.split(',')) : null
    await galleriesMode(manifest, only, has('dry'))
    await emitGalleries(manifest)
    return
  }

  const batch = flag('batch') === '2' ? 2 : 1
  let targets = batch === 2 ? batch2Targets() : batch1Targets()
  const only = flag('slugs')
  const force = has('force')
  if (only) {
    const set = new Set(only.split(','))
    // ponytail: --slugs searches all catalogs, not just the selected batch
    const all: Target[] = [
      ...batch1Targets(),
      ...PROJECTS.map((p) => ({
        slug: p.slug,
        name: p.name,
        dev: p.developerSlug,
        city: p.city,
        file: 'professionals' as const,
      })),
    ]
    const seen = new Set<string>()
    targets = all.filter((t) => set.has(t.slug) && !seen.has(t.slug) && (seen.add(t.slug), true))
  }
  const from = Number(flag('from') ?? 0)
  const limit = flag('limit') ? Number(flag('limit')) : targets.length
  targets = targets.slice(from, from + limit)
  const dry = has('dry')

  console.log(`batch ${batch}: ${targets.length} projects (from=${from} limit=${limit}${force ? ' force' : ''})`)
  await mkdir(OUT_DIR, { recursive: true })

  let okOfficial = 0
  let okKorter = 0
  let failed = 0
  for (const t of targets) {
    const outPath = path.join(OUT_DIR, `${t.slug}.webp`)
    if (existsSync(outPath) && !force) {
      console.log(`skip ${t.slug} (file exists)`)
      continue
    }
    if (dry) {
      console.log(`dry ${t.slug} [${t.dev}] tokens=${distinctiveTokens(t).join(',')}`)
      continue
    }
    const hit = (await matchOfficial(t)) ?? (await matchKorter(t))
    const source: 'official' | 'korter' | null = hit
      ? hit.page.includes('korter.ge')
        ? 'korter'
        : 'official'
      : null
    if (hit) await capture(t, hit.images, { hero: true, gallery: false })
    const sourceUrl = hit?.page ?? null
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

const invoked = process.argv[1] ?? ''
if (invoked.includes('mirror-project-renders')) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
