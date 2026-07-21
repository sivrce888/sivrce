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

/** prefix = starts-with (string or any word); null = no match. */
export function suggestMatch(
  hay: (string | undefined)[],
  q: string,
): { prefix: boolean } | null {
  const needle = foldQuarterQuery(q)
  if (!needle) return null
  for (const h of hay) {
    if (!h) continue
    const n = foldQuarterQuery(h)
    // "beli" → Beliashvili (word start), not only full-string start
    if (n.startsWith(needle) || n.split(/[\s,-]+/).some((w) => w.startsWith(needle))) {
      return { prefix: true }
    }
  }
  for (const h of hay) {
    if (!h) continue
    if (foldQuarterQuery(h).includes(needle)) return { prefix: false }
  }
  return null
}
