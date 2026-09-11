// Build-time OG derivatives: public/images/**/*.webp → public/images/og/**.jpg
// (1200×630 cover, JPEG). WhatsApp/Viber/FB crawlers don't render WebP OG tags.
// Mirrors the source subtree (ogImage() maps /images/X.webp → /images/og/X.jpg),
// so project heroes under images/projects/ get og/projects/ twins.
// Skips up-to-date files, so rebuilds cost ~0s. Runs via `prebuild`.
import { readdirSync, statSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const pub = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images')
const ogDir = path.join(pub, 'og')
mkdirSync(ogDir, { recursive: true })

// ponytail: recursive walk; swap for glob only if the tree deepens further.
function walk(dir, rel = '') {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'og') continue
    const r = rel ? `${rel}/${e.name}` : e.name
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), r))
    else if (e.name.endsWith('.webp')) out.push(r)
  }
  return out
}

const sources = walk(pub)
// Render-card twins (massing/timeline/lage) are never og:image targets —
// only heroes pass through ogImage(). Skipping saves ~43MB of repo.
const CARD_RE = /-(massing|timeline|lage)\.webp$/
const ogSources = sources.filter((f) => !CARD_RE.test(f))
let made = 0

for (const rel of ogSources) {
  const src = path.join(pub, rel)
  const out = path.join(ogDir, rel.replace(/\.webp$/, '.jpg'))
  mkdirSync(path.dirname(out), { recursive: true })
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
