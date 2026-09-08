/**
 * Hero quick-chip links must never 404: a seo landing exists only while
 * inventory does, so each district href must resolve OR demote to a
 * resolvable city-level href (same rule Hero applies at render time).
 */
import { QUICK } from './hero-quick'
import { parseSeoSlug } from './seo-pages'

const resolves = (path: string) => !!parseSeoSlug(path.split('/').filter(Boolean))

let fails = 0
for (const chip of QUICK) {
  for (const k of ['sale', 'rent', 'daily'] as const) {
    const href = chip[k]
    const segs = href.split('/').filter(Boolean)
    // /search?… is an inventory-independent utility route — query params can't 404.
    if (href.startsWith('/search?') || resolves(href)) continue
    const parent = '/' + segs.slice(0, -1).join('/')
    if (resolves(parent)) continue
    console.error(`hero-quick: ${chip.labelKey}.${k} is dead and has no resolvable parent → ${href}`)
    fails++
  }
}
if (fails) {
  console.error(`hero-quick.check: ${fails} dead link(s)`)
  process.exit(1)
}
console.log('hero-quick.check: OK')
