/**
 * SIVRCE — Landmark building catalog (map + SEO).
 * Street landmarks stay hand-curated; every Tbilisi project becomes a building.
 * ponytail: derive from PROJECTS — one source for photo / coords / copy.
 */

import { LISTINGS, type DealType, type Listing } from './listings'
import { geoRaionsOf } from './georgia-locations'
import { TBILISI_QUARTERS } from './tbilisi-quarters'
import {
  PROJECTS,
  getDeveloper,
  projectCode,
  type LocalText,
  type Project,
} from './professionals'

export type BuildingCatalogEntry = {
  /** URL slug */
  slug: string
  /** Unique public code — SEO / admin ID; UI shows human `name` first */
  code: string
  name: string
  nameEn: string
  address: string
  city: string
  district: string
  /** Microdistrict / ubani when the address names one (ლისი, დიდი დიღომი, …). */
  ubani?: string
  coords: { lat: number; lng: number }
  buildingNumber: string
  img: string
  gallery?: string[]
  passportUrl?: string
  developerSlug: string
  yearBuilt?: number
  floors: number
  units?: number
  rating: number
  description: LocalText
  /** Optional link to /projects/[slug] */
  projectSlug?: string
  status: 'ready' | 'construction'
  priceFromM2?: string
  finish?: string
}

/** Address-level landmarks that are not (or not only) a PROJECTS slug. */
const STREET_LANDMARKS: BuildingCatalogEntry[] = [
  {
    slug: 'axis-towers',
    code: 'SV-TB-0001',
    name: 'აქსის თაუერსი',
    nameEn: 'Axis Towers',
    address: 'ილია ჭავჭავაძის გამზ. 37მ, ვაკე, თბილისი',
    city: 'თბილისი',
    district: 'ვაკე',
    coords: { lat: 41.71174204, lng: 44.75668685 },
    buildingNumber: '37',
    img: '/images/projects/axis-towers-photo.webp',
    developerSlug: 'axis',
    yearBuilt: 2018,
    floors: 24,
    units: 150,
    rating: 4.8,
    projectSlug: 'axis-towers',
    status: 'ready',
    description: {
      ka: 'აქსის თაუერსი — ჭავჭავაძის 37, ვაკე. ორი კოშკი, 24 სართ., მიწისქვეშა პარკინგი, კომერციული სარდაფი. ხედი ვაკის პარკისა და ცენტრისკენ.',
      en: 'Axis Towers — Chavchavadze 37, Vake. Twin 24-floor towers, underground parking, retail podium. Views toward Vake Park and the centre.',
      ru: 'Axis Towers — Чавчавадзе 37, Ваке. Две башни, 24 этажа, подземный паркинг, коммерческий стилобат.',
    },
  },
  {
    slug: 'king-david-residences',
    code: 'SV-TB-0002',
    name: 'ქინგ დევიდ რეზიდენსი',
    nameEn: 'King David Residences',
    address: 'გიორგი ათონელის ქ. 12, მთაწმინდა, თბილისი',
    city: 'თბილისი',
    district: 'მთაწმინდა',
    coords: { lat: 41.6975188, lng: 44.8047485 },
    buildingNumber: '12',
    img: '/images/projects/king-david-residences.webp',
    developerSlug: 'king-david',
    yearBuilt: 2016,
    floors: 18,
    units: 120,
    rating: 4.9,
    status: 'ready',
    description: {
      ka: 'ქინგ დევიდ რეზიდენსი — გიორგი ათონელის 12, მთაწმინდა. 18 სართ., კონსიერჟი, პარკინგი. ხედი ძველ თბილისზე და მთაწმინდაზე.',
      en: 'King David Residences — 12 Giorgi Atoneli St, Mtatsminda. 18 floors, concierge, parking. Old Tbilisi and Mtatsminda views.',
      ru: 'King David Residences — Атонели 12, Мтацминда. 18 этажей, консьерж, паркинг.',
    },
  },
  {
    slug: 'pekin-12',
    code: 'SV-TB-0006',
    name: 'პეკინის 12',
    nameEn: 'Pekin 12',
    address: 'პეკინის გამზ. 12, საბურთალო, თბილისი',
    city: 'თბილისი',
    district: 'საბურთალო',
    coords: { lat: 41.7207945, lng: 44.7748721 },
    buildingNumber: '12',
    img: '/images/projects/pekin-12.webp',
    developerSlug: 'm2-development',
    yearBuilt: 2021,
    floors: 22,
    units: 90,
    rating: 4.7,
    status: 'ready',
    description: {
      ka: 'პეკინის 12 — საბურთალო. 22 სართ., პენტჰაუსები ზედა სართულებზე.',
      en: 'Pekin 12 — Saburtalo. 22 floors, penthouses on the upper levels.',
      ru: 'Пекин 12 — Сабуртало. 22 этажа, пентхаусы на верхних этажах.',
    },
  },
  {
    slug: 'chavchavadze-47',
    code: 'SV-TB-0007',
    name: 'ჭავჭავაძის 47',
    nameEn: 'Chavchavadze 47',
    address: 'ილია ჭავჭავაძის გამზ. 47, ვაკე, თბილისი',
    city: 'თბილისი',
    district: 'ვაკე',
    coords: { lat: 41.711826, lng: 44.747685 },
    buildingNumber: '47',
    img: '/images/projects/axis-chavchavadze-49.webp',
    developerSlug: 'axis',
    yearBuilt: 2019,
    floors: 18,
    units: 80,
    rating: 4.6,
    status: 'ready',
    description: {
      ka: 'ჭავჭავაძის 47 — ვაკე, 18 სართ. ღია ხედი გამზირზე.',
      en: 'Chavchavadze 47 — Vake, 18 floors. Open view onto the avenue.',
      ru: 'Чавчавадзе 47 — Ваке, 18 этажей. Вид на проспект.',
    },
  },
  {
    slug: 'orbi-sea-towers',
    code: 'SV-BT-0001',
    name: 'ORBI Sea Towers',
    nameEn: 'ORBI Sea Towers',
    address: 'შერიფ ხიმშიაშვილის ქ. 15ბ, ახალი ბულვარი, ბათუმი',
    city: 'ბათუმი',
    district: 'ახალი ბულვარი',
    coords: { lat: 41.637316, lng: 41.610282 },
    buildingNumber: '—',
    img: '/images/projects/orbi-sea-towers.webp',
    developerSlug: 'orbi-group',
    floors: 32,
    units: 320,
    rating: 4.7,
    projectSlug: 'orbi-sea-towers',
    status: 'construction',
    description: {
      ka: 'ORBI Sea Towers — ახალი ბულვარი, ბათუმი. 32 სართ., სასტუმრო-საცხოვრებელი. მართვის კომპანია.',
      en: 'ORBI Sea Towers — New Boulevard, Batumi. 32 floors, hotel-residential. In-house management.',
      ru: 'ORBI Sea Towers — Новый бульвар, Батуми. 32 этажа, гостинично-жилой. Управляющая компания.',
    },
  },
  {
    slug: 'batumi-riviera-tower',
    code: 'SV-BT-0002',
    name: 'Batumi Riviera Tower',
    nameEn: 'Batumi Riviera Tower',
    address: 'ზღვისპირის ქ. 1ბ, ახალი ბულვარი, ბათუმი',
    city: 'ბათუმი',
    district: 'ახალი ბულვარი',
    coords: { lat: 41.6219567, lng: 41.5967227 },
    buildingNumber: '—',
    img: '/images/projects/batumi-riviera-tower.webp',
    developerSlug: 'alliance-group',
    floors: 28,
    units: 168,
    rating: 4.9,
    projectSlug: 'batumi-riviera-tower',
    status: 'construction',
    description: {
      ka: 'Batumi Riviera Tower — ახალი ბულვარი. 28 სართ., ზღვის ხედი.',
      en: 'Batumi Riviera Tower — New Boulevard. 28 floors, sea view.',
      ru: 'Batumi Riviera Tower — Новый бульвар. 28 этажей, вид на море.',
    },
  },
  {
    slug: 'gorgiladze-50',
    code: 'SV-BT-0003',
    name: 'გორგილაძის 50',
    nameEn: 'Gorgiladze 50',
    address: 'ზურაბ გორგილაძის ქ. 50, ბათუმი',
    city: 'ბათუმი',
    district: 'ბათუმი',
    coords: { lat: 41.645471, lng: 41.626121 },
    buildingNumber: '50',
    img: '/images/projects/gorgiladze-50.webp',
    developerSlug: 'alliance-group',
    yearBuilt: 2020,
    floors: 16,
    units: 64,
    rating: 4.5,
    status: 'ready',
    description: {
      ka: 'გორგილაძის 50 — ბათუმის ცენტრი. 16 სართ. ზღვამდე დაახლოებით 5 წუთი.',
      en: 'Gorgiladze 50 — Batumi centre. 16 floors. About five minutes to the sea.',
      ru: 'Горгиладзе 50 — центр Батуми. 16 этажей. Около 5 минут до моря.',
    },
  },
  {
    slug: 'abashidze-34',
    code: 'SV-TB-0008',
    name: 'აბაშიძის 34',
    nameEn: 'Abashidze 34',
    address: 'ირაკლი აბაშიძის ქ. 34, ვაკე, თბილისი',
    city: 'თბილისი',
    district: 'ვაკე',
    coords: { lat: 41.7074417, lng: 44.765686 },
    buildingNumber: '34',
    img: '/images/projects/abashidze-34.webp',
    developerSlug: 'archi',
    yearBuilt: 2015,
    floors: 12,
    units: 48,
    rating: 4.4,
    status: 'ready',
    description: {
      ka: 'აბაშიძის 34 — ვაკე. 12 სართ., ჩაბარება 2015.',
      en: 'Abashidze 34 — Vake. 12 floors, completed 2015.',
      ru: 'Абашидзе 34 — Ваке. 12 этажей, сдан в 2015.',
    },
  },
  {
    slug: 'nutsubidze-77',
    code: 'SV-TB-0009',
    name: 'ნუცუბიძის 77',
    nameEn: 'Nutsubidze 77',
    address: 'ნუცუბიძის 77, საბურთალო, თბილისი',
    city: 'თბილისი',
    district: 'საბურთალო',
    coords: { lat: 41.7339672, lng: 44.7378309 },
    buildingNumber: '77',
    img: '/images/projects/archi-nutsubidze.webp',
    developerSlug: 'archi',
    yearBuilt: 2017,
    floors: 14,
    units: 70,
    rating: 4.3,
    status: 'ready',
    description: {
      ka: 'ნუცუბიძის 77 — საბურთალოს პლატო. 14 სართ., ჩაბარება 2017.',
      en: 'Nutsubidze 77 — Saburtalo plateau. 14 floors, completed 2017.',
      ru: 'Нуцубидзе 77 — плато Сабуртало. 14 этажей, сдан в 2017.',
    },
  },
]

/** SEO alias — same pin as axis-towers; do not double-list. */
const PROJECT_SLUG_ALIASES = new Set(['axis-towers-vake'])

const STREET_HINT =
  /(?:\bst\.?\b|\bstreet\b|\bave\b|\bavenue\b|\bline\b|ქ\.|ქუჩ|გამზ|შესახვ|ხეივან)/i
const HOUSE_NO = /^[\d]+[a-zA-Zა-ჰ]?(?:-[\d]+[a-zA-Zა-ჰ]?)*$/

function districtFrom(location: string, city: string): string {
  const parts = location
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length && parts[parts.length - 1] === city) parts.pop()
  while (parts.length && HOUSE_NO.test(parts[parts.length - 1]!)) parts.pop()
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]!
    if (!STREET_HINT.test(p) && !/\d/.test(p)) return p
  }
  return city
}

/** Official raion → ubani for Tbilisi; longest ubani name wins. */
const TB_RAIONS = geoRaionsOf('თბილისი')
const TB_UBANI_TO_RAION: Record<string, string> = {}
for (const [raion, list] of Object.entries(TB_RAIONS)) {
  for (const u of list) TB_UBANI_TO_RAION[u] = raion
}
const TB_UBANI = Object.keys(TB_UBANI_TO_RAION).sort((a, b) => b.length - a.length)
const TB_RAION_SET = new Set(Object.keys(TB_RAIONS))

function locationHasName(location: string, city: string, name: string): boolean {
  return location
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== city)
    .some((p) => p === name || p.includes(name))
}

function quarterUbani(location: string, city: string): string | undefined {
  let best: string | undefined
  let bestLen = 0
  for (const q of TBILISI_QUARTERS) {
    if (locationHasName(location, city, q.ka) && q.ka.length > bestLen) {
      best = q.district
      bestLen = q.ka.length
    }
  }
  return best
}

const EXTRA_PLACE: Record<string, { district: string; ubani?: string }> = {
  თაბახმელა: { district: 'მთაწმინდა', ubani: 'ტაბახმელა' },
  ტაბახმელა: { district: 'მთაწმინდა', ubani: 'ტაბახმელა' },
  ჯიქია: { district: 'საბურთალო' },
  'კრწანისის პარკი / მტკვრის ნაპირი': { district: 'კრწანისი' },
}

const SLUG_PLACE: [RegExp, string, string?][] = [
  [/lisi/, 'საბურთალო', 'ლისი'],
  [/dighomi|digomi/, 'საბურთალო', 'დიღომი'],
  [/nutsubidze/, 'საბურთალო', 'ნუცუბიძის ფერდობი'],
  [/ortachala/, 'კრწანისი', 'ორთაჭალა'],
  [/saburtalo|mindeli|tamarashvili|holbrooke|barcelo/, 'საბურთალო'],
  [/vake|mziuri/, 'ვაკე'],
  [/isani|omnia/, 'ისანი'],
  [/gldani/, 'გლდანი'],
  [/varketili/, 'სამგორი', 'ვარკეთილი'],
  [/avlabari/, 'ისანი', 'ავლაბარი'],
  [/didube/, 'დიდუბე'],
  [/mtatsminda/, 'მთაწმინდა'],
  [/krtsanisi|gorgasali|waterfront|horizon|oriental|riverfront/, 'კრწანისი'],
  [/jikia/, 'საბურთალო'],
  [/central-park/, 'საბურთალო'],
  [/rivertown/, 'ჩუღურეთი'],
  [/kavtaradze/, 'საბურთალო'],
  [/gagarin/, 'გლდანი'],
  [/apex-towers/, 'საბურთალო', 'დიდი დიღომი'],
  [/axis-palace/, 'საბურთალო'],
]

function hintFromSlug(slug: string): { district: string; ubani?: string } | undefined {
  // ponytail: "lisi" is a substring of "tbilisi" — strip the city token first.
  const s = slug.replaceAll('tbilisi', '')
  for (const [re, district, ubani] of SLUG_PLACE) {
    if (re.test(s)) return ubani ? { district, ubani } : { district }
  }
  return undefined
}

function placeFrom(
  location: string,
  city: string,
  slug?: string,
): { district: string; ubani?: string } {
  let district = districtFrom(location, city)
  if (city !== 'თბილისი') return { district }

  const extra = EXTRA_PLACE[district]
  if (extra) return extra

  const ubani =
    TB_UBANI.find((n) => locationHasName(location, city, n)) ?? quarterUbani(location, city)
  if (ubani) {
    const raion = TB_UBANI_TO_RAION[ubani] ?? (TB_RAION_SET.has(district) ? district : undefined)
    if (raion && (district === ubani || district === city || !TB_RAION_SET.has(district))) {
      district = raion
    }
    return { district, ubani: ubani === district ? undefined : ubani }
  }
  if (TB_RAION_SET.has(district)) return { district }

  const hinted = slug ? hintFromSlug(slug) : undefined
  if (hinted) return hinted
  return { district }
}

function yearBuiltFrom(p: Project): number | undefined {
  if (p.done < 100) return undefined
  const m = p.finish.match(/20\d{2}/)
  return m ? Number(m[0]) : undefined
}

function buildingNumberFrom(location: string): string {
  const head = location.split(',')[0] ?? location
  const m = head.match(/(\d+[a-zA-Zა-ჰ]?)\s*$/)
  return m?.[1] ?? '—'
}

function projectToBuilding(p: Project): BuildingCatalogEntry {
  const floors = Math.min(100, p.floors ?? Math.max(8, Math.round(p.flats / 12)))
  const { district, ubani } = placeFrom(p.location, p.city, p.slug)
  return {
    slug: p.slug,
    code: projectCode(p),
    name: p.name,
    nameEn: p.name,
    address: p.location,
    city: p.city,
    district,
    ubani,
    coords: p.coords,
    buildingNumber: buildingNumberFrom(p.location),
    img: p.img,
    gallery: p.gallery,
    passportUrl: p.passportUrl,
    developerSlug: p.developerSlug,
    yearBuilt: yearBuiltFrom(p),
    floors,
    units: p.flats,
    rating: p.rating,
    description: p.description,
    projectSlug: p.slug,
    status: p.done >= 100 ? 'ready' : 'construction',
    priceFromM2: p.priceFromM2,
    finish: p.finish,
  }
}

function enrichPlace(b: BuildingCatalogEntry): BuildingCatalogEntry {
  if (b.ubani) return b
  const { district, ubani } = placeFrom(b.address, b.city, b.slug)
  return {
    ...b,
    district: TB_RAION_SET.has(b.district) ? b.district : district,
    ubani,
  }
}

function buildCatalog(): BuildingCatalogEntry[] {
  const taken = new Set(STREET_LANDMARKS.map((b) => b.slug))
  for (const b of STREET_LANDMARKS) {
    if (b.projectSlug) taken.add(b.projectSlug)
  }
  for (const alias of PROJECT_SLUG_ALIASES) taken.add(alias)

  const fromProjects = PROJECTS.filter(
    (p) =>
      p.city === 'თბილისი' &&
      Number.isFinite(p.coords.lat) &&
      Number.isFinite(p.coords.lng) &&
      !taken.has(p.slug),
  ).map(projectToBuilding)

  // Street first (stable SV-* codes), then Tbilisi projects A→Z by name.
  return [
    ...STREET_LANDMARKS.map(enrichPlace),
    ...fromProjects.sort((a, b) => a.name.localeCompare(b.name, 'ka')),
  ]
}

export const BUILDINGS: BuildingCatalogEntry[] = buildCatalog()

export function getBuilding(slug: string): BuildingCatalogEntry | undefined {
  return BUILDINGS.find((b) => b.slug === slug)
}

export function getBuildingByCode(code: string): BuildingCatalogEntry | undefined {
  return BUILDINGS.find((b) => b.code.toUpperCase() === code.toUpperCase())
}

export function listingsForBuilding(slug: string): Listing[] {
  return LISTINGS.filter((l) => l.buildingSlug === slug)
}

export function buildingDealCounts(slug: string): Record<DealType, number> {
  const counts: Record<DealType, number> = { sale: 0, rent: 0, daily: 0, pledge: 0 }
  for (const l of listingsForBuilding(slug)) counts[l.dealType]++
  return counts
}

export function buildingDeveloperName(slug: string): string | undefined {
  const b = getBuilding(slug)
  if (!b) return undefined
  return getDeveloper(b.developerSlug)?.name.ka
}

export function relatedBuildings(slug: string, limit = 6): BuildingCatalogEntry[] {
  const me = getBuilding(slug)
  if (!me) return []
  const same = BUILDINGS.filter(
    (b) => b.slug !== slug && b.city === me.city && b.district === me.district,
  ).sort((a, b) => b.rating - a.rating)
  if (same.length >= 3) return same.slice(0, limit)
  const fill = BUILDINGS.filter(
    (b) => b.slug !== slug && b.city === me.city && !same.some((x) => x.slug === b.slug),
  ).sort((a, b) => b.rating - a.rating)
  return [...same, ...fill].slice(0, limit)
}
