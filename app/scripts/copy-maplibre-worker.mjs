#!/usr/bin/env node
/**
 * Copy MapLibre ESM worker + shared chunk into public/ so Turbopack
 * doesn't have to invent import.meta.url (empty → "No actors found").
 */
import { copyFileSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'node_modules/maplibre-gl/dist')
const dest = join(root, 'public/maplibre')
const files = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']

mkdirSync(dest, { recursive: true })
for (const f of files) {
  const from = join(src, f)
  const to = join(dest, f)
  copyFileSync(from, to)
  if (statSync(to).size < 1000) throw new Error(`maplibre copy too small: ${f}`)
}
