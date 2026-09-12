/**
 * One-shot: fetch REAL developer logos from each company's own website
 * (apple-touch-icon / favicon / logo assets only — never generated).
 * Run: npx tsx scripts/fetch-real-dev-logos.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const OUT = path.join(__dirname, '..', 'public', 'images', 'developers')

const TARGETS: { slug: string; url: string }[] = [
  { slug: 'al-hamra', url: 'https://alhamra.ae' },
  { slug: 'arada', url: 'https://arada.com' },
  { slug: 'aroundtown', url: 'https://www.aroundtown.de' },
  { slug: 'bauwens', url: 'https://bauwens.de' },
  { slug: 'bayerische-hausbau', url: 'https://www.bayerische-hausbau.de' },
  { slug: 'bloom-holding', url: 'https://www.bloomholding.com' },
  { slug: 'bueschl', url: 'https://www.bueschl.de' },
  { slug: 'ca-immo', url: 'https://www.caimmo.com' },
  { slug: 'danube-properties', url: 'https://www.danubeproperties.com' },
  { slug: 'deyaar', url: 'https://www.deyaar.ae' },
  { slug: 'dubai-properties', url: 'https://www.dubaiproperties.ae' },
  { slug: 'eagle-hills', url: 'https://www.eaglehills.com' },
  { slug: 'ece', url: 'https://www.ece.com' },
  { slug: 'gulfstream-group', url: 'https://gulfstream.ge' },
  { slug: 'ithra-dubai', url: 'https://www.ithradubai.com' },
  { slug: 'kleindienst-group', url: 'https://www.theheartofeurope.com' },
  { slug: 'modon-properties', url: 'https://www.modon.ae' },
  { slug: 'nshama', url: 'https://nshama.ae' },
  { slug: 'reportage-properties', url: 'https://reportageproperties.com' },
  { slug: 'samana-developers', url: 'https://samanadevelopers.com' },
  { slug: 'seven-tides', url: 'https://seventides.com' },
  { slug: 'shurooq', url: 'https://shurooq.ae' },
  { slug: 'tiger-properties', url: 'https://tigergroup.ae' },
  { slug: 'urbanique-group', url: 'https://urbanique.ge' },
  { slug: 'wasl-properties', url: 'https://waslproperties.ae' },
]

async function fetchBuf(url: string, timeoutMs = 15000): Promise<Buffer | null> {
  try {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), timeoutMs)
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    })
    clearTimeout(t)
    if (!res.ok) return null
    const ab = await res.arrayBuffer()
    return Buffer.from(ab)
  } catch {
    return null
  }
}

function iconCandidates(html: string, base: string): string[] {
  const out: string[] = []
  const linkRe = /<link[^>]+>/gi
  let m: RegExpExecArray | null
  while ((m = linkRe.exec(html))) {
    const tag = m[0]
    if (!/rel=["'][^"']*icon[^"']*["']/i.test(tag)) continue
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1]
    if (!href) continue
    const sizes = tag.match(/sizes=["']([^"']+)["']/i)?.[1] ?? ''
    const dim = parseInt(sizes) || (/(apple-touch|android-chrome)/i.test(tag) ? 180 : 32)
    let abs: string
    try {
      abs = new URL(href, base).href
    } catch {
      continue
    }
    out.push(`${String(dim).padStart(4, '0')}|${abs}`)
  }
  // og:image only when it names a logo/mark
  const og = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    ?? html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
  if (og && /logo|mark|brand/i.test(og[1])) {
    try {
      out.push(`0200|${new URL(og[1], base).href}`)
    } catch { /* skip */ }
  }
  return out.sort((a, b) => b.localeCompare(a)).map((s) => s.split('|')[1])
}

async function main() {
  const results: string[] = []
  for (const { slug, url } of TARGETS) {
    let picked: { buf: Buffer; via: string } | null = null
    const html = (await fetchBuf(url))?.toString('utf8') ?? ''
    if (html) {
      const cands = iconCandidates(html, url)
      for (const c of cands) {
        const buf = await fetchBuf(c)
        if (!buf || buf.length < 500) continue
        try {
          const meta = await sharp(buf).metadata()
          if (!meta.width || meta.width < 32) continue
          picked = { buf, via: c }
          break
        } catch { /* not an image */ }
      }
    }
    // Fallback: real favicon mirrored by Google for the same domain
    if (!picked) {
      const host = new URL(url).host
      const buf = await fetchBuf(`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${host}&size=128`)
      if (buf && buf.length > 200) picked = { buf, via: 'gstatic-favicon' }
    }
    if (!picked) {
      results.push(`FAIL ${slug}`)
      continue
    }
    const out = path.join(OUT, `${slug}.webp`)
    await sharp(picked.buf)
      .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .webp({ quality: 90 })
      .toFile(out)
    const kb = (fs.statSync(out).size / 1024).toFixed(1)
    results.push(`OK ${slug} (${kb}KB) via ${picked.via}`)
  }
  console.log(results.join('\n'))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
