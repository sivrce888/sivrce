/**
 * Autocomplete matcher for /api/suggest (cities · districts · streets · quarters).
 * Ranking: word/full prefix first, then substring. ka/en/ru haystacks.
 */

const norm = (s: string) => s.toLowerCase()

/** Align KA ordinals with Roman so "მეორე" hits "II კვარტალი" / "მე-2". */
export function foldQuarterQuery(s: string): string {
  let out = norm(s)
    .replace(/მე[- ]?3ა/gu, 'iiia')
    .replace(/მე[- ]?4ა/gu, 'iva')
    .replace(/მე[- ]?4ბ/gu, 'ivb')
    .replace(/პირველი|1-ლი|მე[- ]?1(?:ლი)?/gu, 'i')
    .replace(/მეორე|მე[- ]?2(?:ე)?/gu, 'ii')
    .replace(/მესამე|მე[- ]?3(?:ე)?/gu, 'iii')
    .replace(/მეოთხე|მე[- ]?4(?:ე)?/gu, 'iv')
    .replace(/მეხუთე|მე[- ]?5(?:ე)?/gu, 'v')
    .replace(/მეექვსე|მე[- ]?6(?:ე)?/gu, 'vi')
    .replace(/მეშვიდე|მე[- ]?7(?:ე)?/gu, 'vii')
    .replace(/მერვე|მე[- ]?8(?:ე)?/gu, 'viii')
    .replace(/მეცხრე|მე[- ]?9(?:ე)?/gu, 'ix')
    .replace(/მეათე|მე[- ]?10(?:ე)?/gu, 'x')
    .replace(/\b10(?=\s*კვარტალ)/gu, 'x')
    .replace(/\b1(?=\s*კვარტალ)/gu, 'i')
    .replace(/\b2(?=\s*კვარტალ)/gu, 'ii')
    .replace(/\b3(?=\s*კვარტალ)/gu, 'iii')
    .replace(/\b4(?=\s*კვარტალ)/gu, 'iv')
    .replace(/\b5(?=\s*კვარტალ)/gu, 'v')
    .replace(/\b6(?=\s*კვარტალ)/gu, 'vi')
    .replace(/\b7(?=\s*კვარტალ)/gu, 'vii')
    .replace(/\b8(?=\s*კვარტალ)/gu, 'viii')
    .replace(/\b9(?=\s*კვარტალ)/gu, 'ix')
  // Tokenize Romans — longest first so "viii" ≠ "ii"+"v"+…
  out = out
    .replace(/\bviii\b/g, 'q8')
    .replace(/\bvii\b/g, 'q7')
    .replace(/\bvi\b/g, 'q6')
    .replace(/\bivb\b/g, 'q4b')
    .replace(/\biva\b/g, 'q4a')
    .replace(/\biiia\b/g, 'q3a')
    .replace(/\biv\b/g, 'q4')
    .replace(/\biii\b/g, 'q3')
    .replace(/\bii\b/g, 'q2')
    .replace(/\bix\b/g, 'q9')
    .replace(/\bx\b/g, 'q10')
    .replace(/\bv\b/g, 'q5')
    .replace(/\bi\b/g, 'q1')
  return out
}

/**
 * ka↔latin phonetic skeleton: confusable romanization systems collapse to one
 * form (ღ/gh→g, ფ/f/ph→p, ყ/q→k, ც/ც/ts/c→c…), so "beliashvilis" hits
 * "ბელიაშვილის", "kutaisi" hits "ქუთაისი" and en-less regional streets match latin.
 */
const KA_SKEL: Record<string, string> = {
  ა: 'a', ბ: 'b', გ: 'g', დ: 'd', ე: 'e', ვ: 'v', ზ: 'z', თ: 't', ი: 'i', კ: 'k',
  ლ: 'l', მ: 'm', ნ: 'n', ო: 'o', პ: 'p', ჟ: 'z', რ: 'r', ს: 's', ტ: 't', უ: 'u',
  ფ: 'p', ქ: 'k', ღ: 'g', ყ: 'k', შ: 's', ჩ: 'c', ც: 'c', ძ: 'z', წ: 'c', ჭ: 'c',
  ხ: 'k', ჯ: 'j', ჰ: 'h',
}
const LAT_SKEL: Record<string, string> = {
  gh: 'g', kh: 'k', sh: 's', ch: 'c', zh: 'z', ts: 'c', dz: 'z', ph: 'p',
}

export function foldTranslit(s: string): string {
  const dig = norm(s).replace(/gh|kh|sh|ch|zh|ts|dz|ph/g, (m) => LAT_SKEL[m]!)
  return [...dig].map((c) => KA_SKEL[c] ?? (c === 'f' ? 'p' : c === 'q' ? 'k' : c)).join('')
}

/** Latin query tokens drop the Georgian genitive tail: "beliashvilis"→"beliashvili". */
const stemLatin = (w: string) => (/^[a-z0-9'-]{4,}$/.test(w) ? w.replace(/(?:is|s)$/, '') : w)
const stemTokens = (s: string) => s.split(/\s+/).map(stemLatin).join(' ')

/** ka genitive stripped (ნუცუბიძის→ნუცუბიძ — latin users type the nominative). */
const gStem = (s: string) => s.replace(/ის(?=[\s,]|$)|ს(?=[\s,]|$)/gu, '')

/** Same needle list for exact and fuzzy tiers — one source of truth. */
const devowel = (s: string) => s.replace(/(?:e|i)(?=[\s,]|$)/g, '')
const queryVariants = (needle: string): string[] =>
  [
    ...new Set([
      needle,
      stemTokens(needle),
      foldTranslit(needle),
      devowel(foldTranslit(needle)),
      foldTranslit(stemTokens(needle)),
      devowel(foldTranslit(stemTokens(needle))),
    ]),
  ].filter(Boolean)

/** needle ≤1 edit from a word-start prefix of w (typo rescue); early-exits past 1. */
function dist1Prefix(w: string, n: string): boolean {
  if (w.length < n.length - 1) return false
  let prev = Array.from({ length: w.length + 1 }, (_, j) => j)
  for (let i = 1; i <= n.length; i++) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= w.length; j++) {
      const d = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (n[i - 1] === w[j - 1] ? 0 : 1))
      cur.push(d)
      if (d < rowMin) rowMin = d
    }
    if (rowMin > 1) return false
    prev = cur
  }
  for (let j = Math.max(n.length - 1, 0); j <= w.length; j++) if (prev[j]! <= 1) return true
  return false
}

/** Candidate words for a hay string — hoisted out of the per-row loop. */
function fuzzyWords(s: string): string[] {
  const f = foldQuarterQuery(s)
  // dash-less pseudo-word: "ვაჟაფშაველას" (no dash typed) must still hit
  return [...new Set([
    ...foldTranslit(f).split(/[\s,-]+/),
    ...foldTranslit(gStem(f)).split(/[\s,-]+/),
    foldTranslit(f.replace(/-/g, '')),
  ])]
}

/**
 * Rescue tier — runs only when prefix/substring found nothing: one mistyped
 * char ("ბელიყაშვილის", "beliashvilisq") still surfaces the street.
 * ponytail: ≤1 edit, ≥4 chars — deeper fuzz needs a real index, not heuristics.
 */
export function suggestFuzzyPrepared(
  hay: readonly (string | undefined)[],
  cq: CompiledQuery | null,
): boolean {
  if (!cq || cq.needle.length < 4) return false
  const needles = cq.needles
  return hay.some((h) => h && fuzzyWords(h).some((w) => w && needles.some((n) => dist1Prefix(w, n))))
}

export function suggestFuzzy(hay: readonly (string | undefined)[], q: string): boolean {
  return suggestFuzzyPrepared(hay, compileQuery(q))
}

/**
 * Haystack-side folds — precompute once per catalog row (module init), so the
 * per-request cost is plain string matching over ready skeletons instead of
 * ~25 regex passes × translit per row per keystroke.
 */
export type CompiledHay = readonly (readonly [string, string, string, string])[]

export function compileHay(hay: readonly (string | undefined)[]): CompiledHay {
  return hay
    .filter((h): h is string => !!h)
    .map((h) => {
      const n = foldQuarterQuery(h)
      const n2 = gStem(n)
      return [n, foldTranslit(n), n2, foldTranslit(n2)] as const
    })
}

/**
 * Query-side folds — the mirror of compileHay. `q` is loop-invariant across the
 * ~22k catalog rows, so folding it once per request instead of once per row is
 * the difference between ~10ms and ~250ms per keystroke.
 */
export type CompiledQuery = {
  /** foldQuarterQuery(q) — kept for the fuzzy tier's length gate. */
  readonly needle: string
  readonly needles: string[]
  /** Populated only for multi-token queries ("bina vake") — see matchPrepared. */
  readonly tokenVariants: { readonly tk: string; readonly nds: string[] }[]
}

export function compileQuery(q: string): CompiledQuery | null {
  const needle = foldQuarterQuery(q)
  if (!needle) return null
  const tokens = needle.split(/[\s,]+/).filter((t) => t.length >= 3)
  return {
    needle,
    // Query variants: genitive-tail stem ("beliashvilis"), phonetic fold
    // ("nutsubidze"→"nucubize"), and folded+nominative-vowel stripped ("nucubiz").
    needles: queryVariants(needle),
    tokenVariants:
      tokens.length > 1 ? tokens.map((tk) => ({ tk, nds: queryVariants(tk) })) : [],
  }
}

/** prefix = starts-with (string or any word); null = no match. */
export function matchPrepared(
  hs: CompiledHay,
  cq: CompiledQuery | null,
): { prefix: boolean } | null {
  if (!cq) return null
  const { needles, tokenVariants } = cq
  const hitPrefix = (s: string, nd: string) =>
    s.startsWith(nd) || s.split(/[\s,-]+/).some((w) => w.startsWith(nd))
  for (const [a, b, c, d] of hs) {
    for (const nd of needles) {
      if (hitPrefix(a, nd) || hitPrefix(b, nd) || hitPrefix(c, nd) || hitPrefix(d, nd)) {
        return { prefix: true }
      }
    }
  }
  for (const [a, b, c, d] of hs) {
    if (needles.some((nd) => a.includes(nd) || b.includes(nd) || c.includes(nd) || d.includes(nd))) {
      return { prefix: false }
    }
  }
  // Multi-token queries ("bina vake", "ბინა ვაკეში") — the full phrase never
  // matches a place-name catalog. Per-token OR rescues the location token;
  // reverse startsWith ("vakeshi"/"ვაკეში") matches the inflected form.
  if (tokenVariants.length) {
    for (const [a, b, c, d] of hs) {
      const hit = tokenVariants.some(({ tk, nds }) =>
        (tk.startsWith(a) && a.length >= 3) ||
        nds.some((nd) => a.includes(nd) || b.includes(nd) || c.includes(nd) || d.includes(nd))
      )
      if (hit) return { prefix: false }
    }
  }
  return null
}

/** prefix = starts-with (string or any word); null = no match. */
export function matchCompiled(hs: CompiledHay, q: string): { prefix: boolean } | null {
  return matchPrepared(hs, compileQuery(q))
}

/** prefix = starts-with (string or any word); null = no match. */
export function suggestMatch(hay: readonly (string | undefined)[], q: string) {
  return matchCompiled(compileHay(hay), q)
}
