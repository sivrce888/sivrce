/**
 * First-party catalog heroes for the 2026-08 batch.
 * Brand lock: sv-navy / sv-blue / sv-orange. Typographic cards, not fake renders.
 * Run: npx tsx scripts/gen-project-heroes-2026-08.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { NEW_PROJECTS_2026_08 } from '../src/data/projects-new-2026-08'

const DIR = path.join(__dirname, '..', 'public', 'images', 'projects')
fs.mkdirSync(DIR, { recursive: true })

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function svg(name: string, location: string, finish: string): Buffer {
  const loc = location.replace(/, თბილისი|, ბათუმი|, ჩაქვი|, ქობულეთი|, ქუთაისი/g, '')
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#050B26"/>
      <stop offset="55%" stop-color="#0A1440"/>
      <stop offset="100%" stop-color="#1A3FC0"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#g)"/>
  <rect x="0" y="0" width="8" height="900" fill="#2E6BFF"/>
  <circle cx="1480" cy="120" r="180" fill="#2E6BFF" fill-opacity="0.12"/>
  <circle cx="200" cy="780" r="220" fill="#FF6A2D" fill-opacity="0.08"/>
  <text x="80" y="120" font-family="system-ui, sans-serif" font-size="22" font-weight="700" letter-spacing="4" fill="#8FB4FF">SIVRCE · NEW BUILD</text>
  <text x="80" y="420" font-family="system-ui, sans-serif" font-size="72" font-weight="800" fill="#FFFFFF">${esc(name)}</text>
  <text x="80" y="500" font-family="system-ui, sans-serif" font-size="28" font-weight="600" fill="#8FB4FF">${esc(loc)}</text>
  <text x="80" y="800" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="#FF6A2D">ჩაბარება ${esc(finish)}</text>
</svg>`)
}

async function main() {
  for (const p of NEW_PROJECTS_2026_08) {
    const out = path.join(DIR, path.basename(p.img))
    await sharp(svg(p.name, p.location, p.finish)).webp({ quality: 86 }).toFile(out)
    console.log(' ', path.basename(out))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
