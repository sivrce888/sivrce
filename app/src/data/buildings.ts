/**
 * SIVRCE — Landmark building catalog (map + SEO).
 * Unique code + coords + card meta. Listings attach via `buildingSlug`.
 * ponytail: static catalog; MapBuilding/Building3D DB when curation UI exists.
 */

import { LISTINGS, type DealType, type Listing } from './listings'
import { getDeveloper, type LocalText } from './professionals'

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
  coords: { lat: number; lng: number }
  buildingNumber: string
  img: string
  developerSlug: string
  yearBuilt?: number
  floors: number
  units?: number
  rating: number
  description: LocalText
  /** Optional link to /projects/[slug] */
  projectSlug?: string
  status: 'ready' | 'construction'
}

export const BUILDINGS: BuildingCatalogEntry[] = [
  {
    slug: 'axis-towers',
    code: 'SV-TB-0001',
    name: 'აქსის თაუერსი',
    nameEn: 'Axis Towers',
    address: 'ჩავჭავაძის გამზ. 37, ვაკე, თბილისი',
    city: 'თბილისი',
    district: 'ვაკე',
    coords: { lat: 41.7088, lng: 44.7732 },
    buildingNumber: '37',
    img: '/images/p2.webp',
    developerSlug: 'axis',
    yearBuilt: 2018,
    floors: 24,
    units: 150,
    rating: 4.8,
    projectSlug: 'axis-towers-vake',
    status: 'ready',
    description: {
      ka: 'აქსის თაუერსი — ჩავჭავაძის 37, ვაკე. ორი კოშკი, 24 სართ., მიწისქვეშა პარკინგი, კომერციული სარდაფი. ხედი ვაკის პარკისა და ცენტრისკენ.',
      en: 'Axis Towers — Chavchavadze 37, Vake. Twin 24-floor towers, underground parking, retail podium. Views toward Vake Park and the centre.',
      ru: 'Axis Towers — Чавчавадзе 37, Ваке. Две башни, 24 этажа, подземный паркинг, коммерческий стилобат.',
    },
  },
  {
    slug: 'king-david-residences',
    code: 'SV-TB-0002',
    name: 'ქინგ დევიდ რეზიდენსი',
    nameEn: 'King David Residences',
    address: 'ატონელის 12, მთაწმინდა, თბილისი',
    city: 'თბილისი',
    district: 'მთაწმინდა',
    coords: { lat: 41.7008, lng: 44.7912 },
    buildingNumber: '12',
    img: '/images/p1.webp',
    developerSlug: 'king-david',
    yearBuilt: 2016,
    floors: 18,
    units: 120,
    rating: 4.9,
    status: 'ready',
    description: {
      ka: 'ქინგ დევიდ რეზიდენსი — ატონელის 12, მთაწმინდა. 18 სართ., კონსიერჟი, პარკინგი. ხედი ძველ თბილისზე და მთაწმინდაზე.',
      en: 'King David Residences — Atoneli 12, Mtatsminda. 18 floors, concierge, parking. Old Tbilisi and Mtatsminda views.',
      ru: 'King David Residences — Атонели 12, Мтацминда. 18 этажей, консьерж, паркинг.',
    },
  },
  {
    slug: 'downtown-residence',
    code: 'SV-TB-0003',
    name: 'Downtown Residence',
    nameEn: 'Downtown Residence',
    address: 'საბურთალო, თბილისი',
    city: 'თბილისი',
    district: 'საბურთალო',
    coords: { lat: 41.7218, lng: 44.7526 },
    buildingNumber: '—',
    img: '/images/np1.webp',
    developerSlug: 'm2-development',
    floors: 22,
    units: 214,
    rating: 4.8,
    projectSlug: 'downtown-residence',
    status: 'construction',
    description: {
      ka: 'Downtown Residence — საბურთალო, m2. მშენებარე, 22 სართ. დახურული ეზო, ფიტნესი, კონსიერჟი, მიწისქვეშა პარკინგი.',
      en: 'Downtown Residence — Saburtalo, m2. Under construction, 22 floors. Courtyard, fitness, concierge, underground parking.',
      ru: 'Downtown Residence — Сабуртало, m2. Строится, 22 этажа. Двор, фитнес, консьерж, подземный паркинг.',
    },
  },
  {
    slug: 'dirsi-riverside',
    code: 'SV-TB-0004',
    name: 'დირსი რივერსაიდი',
    nameEn: 'Dirsi Riverside',
    address: 'ისანი, თბილისი',
    city: 'თბილისი',
    district: 'ისანი',
    coords: { lat: 41.6884, lng: 44.8452 },
    buildingNumber: '—',
    img: '/images/p3.webp',
    developerSlug: 'dirsi',
    floors: 18,
    units: 540,
    rating: 4.6,
    projectSlug: 'dirsi-riverside',
    status: 'construction',
    description: {
      ka: 'დირსი რივერსაიდი — ისანი, მტკვრის ნაპირი. 540 ბინა, სკვერი, სკოლა, სავაჭრო ქუჩა.',
      en: 'Dirsi Riverside — Isani, Mtkvari bank. 540 units, park, school, retail street.',
      ru: 'Dirsi Riverside — Исани, берег Куры. 540 квартир, сквер, школа, торговая улица.',
    },
  },
  {
    slug: 'archi-dighomi',
    code: 'SV-TB-0005',
    name: 'არქი დიღომი',
    nameEn: 'Archi Dighomi',
    address: 'დიღომი, თბილისი',
    city: 'თბილისი',
    district: 'დიღომი',
    coords: { lat: 41.7812, lng: 44.7815 },
    buildingNumber: '—',
    img: '/images/p4.webp',
    developerSlug: 'archi',
    floors: 16,
    units: 260,
    rating: 4.7,
    projectSlug: 'archi-dighomi',
    status: 'construction',
    description: {
      ka: 'არქი დიღომი — დიღომი. 16 სართ., ენერგოეფექტური ფასადი. განვადება დეველოპერისგან.',
      en: 'Archi Dighomi — Dighomi. 16 floors, energy-efficient façade. Developer instalments available.',
      ru: 'Archi Dighomi — Дигоми. 16 этажей, энергоэффективный фасад. Рассрочка от застройщика.',
    },
  },
  {
    slug: 'pekin-12',
    code: 'SV-TB-0006',
    name: 'პეკინის 12',
    nameEn: 'Pekin 12',
    address: 'პეკინის 12, საბურთალო, თბილისი',
    city: 'თბილისი',
    district: 'საბურთალო',
    coords: { lat: 41.7225, lng: 44.7619 },
    buildingNumber: '12',
    img: '/images/p2.webp',
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
    name: 'ჩავჭავაძის 47',
    nameEn: 'Chavchavadze 47',
    address: 'ჩავჭავაძის 47, ვაკე, თბილისი',
    city: 'თბილისი',
    district: 'ვაკე',
    coords: { lat: 41.7055, lng: 44.7708 },
    buildingNumber: '47',
    img: '/images/p1.webp',
    developerSlug: 'axis',
    yearBuilt: 2019,
    floors: 18,
    units: 80,
    rating: 4.6,
    status: 'ready',
    description: {
      ka: 'ჩავჭავაძის 47 — ვაკე, 18 სართ. ღია ხედი გამზირზე.',
      en: 'Chavchavadze 47 — Vake, 18 floors. Open view onto the avenue.',
      ru: 'Чавчавадзе 47 — Ваке, 18 этажей. Вид на проспект.',
    },
  },
  {
    slug: 'orbi-sea-towers',
    code: 'SV-BT-0001',
    name: 'ORBI Sea Towers',
    nameEn: 'ORBI Sea Towers',
    address: 'ახალი ბულვარი, ბათუმი',
    city: 'ბათუმი',
    district: 'ახალი ბულვარი',
    coords: { lat: 41.6482, lng: 41.6348 },
    buildingNumber: '—',
    img: '/images/p5.webp',
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
    address: 'ახალი ბულვარი, ბათუმი',
    city: 'ბათუმი',
    district: 'ახალი ბულვარი',
    coords: { lat: 41.6508, lng: 41.6362 },
    buildingNumber: '—',
    img: '/images/np2.webp',
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
    address: 'გორგილაძის 50, ბათუმი',
    city: 'ბათუმი',
    district: 'ბათუმი',
    coords: { lat: 41.6481, lng: 41.6371 },
    buildingNumber: '50',
    img: '/images/p5.webp',
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
    address: 'აბაშიძის 34, ვაკე, თბილისი',
    city: 'თბილისი',
    district: 'ვაკე',
    coords: { lat: 41.7078, lng: 44.7644 },
    buildingNumber: '34',
    img: '/images/p6.webp',
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
    coords: { lat: 41.7344, lng: 44.7381 },
    buildingNumber: '77',
    img: '/images/p4.webp',
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
