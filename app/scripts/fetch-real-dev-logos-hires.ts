/**
 * High-res pass for the 50 developer logos that are ≤128px or white-on-transparent
 * (invisible on the light DeveloperLogo tile — isaria is a literal 1x1).
 * Ladder per site: header/inline logo SVG → logo-named raster → big icons → og:image
 * logo → gstatic 256 favicon. White marks are composed on the developers brand hue
 * (#7C3AED, category-brand.ts — same color as the initials fallback). Never downgrades.
 *
 * Run: npx tsx scripts/fetch-real-dev-logos-hires.ts
 * One-shot, delete after.
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { DEVELOPERS } from '../src/data/professionals'

const OUT = path.join(__dirname, '..', 'public', 'images', 'developers')
const BRAND_VIOLET = { r: 124, g: 58, b: 237 } // SERVICE_BRAND.developers.hue #7C3AED
const UA = 'Mozilla/5.0 (Macintosh, Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36'

async function get(url: string, accept = '*/*'): Promise<{ buf: Buffer; type: string } | null> {
  try {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), 15000)
    const r = await fetch(url, {
      signal: ac.signal,
      redirect: 'follow',
      headers: { 'User-Agent': UA, Accept: accept },
    })
    clearTimeout(t)
    if (!r.ok) return null
    return { buf: Buffer.from(await r.arrayBuffer()), type: r.headers.get('content-type') ?? '' }
  } catch {
    return null
  }
}

/** Absolute URLs of logo candidates found in HTML, best first. */
function logoCandidates(html: string, base: string): string[] {
  const out: string[] = []
  const add = (href: string | undefined) => {
    if (!href || href.startsWith('data:')) return
    try {
      const u = new URL(href, base).href
      if (!out.includes(u)) out.push(u)
    } catch { /* skip */ }
  }
  // 1. inline <svg> in a logo/brand/header context
  const inline = html.match(/<(?:svg|a|div|span|h1)[^>]*(?:logo|brand|header)[^>]*>[\s\S]{0,8000}?<\/(?:svg|a|div|span|h1)>/gi) ?? []
  for (const blk of inline) {
    const svg = blk.match(/<svg[\s\S]{0,8000}?<\/svg>/i)?.[0]
    if (svg) {
      const src = `data:image/svg+xml;utf8,${encodeURIComponent(svg.includes('xmlns') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'))}`
      if (!out.includes(src)) out.push(src)
    }
    add(blk.match(/(?:src|href|data-src)=["']([^"']+\.(?:svg|png|webp))["']/i)?.[1])
  }
  // 2. logo-named <img>
  for (const m of html.matchAll(/<img[^>]+>/gi)) {
    const tag = m[0]
    if (!/(logo|brand|mark)/i.test(tag)) continue
    add(tag.match(/(?:src|data-src)=["']([^"']+\.(?:svg|png|webp))["']/i)?.[1])
  }
  // 3. apple-touch / big icons
  for (const m of html.matchAll(/<link[^>]+>/gi)) {
    const tag = m[0]
    if (!/rel=["'][^"']*icon[^"']*["']/i.test(tag)) continue
    add(tag.match(/href=["']([^"']+)["']/i)?.[1])
  }
  // 4. og:image when it looks like a logo
  const og = html.match(/(?:property|name)=["']og:image["'][^>]*content=["']([^"']+)["']/i)
  if (og && /logo|brand|mark/i.test(og[1])) add(og[1])
  return out
}

async function toSharp(buf: Buffer): Promise<sharp.Sharp | null> {
  try {
    const s = sharp(buf, { density: 400 })
    const m = await s.metadata()
    if (!m.width || !m.height) return null
    return s
  } catch {
    return null
  }
}

async function markStats(img: sharp.Sharp): Promise<{ w: number; meanLum: number; alphaShare: number } | null> {
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let opaque = 0
  let lum = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    opaque++
    lum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  const px = info.width * info.height
  if (!opaque) return null
  return { w: info.width, meanLum: lum / opaque, alphaShare: 1 - opaque / px }
}

async function save(slug: string, img: sharp.Sharp, whiteMark: boolean): Promise<void> {
  const fit = img.clone().resize({ width: 440, height: 440, fit: 'inside', withoutEnlargement: true })
  const base = whiteMark
    ? sharp({ create: { width: 512, height: 512, channels: 3, background: BRAND_VIOLET } as any })
    : sharp({ create: { width: 512, height: 512, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0 } } as any })
  await base
    .composite([{ input: await fit.png().toBuffer(), gravity: 'center' }])
    .webp({ quality: 90 })
    .toFile(path.join(OUT, `${slug}.webp.tmp`))
  fs.renameSync(path.join(OUT, `${slug}.webp.tmp`), path.join(OUT, `${slug}.webp`))
}

const TARGETS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      'al-hamra', 'bi-group', 'brigade-enterprises', 'brigade-group', 'china-vanke', 'coima', 'cybarco',
      'dubai-holding', 'fb-gruppen', 'grupo-lar', 'gs-e-c', 'isaria', 'kan-development', 'mirvac',
      'nakheel', 'nef', 'oberoi-realty', 'porr', 'qatari-diar', 'riko-ljubljana', 'rotana-real-estate',
      'safaricom-ndoto', 'segro', 'vanke', 'via-celere', 'aedas', 'aldar-properties', 'artex-group',
      'bayerische-hausbau', 'binghatti', 'cifi', 'concord', 'deyaar', 'diamona-harnisch', 'dlf-limited',
      'dlf', 'dr-horton', 'etalon', 'imtiaz', 'jtre', 'kakheti-telavi-sun', 'lider-development',
      'mahindra-lifespace', 'menkes', 'mount-anvil', 'pandion-berlin', 'pandion', 'related-companies',
      'sodic', 'tata-housing',
    ]

async function main() {
  let ok = 0
  let fail = 0
  for (const slug of TARGETS) {
    const dev = DEVELOPERS.find((d) => d.slug === slug)
    const file = path.join(OUT, `${slug}.webp`)
    const cur = fs.existsSync(file) ? await toSharp(fs.readFileSync(file)) : null
    const curStats = cur ? await markStats(cur) : null
    const site = dev?.website
    const tried = new Set<string>()
    if (site) tried.add(site)
    const roots = [site, site?.replace(/^https?:\/\/(www\.)?/, 'https://'), site?.replace(/^https?:\/\//, 'https://www.')].filter(Boolean) as string[]
    const root0 = roots[0]
    if (root0) for (const p of ['/logo.svg', '/assets/logo.svg', '/images/logo.svg', '/wp-content/uploads/logo.svg', '/build/img/logo.svg']) tried.add(new URL(p, root0).href)
    let done = false
    for (const root of roots) {
      if (done) break
      const html = (await get(root))?.buf.toString('utf8')
      if (!html) continue
      let cands = logoCandidates(html, root)
      if (!cands.length) cands = [...tried]
      for (const c of cands.slice(0, 8)) {
        const buf = c.startsWith('data:') ? Buffer.from(decodeURIComponent(c.split(',')[1]), 'utf8') : (await get(c))?.buf
        if (!buf || buf.length < 300) continue
        const img = await toSharp(buf)
        if (!img) continue
        const st = await markStats(img)
        if (!st) continue
        const isSvg = buf.subarray(0, 600).includes(Buffer.from('<svg')) || buf.subarray(0, 5).includes(Buffer.from('<?xml'))
        const whiteMark = st.meanLum > 225 && st.alphaShare > 0.1
        const better = isSvg || st.w >= 160 || st.w > (curStats?.w ?? 0) || whiteMark || (curStats !== null && curStats.meanLum > 225 && curStats.alphaShare > 0.1)
        if (!better) continue
        try {
          await save(slug, img, whiteMark)
          console.log(`OK ${slug} ${st.w}px${isSvg ? ' svg' : ''}${whiteMark ? ' white→violet' : ''}`)
          done = true
          break
        } catch { /* unsupported svg etc */ }
      }
    }
    if (!done && site) {
      const fav = await get(`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${site ?? 'https://undefined.invalid'}&size=256`)
      const img = fav && fav.buf.length > 200 ? await toSharp(fav.buf) : null
      const st = img ? await markStats(img) : null
      if (img && st && st.w > (curStats?.w ?? 0)) {
        await save(slug, img, st.meanLum > 225 && st.alphaShare > 0.1)
        console.log(`OK ${slug} favicon ${st.w}px`)
        done = true
      }
    }
    if (!done) { console.log(`FAIL ${slug} (keep current)`); fail++ } else ok++
  }
  console.log(`\n${ok} upgraded, ${fail} kept current`)
}

main().catch((e) => { console.error(e); process.exit(1) })
