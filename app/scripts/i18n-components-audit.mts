/**
 * Coverage audit for co-located component dicts (src/components/x/i18n.ts,
 * cms-blocks.i18n.ts). Region-scan: parses per-locale const/property blocks
 * and checks key parity + untranslated (identical-to-en) values.
 * Run: npx tsx scripts/i18n-components-audit.mts
 */
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const LOCALES = ["ka", "en", "ru", "he", "ar", "tr", "uk", "hy", "az", "de"]
const L = LOCALES.join("|")
// identical-to-en flagging is meaningful only for non-Latin-script locales —
// de/tr/az share the alphabet with en (Agent, Support, optional… are genuine
// target-language words) and Tbilisi district names stay Latin there by design
const NON_LATIN = new Set(["ru", "he", "ar", "uk", "hy"])
// brand tier labels that stay identical in every locale
const ALLOW = new Set(["SUPER VIP", "WhatsApp", "Facebook", "Matterport", "YouTube", "Instagram", "Telegram"])

type Region = { locale: string; body: string; start: number }
type Pair = { key: string; value: string }

function regions(src: string): Region[] {
  const out: Region[] = []
  // top-level: const ka = { / const ru: Record<X, string> = {
  for (const m of src.matchAll(new RegExp(`^const (${L})\\b[^=\\n]*=\\s*(?:<[^>]+>)?\\{`, "gm"))) {
    const start = (m.index ?? 0) + m[0].length
    let depth = 1, i = start
    while (i < src.length && depth > 0) {
      if (src[i] === "{") depth++
      else if (src[i] === "}") depth--
      i++
    }
    out.push({ locale: m[1], body: src.slice(start, i), start })
  }
  // nested:   ka: {   (inside a STRINGS object)
  for (const m of src.matchAll(new RegExp(`^  (${L}): \\{`, "gm"))) {
    const start = (m.index ?? 0) + m[0].length
    let depth = 1, i = start
    while (i < src.length && depth > 0) {
      if (src[i] === "{") depth++
      else if (src[i] === "}") depth--
      i++
    }
    out.push({ locale: m[1], body: src.slice(start, i), start })
  }
  return out
}

const STRING = /(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*,?\s*\n/g
function pairs(body: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const m of body.matchAll(/(^|\n)\s*'?([\w.]+)'?:\s*/g)) {
    const key = m[2]
    const rest = body.slice((m.index ?? 0) + m[0].length)
    const sv = rest.match(/^('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/)
    if (!sv) continue // function / object / template value — skip
    const raw = sv[1].slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"')
    map.set(key, raw)
  }
  return map
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["src/components/account/i18n.ts", "src/components/compare/i18n.ts", "src/components/consent/i18n.ts", "src/components/entities/i18n.ts",
     "src/components/favorites/i18n.ts", "src/components/lead/i18n.ts", "src/components/listing/i18n.ts",
     "src/components/market/i18n.ts", "src/components/neighborhoods/i18n.ts", "src/components/payments/i18n.ts",
     "src/components/reviews/i18n.ts", "src/components/search/i18n.ts", "src/lib/cms-blocks.i18n.ts"]

let problems = 0
const fail = (msg: string) => { problems++; console.log("✗ " + msg) }

for (const rel of files) {
  const src = readFileSync(join(root, rel), "utf8")
  const regs = regions(src)
  const dict = new Map<string, Map<string, string>>()
  for (const r of regs) {
    const p = pairs(r.body)
    if (p.size === 0) continue
    dict.set(r.locale, p)
  }
  const en = dict.get("en")
  if (!en) { fail(`${rel}: no en region found (${[...dict.keys()]}); regions=${regs.map(r=>r.locale)}`); continue }
  for (const [loc, p] of dict) {
    if (loc === "en") continue
    for (const [k, v] of en) {
      if (!p.has(k)) fail(`${rel} ${loc}: missing key ${k}`)
      else {
        const lv = p.get(k)!
        if (NON_LATIN.has(loc) && lv === v && /[a-zA-Z]{4}/.test(lv) && !/^https?:/.test(lv) && !ALLOW.has(lv))
          fail(`${rel} ${loc}.${k}: identical to en — untranslated? "${lv.slice(0, 60)}"`)
      }
    }
  }
  console.log(`${rel}: ${[...dict.keys()].sort().join(",")}`)
}

console.log(problems ? `\n${problems} problem(s)` : "component dicts: clean ✓")
if (problems) process.exit(1)
