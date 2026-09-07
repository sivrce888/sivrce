/**
 * Bilingual entity names for SEO/AEO: every project, developer, agency and
 * agent carries its name in BOTH scripts. Georgian brands are searched in
 * Mkhedruli ('არჩი უნივერსი') and Latin ('Archi Universe') — schema.org
 * `alternateName` + visible text carries the other form to Google and AI
 * answer engines. Latin→ka is phonetic loan adaptation (NEVER translation:
 * 'Group' → 'გროუპი', never 'ჯგუფი'), with a curated dictionary for Georgia
 * toponyms and top brand words that rules cannot render ('Tbilisi' →
 * 'თბილისი', 'City' → 'სითი'). ka→Latin is the unambiguous national system.
 */

const LATIN_VOWEL = new Set('aeiou')
const GEORGIAN_VOWEL = new Set(['ა', 'ე', 'ი', 'ო', 'უ'])
const HAS_KA = /[\u10d0-\u10ff]/
const KA_CONSONANT = /[ბგდვზთკლმნპჟრსტფქღყშჩცძწჭხჯჰ]/

/** Georgian → Latin, national system (one-to-one, unambiguous). */
const KA_TO_LATIN: Record<string, string> = {
  ა: 'a', ბ: 'b', გ: 'g', დ: 'd', ე: 'e', ვ: 'v', ზ: 'z', თ: 't', ი: 'i',
  კ: 'k', ლ: 'l', მ: 'm', ნ: 'n', ო: 'o', პ: 'p', ჟ: 'zh', რ: 'r', ს: 's',
  ტ: 't', უ: 'u', ფ: 'p', ქ: 'q', ღ: 'gh', ყ: 'k', შ: 'sh', ჩ: 'ch', ც: 'ts',
  ძ: 'dz', წ: 'ts', ჭ: 'ch', ხ: 'kh', ჯ: 'j', ჰ: 'h',
}

/** Latin → Georgian singles (b-p series for loans: t→ტ, p→პ, k→კ…). */
const LATIN_TO_KA: Record<string, string> = {
  a: 'ა', b: 'ბ', d: 'დ', e: 'ე', f: 'ფ', g: 'გ', h: 'ჰ', i: 'ი', j: 'ჯ',
  k: 'კ', l: 'ლ', m: 'მ', n: 'ნ', o: 'ო', p: 'პ', q: 'კ', r: 'რ', t: 'ტ',
  u: 'უ', v: 'ვ', z: 'ზ',
}

/** Latin → Georgian digraphs, longest-match first (singles handled inline).
 *  'gh' → 'ღ' serves Georgian romanizations ('Dighomi') — English gh-loans
 *  ('Highlight') go through WORD_DICT instead. */
const LATIN_DIGRAPHS: Array<[string, string]> = [
  ['sh', 'შ'], ['ch', 'ჩ'], ['kh', 'ხ'], ['gh', 'ღ'], ['zh', 'ჟ'],
  ['ts', 'ც'], ['dz', 'ძ'], ['ck', 'კ'], ['ph', 'ფ'],
  ['wh', 'ვა'], ['ea', 'ი'], ['iew', 'იუ'], ['ew', 'იუ'],
  ['ow', 'აუ'], ['ay', 'აი'], ['ey', 'ეი'], ['oy', 'ოი'], ['uy', 'უი'],
  ['qu', 'კვ'], ['ee', 'ი'],
]

/** Roman numerals in brand names stay Latin ('Tsaxkebi III', 'Rustaveli XVI'). */
const ROMAN = /^[IVXL]+$/

/** English connectors Georgian copy keeps in Latin or drops — never 'ატი'. */
const TRANSLIT_SKIP = new Set(['at', 'by', 'of', 'the', 'on', 'in', 'and', 'or', 'to'])

/**
 * Georgia toponyms (romanized back to Latin) + brand words whose English
 * spelling rules cannot restore the real Georgian form. Matched whole-word,
 * case-insensitive. 'Group' stays rule-based ('გროუპი') by design.
 */
const WORD_DICT: Record<string, string> = {
  tbilisi: 'თბილისი', batumi: 'ბათუმი', kutaisi: 'ქუთაისი', rustavi: 'რუსთავი',
  gori: 'გორი', zugdidi: 'ზუგდიდი', poti: 'ფოთი', kobuleti: 'კობულეთი',
  mtskheta: 'მცხეთა', bakuriani: 'ბაკურიანი', gudauri: 'გუდაური', kazbegi: 'ყაზბეგი',
  mestia: 'მესტია', telavi: 'თელავი', signagi: 'სიღნაღი', kvareli: 'ყვარელი',
  borjomi: 'ბორჯომი', anaklia: 'ანაკლია', gonio: 'გონიო', tsinandali: 'ცინანდალი',
  lisi: 'ლისი', vake: 'ვაკე', saburtalo: 'საბურთალო', ortachala: 'ორთაჭალა',
  varketili: 'ვარკეთილი', digomi: 'დიღომი', didube: 'დიდუბე', mtatsminda: 'მთაწმინდა',
  nutsubidze: 'ნუცუბიძე', chavchavadze: 'ჩავჩავაძე', mirtskhulava: 'მირზხულავა',
  isani: 'ისანი', samgori: 'სამგორი', avlabari: 'ავლაბარი', vazisubani: 'ვაზისუბანი',
  krtsanisi: 'კრწანისი', ponichala: 'პონიჭალა', shekvetili: 'შეკვეთილი', tsavkisi: 'წავკისი',
  city: 'სითი', square: 'სკვერი', highlight: 'ჰაილაითი',
}

const isLatinConsonant = (c: string) =>
  /[a-z]/.test(c) && !LATIN_VOWEL.has(c) && c !== 'y' && c !== 'w'

/** Strip diacritics so 'Barceló' translits like 'Barcelo'. */
const deaccent = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/** 'Archi Universe' → 'არჩი უნივერსი' · 'OMNIA ისანი' → 'ომნია ისანი'. */
export function toGeorgian(name: string): string {
  return deaccent(name).replace(/[a-zA-Z]+/g, (word) => {
    const w = word.toLowerCase()
    if (TRANSLIT_SKIP.has(w) || ROMAN.test(word)) return word
    if (WORD_DICT[w]) return WORD_DICT[w]
    let out = ''
    for (let i = 0; i < w.length; ) {
      const dig = LATIN_DIGRAPHS.find(([d]) => w.startsWith(d, i))
      if (dig) {
        out += dig[1]
        i += dig[0].length
        continue
      }
      const c = w[i]!
      const next = w[i + 1] ?? ''
      // c→ც mid-word ('Center'); word-final 'ce/ci/cy' and the 'ces' plural
      // keep ს ('Residence'→'რეზიდენსი', 'Residences'→'რეზიდენსესი')
      if (c === 'c')
        out += 'eiy'.includes(next)
          ? i + 2 >= w.length || w[i + 2] === 's'
            ? 'ს'
            : 'ც'
          : 'კ'
      else if (c === 'x') out += 'ქს'
      else if (c === 's')
        out +=
          GEORGIAN_VOWEL.has(out[out.length - 1] ?? '') && LATIN_VOWEL.has(next)
            ? 'ზ'
            : 'ს'
      else if (c === 'y') out += isLatinConsonant(w[i - 1] ?? '') ? 'აი' : 'ი'
      else if (c === 'w') out += 'ვ'
      else out += LATIN_TO_KA[c] ?? c
      i++
    }
    // Loans drop doubled consonants ('Villa'→'ვილა', 'Alliance'→'ალიანსი').
    out = out.replace(new RegExp(`(${KA_CONSONANT.source})\\1+`, 'g'), '$1')
    // Georgian loans take an epenthetic ი: final consonant → '…ი', final
    // silent e after consonant folds into it ('Residence' → 'რეზიდენსი').
    // Romanized surnames keep their 'ე' ('Nutsubidze' → 'ნუცუბიძე').
    // Single letters ('m²' → 'მ²') stay bare.
    const last = w[w.length - 1]!
    if (w.length > 1) {
      if (last === 'e' && isLatinConsonant(w[w.length - 2]!) && out.endsWith('ე'))
        out = /dze$/.test(w) ? out : out.slice(0, -1) + 'ი'
      else if (isLatinConsonant(last)) out += 'ი'
    }
    return out
  })
}

/** 'არჩი უნივერსი' → 'Archi Universe' (Latin tokens pass through). */
export function toLatin(name: string): string {
  return name.replace(/[\u10d0-\u10ff]+/g, (word) => {
    const lat = word
      .split('')
      .map((c) => KA_TO_LATIN[c] ?? c)
      .join('')
    return lat.charAt(0).toUpperCase() + lat.slice(1)
  })
}

/**
 * The other-script form of an entity name, or '' when there is no gain
 * (empty, digits only, or the input is already bilingual).
 */
export function altName(name: string): string {
  if (!name || !/[a-z\u10d0-\u10ff]/i.test(name)) return ''
  // Any Latin letter → complete to the full Georgian form; pure Georgian → Latin.
  const alt = /[a-z]/i.test(name) ? toGeorgian(name) : toLatin(name)
  const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u10d0-\u10ff]+/g, '')
  return alt && key(alt) !== key(name) ? alt : ''
}

/** Deduped schema.org alternateName list: all locale variants + the translit.
 *  Derivation is skipped when a variant already covers the other script
 *  (persons carry real ka names — never derive 'ბერიდზე' from 'Beridze'). */
export function altNameList(name: string, variants: Array<string | undefined>): string[] {
  const covered = variants.some((v) => v && HAS_KA.test(v) !== HAS_KA.test(name))
  const alt = covered ? '' : altName(name)
  return [...new Set([...variants, alt])].filter((n): n is string => !!n && n !== name)
}
