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
  /** Unique public code — always shown on map/card/SEO */
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
      ka: 'აქსის თაუერსი — ვაკის ღირსშესანიშნაობა ჩავჭავაძის გამზირზე. პრემიუმ კოშკები მიწისქვეშა პარკინგით, კომერციული სარდაფითა და ქალაქის საუკეთესო ხედებით. აქ იყიდება, ქირავდება და დღიურადაც არის ბინები.',
      en: 'Axis Towers is Vake’s landmark on Chavchavadze Avenue — premium towers with underground parking, a retail podium and top city views. Sale, rent and daily units available.',
      ru: 'Axis Towers — достопримечательность Ваке на проспекте Чавчавадзе: премиальные башни с подземным паркингом и лучшими видами. Продажа, аренда и посуточно.',
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
      ka: 'ქინგ დევიდ რეზიდენსი — მთაწმინდის პრემიუმ კომპლექსი სასტუმრო სერვისით, კონსიერჟითა და პანორამული ხედებით ძველ თბილისზე. ერთ-ერთი ყველაზე ცნობილი მისამართი ქალაქში.',
      en: 'King David Residences is a Mtatsminda premium complex with hotel-grade service, concierge and panoramic Old Tbilisi views — one of the city’s best-known addresses.',
      ru: 'King David Residences — премиальный комплекс на Мтацминде с гостиничным сервисом и панорамой на Старый Тбилиси.',
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
      ka: 'Downtown Residence — m2-ის პრემიუმ მშენებარე კომპლექსი საბურთალოზე: დაცული ეზო, ფიტნესი, კონსიერჟი და მიწისქვეშა პარკინგი.',
      en: 'Downtown Residence is m2’s premium Saburtalo development: secured courtyard, fitness, concierge and underground parking.',
      ru: 'Downtown Residence — премиальный комплекс m2 в Сабуртало.',
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
      ka: 'დირსი რივერსაიდი — მტკვრის ნაპირის „ქალაქი ქალაქში“: სკვერები, სკოლა, სავაჭრო ქუჩა და საბავშვო ინფრასტრუქტურა.',
      en: 'Dirsi Riverside is a Mtkvari riverside “city within a city” with parks, school and retail street.',
      ru: 'Dirsi Riverside — «город в городе» на берегу Куры.',
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
      ka: 'არქი დიღომი — ხელმისაწვდომი ფასის კომპლექსი დიღომში, ენერგოეფექტური ფასადითა და შიდა განვადებით.',
      en: 'Archi Dighomi is an affordable Dighomi complex with energy-efficient façade and in-house instalments.',
      ru: 'Archi Dighomi — доступный комплекс в Дигоми.',
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
      ka: 'პეკინის 12 — საბურთალოს მაღალსართულიანი კორპუსი პენტჰაუსებითა და ქალაქის ხედებით. აქ იყიდება და ქირავდება ბინები.',
      en: 'Pekin 12 is a Saburtalo high-rise with penthouses and city views — sale and rent available.',
      ru: 'Пекин 12 — высотка в Сабуртало с пентхаусами.',
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
      ka: 'ჩავჭავაძის 47 — ვაკის პრემიუმ კორპუსი ჩავჭავაძის გამზირზე. პანორამული ბინები იყიდება და ქირავდება.',
      en: 'Chavchavadze 47 is a Vake premium building on the avenue — panoramic flats for sale and rent.',
      ru: 'Чавчавадзе 47 — премиальный дом в Ваке.',
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
      ka: 'ORBI Sea Towers — სასტუმრო-საცხოვრებელი კომპლექსი ზღვისპირა ზონაში, მართვის კომპანიითა და საინვესტიციო პროგრამით.',
      en: 'ORBI Sea Towers is a seaside hotel-residential complex with management and investor programs.',
      ru: 'ORBI Sea Towers — гостинично-жилой комплекс у моря.',
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
      ka: 'Batumi Riviera Tower — ზღვის პირველი ხაზის მაღალსართულიანი კომპლექსი ახალ ბულვარზე, პანორამული ხედებით.',
      en: 'Batumi Riviera Tower is a first-line high-rise on the New Boulevard with panoramic sea views.',
      ru: 'Batumi Riviera Tower — высотка на первой линии Нового бульвара.',
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
      ka: 'გორგილაძის 50 — ბათუმის ცენტრალური კორპუსი ქირავდება და დღიურად. ახლოს ზღვა და ბულვარი.',
      en: 'Gorgiladze 50 is a central Batumi building for rent and daily stays — near the sea and boulevard.',
      ru: 'Горгиладзе 50 — центральный дом в Батуми.',
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
      ka: 'აბაშიძის 34 — ვაკის საცხოვრებელი კორპუსი. იყიდება, ქირავდება და გირავდება ბინები ამ მისამართზე.',
      en: 'Abashidze 34 is a Vake residential building — sale, rent and pledge listings at this address.',
      ru: 'Абашидзе 34 — жилой дом в Ваке.',
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
      ka: 'ნუცუბიძის 77 — საბურთალოს პლატოს კორპუსი. ოჯახური ბინები იყიდება და ქირავდება.',
      en: 'Nutsubidze 77 is a Saburtalo plateau building — family flats for sale and rent.',
      ru: 'Нуцубидзе 77 — дом на плато Сабуртало.',
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
