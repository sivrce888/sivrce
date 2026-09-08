#!/usr/bin/env node
/**
 * Dark-mode contrast audit — scores every color pair on dark surfaces.
 * Reads live values from app/src/app/globals.css (single source of truth):
 *   :root sv vars (light), .dark flips, chip color-mix tints, dark AA floor.
 * Exit 1 if any required pair fails its WCAG threshold.
 * Run: node scripts/check-dark-contrast.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const css = readFileSync(join(root, 'app/src/app/globals.css'), 'utf8')

// ————— parse globals.css —————
function block(name) {
  const m = css.match(new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm'))
  return m ? m[1] : ''
}
const rootBlock = block(':root')
// every `^  .dark { … }` standalone block (not html.dark, not .dark .selector)
const darkBlocks = [...css.matchAll(/(^|\n)\.dark\s*\{([\s\S]*?)\n\}/g)].map((m) => m[2]).join('\n')
const pickVar = (src, key) => src.match(new RegExp(`--${key}:\\s*([^;]+);`))?.[1]?.trim()

const svLight = {}, svDark = {}
for (const key of ['sv-ink', 'sv-cloud', 'sv-surface', 'sv-blue', 'sv-blue-light', 'sv-blue-deep', 'sv-orange', 'sv-navy', 'sv-navy-soft', 'sv-success']) {
  svLight[key] = pickVar(rootBlock, `color-${key}`) ?? pickVar(rootBlock, key)
  svDark[key] = pickVar(darkBlocks, `color-${key}`) ?? pickVar(darkBlocks, key) ?? svLight[key]
}
// chips: `.dark { --chip-x: color-mix(in oklab, #hue NN%, transparent) }`
const chips = {}
for (const [, name, hue, pct] of darkBlocks.matchAll(/--chip-([a-z-]+):\s*color-mix\(in oklab,\s*(#[0-9a-f]{6})\s+(\d+)%/g)) {
  chips[name] = { hue, pct: Number(pct) }
}
// dark AA floor overrides: `.dark .text-sv-ink\/35 { ... var(--color-sv-ink) 50%, transparent) }`
// (standalone rules, multi-selector groups: every selector shares one percent)
const floor = {}
for (const m of css.matchAll(/((?:\.dark \.(?:dark\\:)?text-[a-z-]+\\\/\d+,?\s*)+)\{[^}]*?color-mix\([^,]+,\s*(?:var\(--(?:color-)?[a-z-]+\)|#[0-9a-f]{3,8})\s+(\d+)%,\s*transparent\s*\)/g)) {
  for (const s of m[1].matchAll(/\.dark \.(?:dark\\:)?text-([a-z-]+)\\\/(\d+)/g)) floor[`${s[1]}/${s[2]}`] = Number(m[2])
}
if (Object.keys(floor).length < 9) console.log(`⚠  dark AA floor incomplete: ${Object.keys(floor).join(', ')}`)
const darkRing = pickVar(darkBlocks, 'ring')

// ————— color math (sRGB gamma-space alpha compositing, WCAG 2.x luminance) —————
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const over = (fgHex, alpha, bg) => {
  const f = hex2rgb(fgHex)
  const b = Array.isArray(bg) ? bg : hex2rgb(bg)
  return f.map((c, i) => Math.round(alpha * c + (1 - alpha) * b[i]))
}
const lum = (rgb) => {
  const lin = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2])
}
const contrast = (fgRgb, bgRgb) => { const [a, b] = [lum(fgRgb), lum(bgRgb)].sort((x, y) => y - x); return (a + 0.05) / (b + 0.05) }
const rgb2hex = (rgb) => `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`
const pad = (s, n) => String(s).padEnd(n)

// score: AAA → 100, AA → 60..99 linear, below AA → proportional floor
const score = (ratio, min) => ratio >= min * 1.556 ? 100 : ratio >= min ? Math.round(60 + 40 * ((ratio - min) / (min * 0.556))) : Math.max(0, Math.round((60 * ratio) / min))

// ————— evaluation —————
const rows = []
let fails = 0
/**
 * role min: text=4.5 (WCAG AA body/small), large=3.0 (≥18.7px bold / 24px),
 * icon=3.0 (non-text), decor=exempt (still scored, never required)
 */
function evalPair(label, fgSpec, bgRgb, role, required = true) {
  const [fgHex, alpha] = Array.isArray(fgSpec) ? fgSpec : [fgSpec, 1]
  const fg = over(fgHex, alpha, bgRgb)
  const ratio = contrast(fg, bgRgb)
  const min = role === 'text' ? 4.5 : role === 'decor' ? 3 : 3
  const s = score(ratio, min)
  const pass = role === 'decor' || ratio >= min
  if (!pass && required) fails++
  rows.push({ label, hex: rgb2hex(fg), ratio, min, s, pass, required, role })
}

const page = hex2rgb(svDark['sv-cloud'])
const card = hex2rgb(svDark['sv-surface'])
const navy = hex2rgb(svDark['sv-navy'])
const navySoft = hex2rgb(svDark['sv-navy-soft'])
const surfaces = { 'page #060B21': page, 'card #0E1737': card, 'navy #050B26': navy }

const eff = (color, n) => floor[`${color}/${n}`] ?? n // dark AA floor remap (integer percent)

// A. text tiers actually used in components (grep-verified) — effective dark values
for (const [surfaceName, bg] of Object.entries(surfaces)) {
  for (const n of [100, 85, 80, 75, 70, 65, 60]) evalPair(`ink@${n === 100 ? 1 : n}% on ${surfaceName}`, [svDark['sv-ink'], n / 100], bg, 'text')
  for (const n of [50, 45, 40, 38, 35, 30]) evalPair(`ink@${n}%→${eff('sv-ink', n)}% (floor) on ${surfaceName}`, [svDark['sv-ink'], eff('sv-ink', n) / 100], bg, 'text')
  for (const n of [95, 90, 85, 80, 75, 70, 60, 55, 50]) evalPair(`white@${n}% on ${surfaceName}`, ['#ffffff', n / 100], bg, 'text')
  for (const n of [45, 40, 35, 30]) evalPair(`white@${n}%→${eff('white', n)}% (floor) on ${surfaceName}`, ['#ffffff', eff('white', n) / 100], bg, 'text')
  evalPair(`blue on ${surfaceName}`, svDark['sv-blue'], bg, 'text', false) // dark: overrides → blue-light
  evalPair(`blue-light on ${surfaceName}`, svDark['sv-blue-light'], bg, 'text')
  evalPair(`orange on ${surfaceName}`, svDark['sv-orange'], bg, 'text')
  evalPair(`success on ${surfaceName}`, svDark['sv-success'], bg, 'text')
}

// B. buttons — brand hues locked (owner 2026-08-31): white on fills
evalPair('white on orange CTA', '#ffffff', hex2rgb(svDark['sv-orange']), 'large', false)
evalPair('white on blue fill', '#ffffff', hex2rgb(svDark['sv-blue']), 'text')
evalPair('white on blue-deep hover', '#ffffff', hex2rgb(svLight['sv-blue-deep']), 'text')
evalPair('white on navy CTA', '#ffffff', navy, 'text')

// C. category glyphs on their dark chips — identity hues LOCKED, applied inline
//    (category-brand.ts). Decorative per WCAG 1.4.11: the category name text
//    beside each icon carries the information. Weakest: commercial 2.6:1 —
//    upgrade path: owner-approved lighter dark-step hue per category.
for (const [name, { hue, pct }] of Object.entries(chips)) {
  for (const [surfaceName, bg] of [['card', card], ['page', page]]) {
    evalPair(`${name} hue on ${pct}% chip over ${surfaceName}`, hue, over(hue, pct / 100, bg), 'icon', false)
  }
}

// D. chrome — non-text
evalPair('border white/10 vs card', ['#ffffff', 0.1], card, 'decor', false)
evalPair('input white/15 vs card', ['#ffffff', 0.15], card, 'decor', false)
evalPair('ring (gray oklch .556) @50% vs navy', ['#8a8a8a', 0.5], navy, 'decor', false)
evalPair('ring sv-blue-light @50% vs navy', [svDark['sv-blue-light'], 0.5], navy, 'icon')
evalPair('scrollbar thumb ink@38% vs page', [svDark['sv-ink'], 0.38], page, 'decor', false)
evalPair('selection text #e9edff on blue@35% sel-bg', [svDark['sv-ink'], 1], over(svDark['sv-blue'], 0.35, page), 'text')
evalPair('surface vs page elevation Δ', rgb2hex(card), page, 'decor', false)
evalPair('card vs navySoft Δ', rgb2hex(card), navySoft, 'decor', false)

// ————— foundation candidates — analyze variants, confirm the locked picks —————
// Metrics per candidate: elevation separation vs surface (want 1.06–1.20),
// headline ink contrast, body ink@60 contrast, meta floor@50 contrast.
console.log('\n———— foundation candidates —————')
const cScore = (label, bgHex, surfaceHex, inkHex) => {
  const bg = hex2rgb(bgHex), sf = hex2rgb(surfaceHex)
  const elev = contrast(sf, bg)
  const head = contrast(hex2rgb(inkHex), bg)
  const body = contrast(over(inkHex, 0.6, bg), bg)
  const meta = contrast(over(inkHex, 0.5, bg), bg)
  const glare = lum(hex2rgb(inkHex)) > 0.96
  const elevOK = elev >= 1.06 && elev <= 1.25
  const s = Math.round((elevOK ? 40 : 15) + (head >= 12 ? 25 : head >= 9 ? 15 : 5) + (body >= 5.5 ? 20 : body >= 4.5 ? 12 : 0) + (meta >= 4.5 ? 15 : meta >= 3 ? 8 : 0) - (glare ? 10 : 0))
  console.log(`  ${pad(label, 26)} elev ${elev.toFixed(2)}  head ${head.toFixed(1)}  body60 ${body.toFixed(1)}  meta50 ${meta.toFixed(1)}${glare ? '  glare!' : ''}  → ${s}/100`)
  return s
}
console.log('  page bg (against surface):')
for (const [l, bg, sf] of [
  ['#060B21 current', svDark['sv-cloud'], svDark['sv-surface']],
  ['#050B26 navy', svDark['sv-navy'], svDark['sv-surface']],
  ['#04081C deeper', '#04081c', svDark['sv-surface']],
  ['#0A0F26 lighter', '#0a0f26', svDark['sv-surface']],
  ['#000000 pure black', '#000000', svDark['sv-surface']],
]) cScore(l, bg, sf, svDark['sv-ink'])
console.log('  ink fg:')
for (const [l, ink] of [
  ['#E9EDFF current', svDark['sv-ink']],
  ['#FFFFFF pure white', '#ffffff'],
  ['#F2F4FF brighter', '#f2f4ff'],
  ['#DDE4FF dimmer', '#dde4ff'],
]) cScore(l, svDark['sv-cloud'], svDark['sv-surface'], ink)
console.log('  surface (against page):')
for (const [l, sf] of [
  ['#0E1737 current', svDark['sv-surface']],
  ['#0C142F flatter', '#0c142f'],
  ['#111B42 loftier', '#111b42'],
  ['#0A1440 navy-soft', svDark['sv-navy-soft']],
]) cScore(l, svDark['sv-cloud'], sf, svDark['sv-ink'])

// ————— report —————
const fmt = (r) => `${r.role === 'decor' ? ' ' : r.pass ? ' ' : r.required ? '✗' : '·'} ${pad(r.label, 52)} ${pad(r.hex, 9)} ${pad(r.ratio.toFixed(2) + ':1', 8)} min ${pad(r.min, 4)} ${pad(r.s + '/100', 8)}${r.role === 'decor' ? ' (decor/exempt)' : ''}`
for (const r of rows) console.log(fmt(r))
const required = rows.filter((r) => r.required && !r.pass)
console.log(`\n${rows.length} pairs · required failures: ${required.length}`)
if (required.length) { for (const r of required) console.log(`  FAIL ${r.label} → ${r.ratio.toFixed(2)}:1 (needs ${r.min}:1)`); process.exit(1) }
