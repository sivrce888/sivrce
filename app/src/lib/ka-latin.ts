/**
 * Georgian → Latin, national romanization (one-to-one, unambiguous) — the
 * system on Tbilisi street and metro signs ('ვაჟა-ფშაველა' → 'Vazha-Pshavela').
 * Split from bilingual.ts so client chrome can romanize without shipping the
 * Latin→ka brand dictionary.
 */

const KA_TO_LATIN: Record<string, string> = {
  ა: 'a', ბ: 'b', გ: 'g', დ: 'd', ე: 'e', ვ: 'v', ზ: 'z', თ: 't', ი: 'i',
  კ: 'k', ლ: 'l', მ: 'm', ნ: 'n', ო: 'o', პ: 'p', ჟ: 'zh', რ: 'r', ს: 's',
  ტ: 't', უ: 'u', ფ: 'p', ქ: 'q', ღ: 'gh', ყ: 'k', შ: 'sh', ჩ: 'ch', ც: 'ts',
  ძ: 'dz', წ: 'ts', ჭ: 'ch', ხ: 'kh', ჯ: 'j', ჰ: 'h',
}

/** 'არჩი უნივერსი' → 'Archi Universe' (Latin tokens pass through). */
export function toLatin(name: string): string {
  return name.replace(/[ა-ჿ]+/g, (word) => {
    const lat = word
      .split('')
      .map((c) => KA_TO_LATIN[c] ?? c)
      .join('')
    return lat.charAt(0).toUpperCase() + lat.slice(1)
  })
}

/**
 * A Georgian-script place/entity name as the reader can read it: untouched
 * for Georgian UI, romanized for every other locale. Georgian is the only
 * locale that reads Mkhedruli — Latin beats an unreadable script for all others.
 */
export function readableName(name: string, lang: string): string {
  return lang === 'ka' ? name : toLatin(name)
}
