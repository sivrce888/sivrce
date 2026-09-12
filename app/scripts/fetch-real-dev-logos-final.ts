/**
 * Final pass: bueschl / shurooq / q-properties. One-shot, delete after.
 * Run: npx tsx scripts/fetch-real-dev-logos-final.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const OUT = path.join(__dirname, '..', 'public', 'images', 'developers')

async function get(url: string): Promise<Buffer | null> {
  try {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), 15000)
    const r = await fetch(url, {
      signal: ac.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36' },
    })
    clearTimeout(t)
    if (!r.ok) return null
    return Buffer.from(await r.arrayBuffer())
  } catch {
    return null
  }
}

function icons(html: string, base: string): string[] {
  const out: string[] = []
  const re = /<link[^>]+>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const tag = m[0]
    if (!/rel=["'][^"']*icon[^"']*["']/i.test(tag)) continue
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1]
    if (!href) continue
    const dim = parseInt(tag.match(/sizes=["']([^"']+)["']/i)?.[1] ?? '') || (/(apple-touch|android-chrome)/i.test(tag) ? 180 : 32)
    try {
      out.push(String(dim).padStart(4, '0') + '|' + new URL(href, base).href)
    } catch {
      /* skip */
    }
  }
  const og = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
  if (og && /logo|mark|brand/i.test(og[1])) {
    try {
      out.push('0200|' + new URL(og[1], base).href)
    } catch {
      /* skip */
    }
  }
  return out.sort((a, b) => b.localeCompare(a)).map((s) => s.split('|')[1])
}

async function save(slug: string, buf: Buffer, via: string) {
  await sharp(buf)
    .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .webp({ quality: 90 })
    .toFile(path.join(OUT, slug + '.webp'))
  console.log('OK', slug, (fs.statSync(path.join(OUT, slug + '.webp')).size / 1024).toFixed(1) + 'KB', 'via', via)
}

async function fromGstatic(slug: string, host: string): Promise<boolean> {
  const b = await get(`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${host}&size=256`)
  if (!b || b.length <= 800) return false
  try {
    const meta = await sharp(b).metadata()
    if (!meta.width || meta.width < 48) return false
    await save(slug, b, `gstatic:${host}`)
    return true
  } catch {
    return false
  }
}

async function fromSite(slug: string, base: string): Promise<boolean> {
  const html = (await get(base))?.toString('utf8') ?? ''
  if (!html) return false
  for (const c of icons(html, base)) {
    const b = await get(c)
    if (!b || b.length < 500) continue
    try {
      const meta = await sharp(b).metadata()
      if (!meta.width || meta.width < 32) continue
      await save(slug, b, c)
      return true
    } catch {
      /* not an image */
    }
  }
  return false
}

async function main() {
  if (!(await fromSite('bueschl', 'https://www.bueschl-gruppe.de'))) {
    if (!(await fromGstatic('bueschl', 'www.bueschl-gruppe.de'))) console.log('FAIL bueschl')
  }
  if (!(await fromSite('shurooq', 'https://investinsharjah.ae'))) {
    if (!(await fromGstatic('shurooq', 'shurooq.gov.ae'))) console.log('FAIL shurooq')
  }
  let q = false
  for (const host of ['www.qproperties.com', 'q-properties.ae', 'reemhills.ae', 'www.reemhills.ae']) {
    if (await fromGstatic('q-properties', host)) {
      q = true
      break
    }
  }
  if (!q) console.log('FAIL q-properties')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
