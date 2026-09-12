import sharp from 'sharp'
import fs from 'fs'
async function get(url: string): Promise<Buffer | null> {
  try {
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 15000)
    const r = await fetch(url, { signal: ac.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36' } })
    clearTimeout(t); if (!r.ok) return null; return Buffer.from(await r.arrayBuffer())
  } catch { return null }
}
async function save(slug: string, buf: Buffer, via: string) {
  await sharp(buf).resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).webp({ quality: 90 }).toFile('public/images/developers/' + slug + '.webp')
  console.log('OK', slug, via, (fs.statSync('public/images/developers/' + slug + '.webp').size / 1024).toFixed(1) + 'KB')
}
// kolkhi
const html = (await get('https://kolkhigroup.ge/'))?.toString('utf8') ?? ''
let kolkhi = false
if (html) {
  const re = /<link[^>]+>/gi; let m; const cands: string[] = []
  while ((m = re.exec(html))) {
    const tag = m[0]
    if (!/rel=["'][^"']*icon[^"']*["']/i.test(tag)) continue
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1]
    if (!href) continue
    const dim = parseInt(tag.match(/sizes=["']([^"']+)["']/i)?.[1] ?? '') || (/(apple-touch|android-chrome)/i.test(tag) ? 180 : 32)
    try { cands.push(String(dim).padStart(4, '0') + '|' + new URL(href, 'https://kolkhigroup.ge/').href) } catch { }
  }
  for (const c of cands.sort((a, b) => b.localeCompare(a))) {
    const b = await get(c.split('|')[1]); if (!b || b.length < 500) continue
    try { const meta = await sharp(b).metadata(); if (!meta.width || meta.width < 32) continue; await save('kolkhi-group', b, c); kolkhi = true; break } catch { }
  }
}
if (!kolkhi) console.log('FAIL kolkhi-group')
// reportage via gstatic (http origin worked)
const rb = await get('https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://reportageproperties.com&size=256')
if (rb && rb.length > 500) { try { await sharp(rb).metadata(); await save('reportage-properties', rb, 'gstatic') } catch { console.log('FAIL reportage') } } else console.log('FAIL reportage')
