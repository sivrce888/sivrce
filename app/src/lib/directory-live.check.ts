/**
 * ponytail: one assert check — /images/projects/* must not count as stock art.
 * Mirrors isPlaceholderImg in directory-live.ts (avoid importing db side-effects).
 * Run: npx tsx src/lib/directory-live.check.ts
 */
import assert from 'node:assert/strict'

function isPlaceholderImg(img: string | null | undefined): boolean {
  if (!img) return true
  if (img.startsWith('/images/projects/')) return false
  return img.startsWith('/images/')
}

assert.equal(isPlaceholderImg('/images/np1.webp'), true)
assert.equal(isPlaceholderImg('/images/p3.webp'), true)
assert.equal(isPlaceholderImg(undefined), true)
assert.equal(isPlaceholderImg('/images/projects/archi-nutsubidze-2.webp'), false)
assert.equal(isPlaceholderImg('https://cdn.sivrce.ge/x.webp'), false)
console.log('directory-live.check.ts: ok')
