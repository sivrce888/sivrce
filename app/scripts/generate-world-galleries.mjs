#!/usr/bin/env node
/**
 * generate-world-galleries.ts
 * Adds gallery entries for world projects missing from project-galleries.ts.
 * Only slugs with real files on disk get an entry — a generated ref to a
 * nonexistent image is a guaranteed 404 in the gallery (project-gallery-files
 * check fails the build for exactly that).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const GALLERIES = path.join(ROOT, 'src', 'data', 'project-galleries.ts')
const WORLD = path.join(ROOT, 'src', 'data', 'world-projects.ts')
const WORLD_MARK = '// ═══ WORLD PROJECTS — auto-generated ═══'

const worldSrc = readFileSync(WORLD, 'utf8')
const worldSlugs = [...worldSrc.matchAll(/slug: '([^']+)'/g)].map(m => m[1])

let galSrc = readFileSync(GALLERIES, 'utf8')
// Drop any previous auto block so this run is idempotent.
const mark = galSrc.indexOf(WORLD_MARK)
if (mark !== -1) galSrc = galSrc.slice(0, mark).replace(/\n+$/, '\n') + '\n'

const galSlugs = new Set([...galSrc.matchAll(/'([a-z0-9-]+)':\s*\[/g)].map(m => m[1]))
const missing = worldSlugs.filter(s => !galSlugs.has(s))
console.log(`Missing: ${missing.length} / ${worldSlugs.length} world projects`)

const photos = (s) => ['-g1', '-g2']
  .map((suffix) => `/images/projects/${s}${suffix}.webp`)
  .filter((src) => existsSync(path.join(ROOT, 'public', src.slice(1))))

const entries = missing
  .map(s => [s, photos(s)])
  .filter(([, files]) => files.length > 0)
  .map(([s, files]) => `  '${s}': [${files.map(f => `'${f}'`).join(', ')}],`)
const skipped = missing.length - entries.length
if (skipped > 0) console.log(`Skipped ${skipped} slugs with no local gallery files (remote Commons media still applies)`)
const header = `\n  ${WORLD_MARK}\n`

let out
if (mark !== -1) {
  // The strip above removed the auto block AND the object's closing brace.
  out = galSrc + header + entries.join('\n') + '\n}\n'
} else {
  const closing = galSrc.lastIndexOf('}')
  out = galSrc.slice(0, closing) + header + entries.join('\n') + '\n' + galSrc.slice(closing)
}
writeFileSync(GALLERIES, out)
console.log(`Added ${entries.length} gallery entries → ${GALLERIES}`)
