/**
 * i18n coverage audit for the shared dictionaries (src/lib/i18n/*.ts).
 * Run: npx tsx scripts/i18n-audit.mts
 * Invariants across all 10 locales, with ka as source of truth:
 * 1. key parity with ka (no missing, no extra)
 * 2. no empty values
 * 3. {placeholder} sets match ka
 * 4. plural markers (when present) have 2 or 3 forms
 * 5. values identical to en in non-Latin-script locales = untranslated
 *    (URLs, brand names and proper-noun lists are exempt)
 */
import { readFileSync } from "node:fs"
import { ka } from "@/lib/i18n/ka"
import { en } from "@/lib/i18n/en"
import { ru } from "@/lib/i18n/ru"
import { he } from "@/lib/i18n/he"
import { ar } from "@/lib/i18n/ar"
import { tr } from "@/lib/i18n/tr"
import { uk } from "@/lib/i18n/uk"
import { hy } from "@/lib/i18n/hy"
import { az } from "@/lib/i18n/az"
import { de } from "@/lib/i18n/de"
import type { Lang } from "@/lib/i18n/core"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const DICTS: Record<Lang, Record<string, string>> = { ka, en, ru, he, ar, tr, uk, hy, az, de }
const kaD: Record<string, string> = ka
const enD: Record<string, string> = en
const kaKeys = Object.keys(kaD)
const NON_LATIN: Lang[] = ["ru", "he", "ar", "uk", "hy", "ka"]
// keys whose en value is a URL, brand name or pure proper-noun list — identical is correct
const ALLOW_SAME_AS_EN = new Set(["add.matterportPh", "add.youtubePh", "detail.whatsapp", "col.ski.sub"])

let problems = 0
const fail = (msg: string) => { problems++; console.log("✗ " + msg) }

const varsOf = (s: string) =>
  new Set((s.match(/\{(\w+)\}/g) ?? []).map((x) => x.slice(1, -1)).sort())

for (const lang of Object.keys(DICTS) as Lang[]) {
  if (lang === "ka") continue
  const d: Record<string, string> = DICTS[lang]
  const keys = Object.keys(d)
  const missing = kaKeys.filter((k) => !(k in d))
  const extra = keys.filter((k) => !(k in ka))
  const empty = keys.filter((k) => !d[k].trim())
  if (missing.length) fail(`${lang}: ${missing.length} missing keys: ${missing.slice(0, 20).join(", ")}${missing.length > 20 ? " …" : ""}`)
  if (extra.length) fail(`${lang}: ${extra.length} extra keys not in ka: ${extra.slice(0, 10).join(", ")}`)
  if (empty.length) fail(`${lang}: ${empty.length} empty values: ${empty.slice(0, 10).join(", ")}`)
  for (const k of keys) {
    if (!(k in kaD)) continue
    if ([...varsOf(kaD[k])].join() !== [...varsOf(d[k])].join())
      fail(`${lang} ${k}: placeholder mismatch ka=[${[...varsOf(kaD[k])]}] ${lang}=[${[...varsOf(d[k])]}]`)
    // plurals: locales add markers only where their grammar needs them
    // (tr/az use numeral+singular; ru/uk «фото» is indeclinable) — only
    // validate shape of markers that exist
    if (d[k].includes("{plural:")) {
      const forms = d[k].match(/\{plural:([^}]+)\}/)?.[1].split("|").length ?? 0
      if (forms !== 2 && forms !== 3) fail(`${lang} ${k}: invalid plural form count ${forms}`)
    }
    // identical to en in a non-Latin-script locale = untranslated
    if (NON_LATIN.includes(lang) && d[k] === enD[k] && /[a-zA-Z]{4}/.test(d[k]) && !/^[\d\s\W]+$/.test(d[k]) && !ALLOW_SAME_AS_EN.has(k))
      fail(`${lang} ${k}: identical to en — untranslated? "${d[k].slice(0, 60)}"`)
  }
}

// guard: this audit file itself stays tsc-clean (tsconfig includes **/*.mts)
const self = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "i18n-audit.mts"), "utf8")
if (/from\s+["']\.\.?\//.test(self)) fail("audit: relative .ts imports break tsc — use @/ aliases")

console.log(problems ? `\n${problems} problem(s)` : "main dicts: all 10 locales clean ✓")
if (problems) process.exit(1)
