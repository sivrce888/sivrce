/** DE address fold — Straße/Str., umlauts, legal suffixes. Deterministic only. */
export function normalizeGermanAddress(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/\bstr(?:asse|\.)\b/g, "str")
    .replace(/\b(gmbh|ag|kg|ug|se|mbh)\b/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}
