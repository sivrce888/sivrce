// Build-time OG derivatives: public/images/*.webp → public/images/og/<name>.jpg
// (1200×630 cover, JPEG). WhatsApp/Viber/FB crawlers don't render WebP OG tags.
// Skips up-to-date files, so rebuilds cost ~0s. Runs via `prebuild`.
import { readdirSync, statSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const pub = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images')
const outDir = path.join(pub, 'og')
mkdirSync(outDir, { recursive: true })

const sources = readdirSync(pub).filter((f) => f.endsWith('.webp'))
let made = 0

for (const file of sources) {
  const src = path.join(pub, file)
  const out = path.join(outDir, file.replace(/\.webp$/, '.jpg'))
  try {
    if (statSync(out).mtimeMs >= statSync(src).mtimeMs) continue
  } catch { /* missing output — generate */ }
  await sharp(src)
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(out)
  made++
}

console.log(`og-derivatives: ${made} generated, ${sources.length - made} fresh`)
