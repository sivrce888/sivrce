/**
 * Self-check: villages catalog integrity + suggest wiring.
 * Run: npx tsx src/data/georgia-villages.check.ts
 */
import { villagesOf, allVillages, VILLAGE_COUNT } from './georgia-villages'
import { GEO_MUNICIPALITIES, GEO_CITIES } from './georgia-locations'

// Coverage canon
const villageMunis = allVillages().reduce((m, v) => m.add(v.muni), new Set<string>())
for (const m of villageMunis) {
  if (!GEO_MUNICIPALITIES.includes(m)) throw new Error(`village parent not a catalog muni: ${m}`)
}

// Zemo Nichbisi — the canonical regression: Mtskheta muni, not a city.
const mtskheta = villagesOf('მცხეთის მუნიციპალიტეტი')
if (!mtskheta.includes('ზემო ნიჩბისი')) throw new Error('ზემო ნიჩბისი missing from მცხეთის მუნიციპალიტეტი')

// Canon towns + EXTRAS canon (sources miss these; hand-verified).
// სტეფანწმინდა deliberately NOT a city — it aliases ყაზბეგი (route.check guards resolution).
for (const c of ['ქედა', 'ჩოხატაური', 'ხულო', 'პასანაური']) {
  if (!GEO_CITIES.includes(c)) throw new Error(`canon town missing from cities: ${c}`)
}
if (GEO_CITIES.includes('სტეფანწმინდა')) throw new Error('სტეფანწმინდა listed as city — duplicates ყაზბეგი')
if (!villagesOf('ყაზბეგის მუნიციპალიტეტი').includes('გერგეტი')) throw new Error('გერგეტი missing')
// Baghdati polygon was skipped for months (garbage name:ka) — its OSM top-up must stay.
if (villagesOf('ბაღდათის მუნიციპალიტეტი').length < 25) throw new Error('ბაღდათი top-up lost')
// place=town re-sync silently dropped these (EXTRA_VILLAGES canon in sync-villages.py) —
// a source flake must never delete real settlements again.
const VILLAGE_CANON: Record<string, string[]> = {
  'ამბროლაურის მუნიციპალიტეტი': ['გოგოლათი'],
  'კასპის მუნიციპალიტეტი': ['ზადიაანთკარი'],
  'ქარელის მუნიციპალიტეტი': ['ლოშკინეთი'],
  'ხარაგაულის მუნიციპალიტეტი': ['უბისი'],
  'ხონის მუნიციპალიტეტი': ['ნამაშევი', 'ჩაის მეურნეობა'],
}
for (const [m, names] of Object.entries(VILLAGE_CANON)) {
  const list = villagesOf(m)
  for (const n of names) if (!list.includes(n)) throw new Error(`canon village lost: ${n} (${m})`)
}

// No village shadows a city name; no empty or whitespace entries; per-muni dedupe.
const cities = new Set(GEO_CITIES)
for (const v of allVillages()) {
  if (!v.ka.trim()) throw new Error('empty village name')
  if (cities.has(v.ka)) throw new Error(`village duplicates a city: ${v.ka}`)
}
const senaki = villagesOf('სენაკის რაიონი')
if (new Set(senaki).size !== senaki.length) throw new Error('duplicate villages in სენაკის რაიონი')
if (senaki.length < 50) throw new Error(`Senaki sparse (${senaki.length}) — SS/OSM top-up lost`)

// Sorted, so binary-searchable pages stay deterministic.
for (const [m, list] of Object.entries({ 'მცხეთის მუნიციპალიტეტი': mtskheta })) {
  const sorted = [...list].sort((a, b) => a.localeCompare(b, 'ka'))
  if (JSON.stringify(sorted) !== JSON.stringify(list)) throw new Error(`${m} not ka-sorted`)
}

if (VILLAGE_COUNT < 4000) throw new Error(`village count dropped: ${VILLAGE_COUNT}`)
console.log(`georgia-villages ok: ${VILLAGE_COUNT} villages across ${villageMunis.size} munis`)
