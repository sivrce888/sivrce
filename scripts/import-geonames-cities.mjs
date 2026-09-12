/**
 * Import GeoNames cities15000.txt -> MAP_CITIES (app/src/lib/map/user-place.ts)
 * Run: node scripts/import-geonames-cities.mjs
 * Ponytail: streaming parse, no deps, outputs ready-to-paste TS array.
 */

import { readFileSync, writeFileSync } from 'fs'

const FILE = '/Users/mac/Desktop/sivrce888/research/cities15000.txt'
const OUT = '/Users/mac/Desktop/sivrce888/app/src/data/user-place.gen.ts'

// GeoNames columns (tab-delimited)
// geonameid, name, asciiname, alternatenames, latitude, longitude, featureClass, featureCode, countryCode, cc2, admin1, admin2, admin3, admin4, population, elevation, dem, timezone, modificationDate

// Only populated places (P) with meaningful feature codes
const VALID_FEATURE_CODES = new Set([
  'PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLC', 'PPLF', 'PPLG',
  'PPLL', 'PPLR', 'PPLS', 'PPLW', 'PPLX', 'PPLA5'
])

// Country code -> Georgian name
const COUNTRY_KA = {}
const countryKaData = `AD:ანდორა;AE:საემირო;AF:აფღანეთი;AG:ანტიგუა და ბარბუდა;AI:ანგილა;AL:ალბანეთი;AM:სომხეთი;AO:ანგოლა;AQ:ანტარქტიდა;AR:არგენტინა;AS:ამერიკული სამოა;AT:ავსტრია;AU:ავსტრალია;AW:არუბა;AX:ალანდის კუნძულები;AZ:აზერბაიჯანი;BA:ბოსნია და ჰერცეგოვინა;BB:ბარბადოს;BD:ბანგლადეში;BE:ბელგია;BF:ბურკინა ფასო;BG:ბულგარია;BH:ბაჰრეინი;BI:ბურუნდი;BJ:ბენინი;BL:სენ-ბართელმი;BM:ბერმუდა;BN:ბრუნეი;BO:ბოლივია;BQ:კარიბის ნიდერლანდები;BR:ბრაზილია;BS:ბაჰამი;BT:ბუტანი;BV:ბუვეს კუნძული;BW:ბოწვანა;BY:ბელარუსი;BZ:ბელიზი;CA:კანადა;CC:კოკოსის კუნძულები;CD:კონგო (კინშასა);CF:ცენტრალური აფრიკული რესპუბლიკა;CG:კონგო (ბრაზავილი);CH:შვეიცარია;CI:კოტ-დ’ივუარი;CK:კუკის კუნძულები;CL:ჩილე;CM:კამერუნი;CN:ჩინეთი;CO:კოლუმბია;CR:კოსტა-რიკა;CU:კუბა;CV:კაბო-ვერდე;CW:კურასაო;CX:შობის კუნძული;CY:კვიპროსი;CZ:ჩეხეთი;DE:გერმანია;DJ:ჯიბუტი;DK:დანია;DM:დომინიკა;DO:დომინიკელთა რესპუბლიკა;DZ:ალჟირი;EC:ეკვადორი;EE:ესტონია;EG:ეგვიპტე;EH:დასავლეთი საჰარა;ER:ერიტრეა;ES:ესპანეთი;ET:ეთიოპია;FI:ფინეთი;FJ:ფიჯი;FK:ფolpheენდის კუნძულები;FM:მიკრონეზია;FO:ფაროს კუნძულები;FR:ფრანგეთი;GA:გაბონი;GB:დიდი ბრიტანეთი;GD:გრენადა;GE:საქართველო;GF:ფრანგული გვიანა;GG:გურნსი;GH:განა;GI:გიბრალტარი;GL:გრენლანდია;GM:გამბია;GN:გვინეა;GP:გვადელუპა;GQ:ეკვატორული გვინეა;GR:საქართველო;GT:გვატემალა;GU:გუამი;GW:გვინეა-ბისაუ;GY:გაიანა;HK:ჰონკონგი;HM:ხერდისა და მაკდონალდის კუნძულები;HN:ჰონდურასი;HR:ხორვატია;HT:ჰაიტი;HU:უნგრეთი;ID:ინდონეზია;IE:ირლანდია;IL:ისრაელი;IM:მენის კუნძული;IN:ინდოეთი;IO:ბრიტანეთის ინდოეთერანული ოკეანის ტერიტორია;IQ:ირაყი;IR:ირანი;IS:ისლანდია;IT:იტალია;JE:ჯერსი;JM:იამაიკა;JO:იორდანია;JP:იაპონია;KE:კენია;KG:ყირგიზეთი;KH:კამბოჯა;KI:კირიბატი;KM:კომოროსი;KN:სენტ-კიტსი და ნევისი;KP:ჩრდილოეთი კორეა;KR:სამხრეთი კორეა;KW:koweითი;KY:კაიმანის კუნძულები;KZ:ყაზახეთი;LA:ლაოსი;LB:ლიბანი;LC:სენტ-ლუსია;LI:ლიხტენშტაინი;LK:შრი-ლანკა;LR:ლიბერია;LS:ლესოთო;LT:ლიტვა;LU:ლუქსემბურგი;LV:ლატვია;LY:ლიბია;MA:მაროკო;MC:მონაკო;MD:მოლდოვა;ME:მონტენეგრო;MF:სენ-მარტენი;MG:მადაგასკარი;MH:მარშალის კუნძულები;MK:სеверная მაკედონია;ML:მალი;MM:მიანმარი;MN:მონგოლეთი;MO:მაკაო;MP:ჩრდილოეთ მარიანის კუნძულები;MQ:მარტინიკა;MR:მავრიტანია;MS:მონსერატი;MT:მალტა;MU:მავრიკი;MV:მალდივები;MW:მალავი;MX:მექსიკა;MY:მალაიზია;MZ:მოზამბიკი;NA:ნამიბია;NC:ნოველი კალედონია;NE:ნიგერი;NF:ნორფოლკის კუნძული;NG:ნიგერია;NI:ნიკარაგუა;NL:ნიდერლანდები;NO:ნორვეგია;NP:ნეპალი;NR:ნაურუ;NU:ნიუე;NZ:ნოველი ზელანდია;OM:ომანი;PA:პანამა;PE:პერუ;PF:ფრანგული პოლინეზია;PG:პაპუა-ნოველი გვინეა;PH:ფილიპინები;PK:პაკისტანი;PL:პოლონეთი;PM:სენ-პიერი და მიქელონი;PN:პიტკერნი;PR:პუერტო-რიკო;PS:პალესტინა;PT:პორტუგალია;PW:პალაუ;PY:პარაგვაი;QA:კატარი;RE:რეუნიონი;RO:რუმინეთი;RS:სერბია;RU:რუსეთი;RW:რუანდა;SA:საუდის არაბეთი;SB:სალომონის კუნძულები;SC:სეიშელი;SD:სუდანი;SE:შვედეთი;SG:სინგაპური;SH:სენტ-ელენე;SI:სლოვენია;SJ:სვალბარდი და იან მაიენი;SK:სლოვაკეთი;SL:სიერა-ლეონე;SM:სან-მარინო;SN:სენეგალი;SO:სომალი;SR:სურინამი;SS:სამხრეთი სუდანი;ST:საოტომე და პრინსიპი;SV:სალვადორი;SX:სინტ-მარტენი;SY:სირია;SZ:ესვატინი;TC:ტერქსისა და კაიკოსის კუნძულები;TD:ჩადი;TF:ფრანგული სამხრეთი ტერიტორიები;TG:ტოგო;TH:ტაილანდი;TJ:ტაჯიკეთი;TK:ტოკელაუ;TL:თიმორი-ლეშტე;TM:ტურქმენეთი;TN:ტუნისი;TO:ტონგა;TR:თურქეთი;TT:ترینიდადი და ტობაგო;TV:ტუვალუ;TW:ტაივანი;TZ:ტანზანია;UA:უკრაინა;UG:უგანდა;UM:აშშ-ის დაშორებული კუნძულები;US:აშშ;UY:ურუგვაი;UZ:უზბეკეთი;VA:ვატიკანი;VC:სენ-ვინსენტი და გრენადინები;VE:ვენესუელა;VG:ბრიტანეთის ვირჯინის კუნძულები;VI:აშშ-ის ვირჯინის კუნძულები;VN:ვიეტნამი;VU:ვანუატუ;WF:უოლისი და ფუტუნა;WS:სამოა;XK:კოსოვო;YE:იემენი;YT:მაიოტა;ZA:სამხრეთი აფრიკა;ZM:ზამბია;ZW:ზიმბაბვე`
countryKaData.split(';').forEach(p => { const [k, v] = p.split(':'); if (k && v) COUNTRY_KA[k] = v })

function enToKa(en) {
  return en
    .replace(/shv/g, 'შვ').replace(/sh/g, 'შ').replace(/ch/g, 'ჩ')
    .replace(/ts/g, 'ც').replace(/tz/g, 'ც').replace(/zh/g, 'ჟ')
    .replace(/kh/g, 'ხ').replace(/gh/g, 'ღ').replace(/ph/g, 'ფ')
    .replace(/th/g, 'თ').replace(/ks/g, 'ქს').replace(/ps/g, 'ფს')
    .replace(/ya/g, 'ია').replace(/ye/g, 'ე').replace(/yi/g, 'ი')
    .replace(/yo/g, 'იო').replace(/yu/g, 'იუ').replace(/ja/g, 'ჯა')
    .replace(/je/g, 'ჯე').replace(/ji/g, 'ჯი').replace(/jo/g, 'ჯო')
    .replace(/ju/g, 'ჯუ').replace(/a/g, 'ა').replace(/b/g, 'ბ')
    .replace(/g/g, 'გ').replace(/d/g, 'დ').replace(/e/g, 'ე')
    .replace(/v/g, 'ვ').replace(/z/g, 'ზ').replace(/t/g, 'ტ')
    .replace(/i/g, 'ი').replace(/k/g, 'კ').replace(/l/g, 'ლ')
    .replace(/m/g, 'მ').replace(/n/g, 'ნ').replace(/o/g, 'ო')
    .replace(/p/g, 'პ').replace(/r/g, 'რ').replace(/s/g, 'ს')
    .replace(/u/g, 'უ').replace(/f/g, 'ფ').replace(/q/g, 'ყ')
    .replace(/w/g, 'ვ').replace(/x/g, 'ქს').replace(/y/g, 'ი')
    .replace(/j/g, 'ჯ').replace(/h/g, 'ჰ')
    .replace(/A/g, 'ა').replace(/B/g, 'ბ').replace(/G/g, 'გ')
    .replace(/D/g, 'დ').replace(/E/g, 'ე').replace(/V/g, 'ვ')
    .replace(/Z/g, 'ზ').replace(/T/g, 'ტ').replace(/I/g, 'ი')
    .replace(/K/g, 'კ').replace(/L/g, 'ლ').replace(/M/g, 'მ')
    .replace(/N/g, 'ნ').replace(/O/g, 'ო').replace(/P/g, 'პ')
    .replace(/R/g, 'რ').replace(/S/g, 'ს').replace(/U/g, 'უ')
    .replace(/F/g, 'ფ').replace(/Q/g, 'ყ').replace(/W/g, 'ვ')
    .replace(/X/g, 'ქს').replace(/Y/g, 'ი').replace(/J/g, 'ჯ')
    .replace(/H/g, 'ჰ')
}

function slugify(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

const raw = readFileSync(FILE, 'utf8')
const lines = raw.trim().split('\n')
const cities = []

for (const line of lines) {
  const parts = line.split('\t')
  if (parts.length < 19) continue
  const [, name, asciiname, , lat, lng, fclass, fcode, cc, , , , , , population] = parts
  if (fclass !== 'P') continue
  if (!VALID_FEATURE_CODES.has(fcode)) continue
  const latitude = parseFloat(lat)
  const longitude = parseFloat(lng)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue
  if (Math.abs(latitude) < 0.001 && Math.abs(longitude) < 0.001) continue
  const countryKa = COUNTRY_KA[cc] ?? cc
  const en = asciiname || name
  const ka = enToKa(en)
  const slug = slugify(en)
  cities.push({ slug, ka, en, lat: latitude, lng: longitude, cc, pop: parseInt(population, 10) || 0 })
}

console.log(`Parsed ${cities.length} cities from GeoNames`)

// Slug clash → keep the bigger city (NZ Wellington beats GB namesake);
// pop-desc order also feeds the suburb prune below.
const bySlugBest = new Map()
for (const c of cities) {
  const prev = bySlugBest.get(c.slug)
  if (!prev || c.pop > prev.pop) bySlugBest.set(c.slug, c)
}
const unique = [...bySlugBest.values()].sort((a, b) => b.pop - a.pop)
console.log(`Unique after slug dedupe (biggest wins): ${unique.length}`)

// ponytail: prune suburbs — drop any place within 10km of a bigger kept city,
// so nearest-city snap lands on the metro (Karori→Wellington), not a borough.
// Twin cities >10km apart survive; raise threshold only if snaps feel coarse.
const SUBURB_KM = 10
const RAD = Math.PI / 180
const kept = []
for (const c of unique) {
  const isSuburb = kept.some(k => {
    const dLat = (k.lat - c.lat) * RAD
    const dLng = (k.lng - c.lng) * RAD
    const s = Math.sin(dLat / 2) ** 2 +
      Math.cos(c.lat * RAD) * Math.cos(k.lat * RAD) * Math.sin(dLng / 2) ** 2
    return 2 * 6371 * Math.asin(Math.sqrt(s)) < SUBURB_KM
  })
  if (!isSuburb) kept.push(c)
}
console.log(`After suburb prune (<${SUBURB_KM}km of bigger city): ${kept.length}`)
unique.length = 0
unique.push(...kept)

// Generate TS file
const ts = `/**
 * AUTO-GENERATED: GeoNames cities15000 -> MAP_CITIES extension
 * Run: node scripts/import-geonames-cities.mjs
 * DO NOT EDIT BY HAND - regenerate instead.
 */

export type MapCityCc = string

export type MapCity = {
  slug: string
  ka: string
  en: string
  lat: number
  lng: number
  cc: MapCityCc
}

function city(slug: string, ka: string, en: string, lat: number, lng: number, cc: MapCityCc): MapCity {
  return { slug, ka, en, lat, lng, cc }
}

/** GeoNames cities (population > 15k or admin seats). 25,000+ rows. */
export const GEONAMES_CITIES = [
${unique.map(c => `  city('${c.slug}', '${c.ka.replace(/'/g, "\\'")}', '${c.en.replace(/'/g, "\\'")}', ${c.lat}, ${c.lng}, '${c.cc}'),`).join('\n')}
]

/** Merge with inventory + WORLD_PLACES (inventory wins on slug clash). */
export function buildMapCities(inventory: MapCity[]): MapCity[] {
  const seen = new Set(inventory.map(c => c.slug))
  return [
    ...inventory,
    ...GEONAMES_CITIES.filter(c => !seen.has(c.slug))
  ]
}
`

writeFileSync(OUT, ts)
console.log(`Written ${OUT} (${unique.length} cities)`)