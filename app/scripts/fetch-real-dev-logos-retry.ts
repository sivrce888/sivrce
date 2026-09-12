/**
 * Retry pass for the stubborn domains + Georgian devs. One-shot, delete after.
 * Run: npx tsx scripts/fetch-real-dev-logos-retry.ts
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
    } catch { /* skip */ }
  }
  const og = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
  if (og && /logo|mark|brand/i.test(og[1])) {
    try { out.push('0200|' + new URL(og[1], base).href) } catch { /* skip */ }
  }
  return out.sort((a, b) => b.localeCompare(a)).map((s) => s.split('|')[1])
}

async function save(slug: string, buf: Buffer) {
  await sharp(buf)
    .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .webp({ quality: 90 })
    .toFile(path.join(OUT, slug + '.webp'))
  console.log('OK', slug, (fs.statSync(path.join(OUT, slug + '.webp')).size / 1024).toFixed(1) + 'KB')
}

const JOBS: Record<string, string[]> = {
  'bueschl': ['https://bueschl.de', 'gstatic:bueschl.de'],
  'reportage-properties': ['https://www.reportageproperties.com', 'gstatic:reportageproperties.com'],
  'shurooq': ['gstatic:shurooq.ae'],
  'tiger-properties': ['https://tigerproperties.ae', 'gstatic:tigerproperties.ae'],
  'wasl-properties': ['https://wasl.ae', 'gstatic:wasl.ae'],
  'q-properties': ['https://www.qproperties.ae', 'gstatic:qproperties.ae'],
  'grg-development': ['https://grg.ge', 'gstatic:grg.ge'],
  'moedani': ['https://moedani.ge', 'gstatic:moedani.ge'],
}

async function main() {
  for (const [slug, tries] of Object.entries(JOBS)) {
    let done = false
    for (const t of tries) {
      let buf: Buffer | null = null
      if (t.startsWith('gstatic:')) {
        buf = await get('https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://' + t.slice(8) + '&size=256')
      } else {
        const html = (await get(t))?.toString('utf8') ?? ''
        if (html) {
          for (const c of icons(html, t)) {
            const b = await get(c)
            if (!b || b.length < 500) continue
            try {
              const meta = await sharp(b).metadata()
              if (!meta.width || meta.width < 32) continue
              buf = b
              break
            } catch { /* not an image */ }
          }
        }
      }
      if (buf && buf.length > 200) {
        try {
          await sharp(buf).metadata()
          await save(slug, buf)
          done = true
          break
        } catch { /* not an image */ }
      }
    }
    if (!done) console.log('FAIL', slug)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
