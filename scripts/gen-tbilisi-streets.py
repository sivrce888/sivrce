#!/usr/bin/env python3
"""Throwaway generator: tbilisi-streets-osm.json -> app/src/data/tbilisi-streets.ts"""
import json, re, sys

SRC = '/Users/mac/Desktop/sivrce888/scripts/tbilisi-streets-osm.json'
OUT = '/Users/mac/Desktop/sivrce888/app/src/data/tbilisi-streets.ts'

GE2LAT = {
    'ა':'a','ბ':'b','გ':'g','დ':'d','ე':'e','ვ':'v','ზ':'z','თ':'t','ი':'i',
    'კ':'k','ლ':'l','მ':'m','ნ':'n','ო':'o','პ':'p','ჟ':'zh','რ':'r','ს':'s',
    'ტ':'t','უ':'u','ფ':'p','ქ':'k','ღ':'gh','ყ':'q','შ':'sh','ჩ':'ch','ც':'ts',
    'ძ':'dz','წ':'ts','ჭ':'ch','ხ':'kh','ჯ':'j','ჰ':'h',
}

def translit(s: str) -> str:
    return ''.join(GE2LAT.get(c, c) for c in s)

def slugify(ka: str) -> str:
    s = translit(ka).lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')

# Hand-curated street -> district (exact OSM ka name).
DISTRICT_MAP = {
    # vake
    'ილია ჭავჭავაძის გამზირი': 'vake',
    'ილია ჭავჭავაძის I შესახვევი': 'vake',
    'მიხეილ თამარაშვილის გამზირი': 'vake',
    'მიხეილ ჯავახიშვილის ქუჩა': 'vake',
    'ჟიული შარტავას ქუჩა': 'vake',
    'დემეტრე თავდადებულის ქუჩა': 'vake',
    'თორნიკე ერისთავის ქუჩა': 'vake',
    'გრიგოლ ლორთქიფანიძის ქუჩა': 'vake',
    'მშვიდობის ქუჩა': 'vake',
    'რამაზ ჩხიკვაძის ქუჩა': 'vake',
    'ვასილ ბარნოვის ქუჩა': 'vake',
    'გიორგი ბრწყინვალეს ქუჩა': 'vake',
    'ზაქარია ფალიაშვილის ქუჩა': 'vake',
    'ზაარბრიუკენის მოედანი': 'vake',
    'ირაკლი უჩანეიშვილის ქუჩა': 'vake',
    'კაკაბეთის ქუჩა': 'vake',
    'ირაკლი აბაშიძის ქუჩა': 'vake',
    # saburtalo
    'აკაკი წერეთლის გამზირი': 'saburtalo',
    'აკაკი წერეთლის ქუჩა': 'saburtalo',
    'უნივერსიტეტის ქუჩა': 'saburtalo',
    'ვაჟა-ფშაველას გამზირი': 'saburtalo',
    'სესილია თაყაიშვილის ქუჩა': 'saburtalo',
    'პეტრე ქავთარაძის ქუჩა': 'saburtalo',
    'ვიქტორ კუპრაძის ქუჩა': 'saburtalo',
    'პეკინის გამზირი': 'saburtalo',
    'ალექსანდრე ყაზბეგის გამზირი': 'saburtalo',
    'ალექსანდრე ყაზბეგის ქუჩა': 'saburtalo',
    'მუხრან მაჭავარიანის ქუჩა': 'saburtalo',
    'ილია ვეკუას ქუჩა': 'saburtalo',
    'ნუგზარ შანავას ქუჩა': 'saburtalo',
    'ივანე ჯავახიშვილის ქუჩა': 'saburtalo',
    'ლისის ქუჩა': 'saburtalo',
    'ავთო ვარაზის ქუჩა': 'saburtalo',
    'ზურაბ ანჯაფარიძის ქუჩა': 'saburtalo',
    'იუნკერთა ქუჩა': 'saburtalo',
    'შალვა ნუცუბიძის ქუჩა': 'saburtalo',
    'თეოფანე დავითაიას ქუჩა': 'saburtalo',
    'იოანე პეტრიწის ქუჩა': 'saburtalo',
    'ანა პოლიტკოვსკაიას ქუჩა': 'saburtalo',
    'საირმის ქუჩა': 'saburtalo',
    'რაჭას ქუჩა': 'saburtalo',
    'წერონისის ქუჩა': 'saburtalo',
    'გიორგი ჩიტაიას ქუჩა': 'saburtalo',
    # mtatsminda
    'მერაბ კოსტავას ქუჩა': 'mtatsminda',
    'გმირთა მოედანი': 'mtatsminda',
    'შოთა რუსთაველის გამზირი': 'mtatsminda',
    'დიმიტრი უზნაძის ქუჩა': 'mtatsminda',
    'ექვთიმე თაყაიშვილის ქუჩა': 'mtatsminda',
    'მიხეილ გახოკიძის ქუჩა': 'mtatsminda',
    'სიმონ ჩიქოვანის ქუჩა': 'mtatsminda',
    'ევგენი მიქელაძის ქუჩა': 'mtatsminda',
    'ბესარიონ ჭიჭინაძის ქუჩა': 'mtatsminda',
    'ივანე მაჩაბლის ქუჩა': 'mtatsminda',
    'ლეხ კაჩინსკის ქუჩა': 'mtatsminda',
    'გიორგი ლეონიძის ქუჩა': 'mtatsminda',
    'ნიკო კეცხოველის ქუჩა': 'mtatsminda',
    'ლადო მესხიშვილის ქუჩა': 'mtatsminda',
    'მარიჯანის ქუჩა': 'mtatsminda',
    'პაოლო იაშვილის ქუჩა': 'mtatsminda',
    'ვიქტორ დოლიძის ქუჩა': 'mtatsminda',
    '26 მაისის ქუჩა': 'mtatsminda',
    'გიორგი ათონელის ქუჩა': 'mtatsminda',
    # didi-dighomi
    'მოსკოვის გამზირი': 'didi-dighomi',
    'დავით გურამიშვილის გამზირი': 'didi-dighomi',
    'გიორგი სააკაძის მოედანი': 'didi-dighomi',
    'გიორგი სააკაძის დაღმართი': 'didi-dighomi',
    'გუდამაყარის ქუჩა': 'didi-dighomi',
    # ortachala
    'ცოტნე დადიანის ქუჩა': 'ortachala',
    'დიმიტრი გულიას ქუჩა': 'ortachala',
    'ვახუშტი ბაგრატიონის ქუჩა': 'ortachala',
    'კრწანისის ქუჩა': 'ortachala',
    # isani
    'ნავთლუღის ქუჩა': 'isani',
    # gldani
    'ომარ ხიზანიშვილის ქუჩა': 'gldani',
    'ლეო კვაჭაძის ქუჩა': 'gldani',
    'ავჭალას ქუჩა': 'gldani',
    'ნოდარ დუმბაძის გამზირი': 'gldani',
    'კულა გლდანელის ქუჩა': 'gldani',
    # avlabari
    'წმინდა ქეთევან დედოფლის გამზირი': 'avlabari',
    'ნიკოლოზ ბარათაშვილის სახელობის მარცხენა სანაპირო': 'avlabari',
    'ბათუმის ქუჩა': 'avlabari',
    # tskneti
    'წყნეთის გზატკეცილი': 'tskneti',
    # old-tbilisi
    'ვახტანგ გორგასლის ქუჩა': 'old-tbilisi',
    'ვახტანგ გორგასალის ქუჩა': 'old-tbilisi',
    'ნიკოლოზ ბარათაშვილის ქუჩა': 'old-tbilisi',
    'იოსებ გრიშაშვილის ქუჩა': 'old-tbilisi',
    'ერეკლე მეორის ქუჩა': 'old-tbilisi',
    'კოტე აფხაზის ქუჩა': 'old-tbilisi',
    # varketili
    'კახეთის გზატკეცილი': 'varketili',
    'რუსთავის გზატკეცილი': 'varketili',
    'მარშალ გელოვანის გამზირი': 'varketili',
    'საინგილოს ქუჩა': 'varketili',
    'ბერი გაბრიელ სალოსის გამზირი': 'varketili',
    'ქართულ-ამერიკული მეგობრობის გამზირი': 'varketili',
    # chughureti
    'დავით აღმაშენებლის ხეივანი': 'chughureti',
    'თამარ მეფის გამზირი': 'chughureti',
    'მიხეილ წინამძღვრიშვილის ქუჩა': 'chughureti',
    'კოტე მარჯანიშვილის ქუჩა': 'chughureti',
    'ზაზა ფანასკერტელ-ციციშვილის ქუჩა': 'chughureti',
    'ტაშკენტის ქუჩა': 'chughureti',
    # nadzaladevi
    'გრიგოლ რობაქიძის გამზირი': 'nadzaladevi',
    'გიორგი აბაშვილის ქუჩა': 'nadzaladevi',
    'ქერჩის ქუჩა': 'nadzaladevi',
    'ცხრა ძმა ხერხეულიძის ქუჩა': 'nadzaladevi',
    'აფხაზეთის ქუჩა': 'nadzaladevi',
}

data = json.load(open(SRC))
rows = []
seen = {}
for d in data:
    ka = d['ka'].strip()
    if not re.search(r'[Ⴠ-ჿ]', ka):
        continue
    if '—' in ka:
        continue  # intercity route names
    slug = slugify(ka)
    if not slug:
        continue
    if slug in seen:
        seen[slug] += 1
        slug = f"{slug}-{seen[slug]}"
    else:
        seen[slug] = 1
    district = DISTRICT_MAP.get(ka)
    rows.append({'slug': slug, 'ka': ka, 'en': d.get('en', '').strip(), 'district': district})

matched_keys = {r['ka'] for r in rows if r['district']}
unmatched = [k for k in DISTRICT_MAP if k not in matched_keys]
if unmatched:
    print('WARN unmatched DISTRICT_MAP keys:', *unmatched, sep='\n  - ')

assigned = [r for r in rows if r['district']]
print(f'total streets: {len(rows)}, district-assigned: {len(assigned)}')
from collections import Counter
print(Counter(r['district'] for r in assigned))

def ts_str(s):
    return "'" + s.replace('\\', '\\\\').replace("'", "\\'") + "'"

lines = []
lines.append('/**')
lines.append(' * SIVRCE — Tbilisi street catalog (programmatic SEO).')
lines.append(' * Generated from scripts/tbilisi-streets-osm.json (OpenStreetMap, 4002 names;')
lines.append(' * intercity route names dropped). Slugs = deterministic Georgian→Latin')
lines.append(' * transliteration, collisions deduped with a numeric suffix.')
lines.append(' *')
lines.append(' * ponytail: district assignment is hand-curated for the top streets only')
lines.append(' * (~100, by OSM way count). Upgrade path: spatial join of OSM way geometry')
lines.append(' * against district boundaries, then regenerate this file.')
lines.append(' */')
lines.append('')
lines.append("import { LISTINGS, type Listing } from '@/data/listings'")
lines.append('')
lines.append('export interface TbilisiStreet {')
lines.append('  slug: string')
lines.append('  ka: string')
lines.append('  en: string')
lines.append('  district?: string')
lines.append('}')
lines.append('')
lines.append('export const STREETS: TbilisiStreet[] = [')
for r in rows:
    entry = f"  {{ slug: {ts_str(r['slug'])}, ka: {ts_str(r['ka'])}, en: {ts_str(r['en'])}"
    if r['district']:
        entry += f", district: {ts_str(r['district'])}"
    entry += ' },'
    lines.append(entry)
lines.append(']')
lines.append('')
lines.append('/** Approximate district centers — used for the district weather badge. */')
lines.append('export const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {')
coords = {
    'vake': (41.707, 44.766), 'saburtalo': (41.724, 44.752), 'mtatsminda': (41.699, 44.786),
    'old-tbilisi': (41.694, 44.802), 'avlabari': (41.693, 44.815), 'isani': (41.682, 44.838),
    'ortachala': (41.683, 44.823), 'gldani': (41.792, 44.812), 'didi-dighomi': (41.775, 44.762),
    'chughureti': (41.713, 44.803), 'nadzaladevi': (41.738, 44.788), 'varketili': (41.688, 44.868),
    'tskneti': (41.731, 44.692), 'tskhvarichamia': (41.752, 44.657),
}
for k, (lat, lng) in coords.items():
    lines.append(f"  {ts_str(k)}: {{ lat: {lat}, lng: {lng} }},")
lines.append('}')
lines.append('')
lines.append('export function getStreet(slug: string): TbilisiStreet | undefined {')
lines.append('  return STREETS.find((s) => s.slug === slug)')
lines.append('}')
lines.append('')
lines.append('export function streetsOfDistrict(districtSlug: string): TbilisiStreet[] {')
lines.append("  return STREETS.filter((s) => s.district === districtSlug).sort((a, b) => a.ka.localeCompare(b.ka, 'ka'))")
lines.append('}')
lines.append('')
lines.append('/** Street-type suffix words dropped when matching listing addresses. */')
lines.append("const STREET_SUFFIXES = new Set(['გამზირი', 'ქუჩა', 'ხეივანი', 'სანაპირო', 'გზატკეცილი', 'მოედანი', 'აღმართი', 'დაღმართი', 'შესახვევი', 'გასასვლელი', 'ჩიხი', 'გზა', 'I', 'II', 'III', 'IV', 'V'])")
lines.append('')
lines.append('/**')
lines.append(' * Distinctive core of a street name for address matching:')
lines.append(' * „ილია ჭავჭავაძის გამზირი" → „ჭავჭავაძის", so it also matches short forms')
lines.append(' * like „ჭავჭავაძის 47" / „ჭავჭავაძის გამზ. 21".')
lines.append(' */')
lines.append('export function streetCore(ka: string): string {')
lines.append("  const words = ka.split(/\\s+/).filter((w) => !STREET_SUFFIXES.has(w))")
lines.append('  return words[words.length - 1] ?? ka')
lines.append('}')
lines.append('')
lines.append('/** True when `needle` appears in `hay` as a whole word (Georgian-letter boundaries). */')
lines.append('function includesWord(hay: string, needle: string): boolean {')
lines.append('  let i = hay.indexOf(needle)')
lines.append('  while (i !== -1) {')
lines.append("    const before = hay[i - 1] ?? ''")
lines.append("    const after = hay[i + needle.length] ?? ''")
lines.append("    if (!/[ა-ჿ]/.test(before) && !/[ა-ჿ]/.test(after)) return true")
lines.append('    i = hay.indexOf(needle, i + 1)')
lines.append('  }')
lines.append('  return false')
lines.append('}')
lines.append('')
lines.append('/**')
lines.append(' * Spelling variants of a street core: each ჭ/ჩ position flips independently —')
lines.append(' * users often mistype „ჩავჭავაძის" for „ჭავჭავაძის" (first letter only).')
lines.append(' */')
lines.append('function coreVariants(core: string): string[] {')
lines.append('  const out = new Set([core])')
lines.append('  const chars = [...core]')
lines.append('  chars.forEach((c, i) => {')
lines.append("    if (c !== 'ჭ' && c !== 'ჩ') return")
lines.append('    for (const v of [...out]) {')
lines.append("      out.add(v.slice(0, i) + (v[i] === 'ჭ' ? 'ჩ' : 'ჭ') + v.slice(i + 1))")
lines.append('    }')
lines.append('  })')
lines.append('  return [...out]')
lines.append('}')
lines.append('')
lines.append('/**')
lines.append(' * Listings on a street: Tbilisi-only, whole-word match of the street core')
lines.append(' * in the free-text address (whole-word so „ლისის" never matches „თბილისის").')
lines.append(' * ponytail: same-surname streets in one district share listings (e.g.')
lines.append(' * ჭავჭავაძის გამზირი / I შესახვევი) — until addresses get structured fields.')
lines.append(' */')
lines.append('export function listingsOfStreet(street: TbilisiStreet): Listing[] {')
lines.append('  const variants = coreVariants(streetCore(street.ka))')
lines.append('  return LISTINGS.filter(')
lines.append("    (l) => l.city === 'თბილისი' && variants.some((v) => includesWord(l.address, v)),")
lines.append('  )')
lines.append('}')
lines.append('')
lines.append('/** Adessive case of the street name: „გამზირი" → „გამზირზე", „ქუჩა" → „ქუჩაზე" — for H1s. */')
lines.append('export function streetLocative(ka: string): string {')
lines.append("  const words = ka.split(/\\s+/)")
lines.append('  const last = words[words.length - 1]!')
lines.append("  const loc = last.endsWith('ი') ? `${last.slice(0, -1)}ზე` : `${last}ზე`")
lines.append('  return [...words.slice(0, -1), loc].join(\' \')')
lines.append('}')
lines.append('')

open(OUT, 'w').write('\n'.join(lines))
print('wrote', OUT)
