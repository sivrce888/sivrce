/**
 * Autocomplete matcher for /api/suggest (cities · districts · streets).
 * Ranking: word/full prefix first, then substring. ka/en/ru haystacks.
 */

const norm = (s: string) => s.toLowerCase()

/** prefix = starts-with (string or any word); null = no match. */
export function suggestMatch(
  hay: (string | undefined)[],
  q: string,
): { prefix: boolean } | null {
  const needle = norm(q)
  if (!needle) return null
  for (const h of hay) {
    if (!h) continue
    const n = norm(h)
    // "beli" → Beliashvili (word start), not only full-string start
    if (n.startsWith(needle) || n.split(/[\s-]+/).some((w) => w.startsWith(needle))) {
      return { prefix: true }
    }
  }
  for (const h of hay) {
    if (!h) continue
    if (norm(h).includes(needle)) return { prefix: false }
  }
  return null
}
