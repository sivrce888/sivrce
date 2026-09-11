/**
 * Light geo/label registry for CLIENT components — no catalog imports
 * (data/listings, data/professionals, seo-pages heavy graph stay server-only).
 * seo-pages.ts and directory-seo.ts re-export these for server callers.
 */

import { ruPlural, type Lang } from '@/lib/i18n/core'

export type DirLoc = 'ka' | 'en' | 'ru'

/** ka/ru have real directory copy; every other locale reads English. */
export function dirLoc(lang: Lang): DirLoc {
  return lang === 'ka' || lang === 'ru' ? lang : 'en'
}

/** Data-level 'price on request' marker the DE catalog stores in priceFromM2. */
export const ON_REQUEST = 'მოთხოვნით'

/** priceFromM2 for display: the on-request marker renders localized, real prices pass through. */
export function priceFromLabel(v: string, loc: DirLoc): string {
  if (v !== ON_REQUEST) return v
  return loc === 'ru' ? 'По запросу' : loc === 'en' ? 'On request' : v
}

/** True when priceFromM2 carries a usable number — marker/empty mean no published price. */
export function hasPriceFrom(v: string): boolean {
  return v !== '' && v !== ON_REQUEST
}

/** Server-side LocalText/LocalName picker (entities/i18n pick() is a client module).
 *  'de' is a data-level loc: German DE-catalog copy falls back to en (UI chrome stays en). */
export function pickLoc(text: { ka: string; en: string; ru: string; de?: string }, loc: DirLoc | 'de'): string {
  if (loc === 'ka') return text.ka
  if (loc === 'ru') return text.ru
  if (loc === 'de') return text.de ?? text.en
  return text.en
}

/** 'ჩაბარებული (2019)' → 'Completed (2019)' / 'Сдан (2019)'; quarters pass through. */
export function finishLabel(loc: DirLoc, finish: string): string {
  if (!finish.startsWith('ჩაბარებული') && !finish.startsWith('გადაცემულია')) return finish
  const year = finish.match(/\((\d{4})\)/)?.[1]
  const base = loc === 'ka' ? 'ჩაბარებული' : loc === 'ru' ? 'Сдан' : 'Completed'
  return year ? `${base} (${year})` : base
}

/** ka locative ('თბილისში') / en 'in Tbilisi' / ru 'в Тбилиси'. */
export function cityIn(city: string, loc: DirLoc): string {
  const c = CITIES.find((c) => c.ka === city)
  if (!c) return loc === 'ka' ? `${city}ში` : loc === 'ru' ? `в ${city}` : `in ${city}`
  return loc === 'ka' ? c.loc : loc === 'ru' ? `в ${c.ru}` : `in ${c.en}`
}

/** '214 ბინა' / '214 flats' / '214 квартир'. */
export function unitsLabel(n: number, loc: DirLoc): string {
  if (loc === 'ka') return `${n} ბინა`
  if (loc === 'ru') return `${n} ${ruPlural(n, 'квартира', 'квартиры', 'квартир')}`
  return `${n} ${n === 1 ? 'flat' : 'flats'}`
}

/** '22 სართული' / '22 floors' / '22 этажа'. */
export function floorsLabel(n: number, loc: DirLoc): string {
  if (loc === 'ka') return `${n} სართული`
  if (loc === 'ru') return `${n} ${ruPlural(n, 'этаж', 'этажа', 'этажей')}`
  return `${n} ${n === 1 ? 'floor' : 'floors'}`
}

export interface GeoLoc {
  slug: string
  ka: string // nominative: თბილისი
  loc: string // locative for H1: თბილისში
  en: string
  ru: string
  /** Default ge. DE/AE cities are not Georgia sitemap URLs. */
  market?: 'ge' | 'de' | 'ae'
}

export function cityMarket(c: GeoLoc): 'ge' | 'de' | 'ae' {
  return c.market ?? 'ge'
}

export const CITIES: GeoLoc[] = [
  { slug: 'tbilisi', ka: 'თბილისი', loc: 'თბილისში', en: 'Tbilisi', ru: 'Тбилиси' },
  { slug: 'batumi', ka: 'ბათუმი', loc: 'ბათუმში', en: 'Batumi', ru: 'Батуми' },
  { slug: 'kutaisi', ka: 'ქუთაისი', loc: 'ქუთაისში', en: 'Kutaisi', ru: 'Кутаиси' },
  // ponytail: registered but inventory-light cities. Programmatic deal×type
  // pages self-throttle (≥1 listing rule) so they stay dark until listings
  // arrive; the city-info fallback below gives each a unique page today.
  { slug: 'rustavi', ka: 'რუსთავი', loc: 'რუსთავში', en: 'Rustavi', ru: 'Рустави' },
  { slug: 'poti', ka: 'ფოთი', loc: 'ფოთში', en: 'Poti', ru: 'Поти' },
  { slug: 'zugdidi', ka: 'ზუგდიდი', loc: 'ზუგდიდში', en: 'Zugdidi', ru: 'Зугдиди' },
  { slug: 'telavi', ka: 'თელავი', loc: 'თელავში', en: 'Telavi', ru: 'Телави' },
  { slug: 'gori', ka: 'გორი', loc: 'გორში', en: 'Gori', ru: 'Гори' },
  { slug: 'mtskheta', ka: 'მცხეთა', loc: 'მცხეთაში', en: 'Mtskheta', ru: 'Мцхета' },
  // Resort cities (myhome/ss popular row). Full municipality list lives in georgia-locations.json.
  { slug: 'bakuriani', ka: 'ბაკურიანი', loc: 'ბაკურიანში', en: 'Bakuriani', ru: 'Бакуриани' },
  { slug: 'kobuleti', ka: 'ქობულეთი', loc: 'ქობულეთში', en: 'Kobuleti', ru: 'Кобулети' },
  { slug: 'borjomi', ka: 'ბორჯომი', loc: 'ბორჯომში', en: 'Borjomi', ru: 'Боржоми' },
  { slug: 'gudauri', ka: 'გუდაური', loc: 'გუდაურში', en: 'Gudauri', ru: 'Гудаури' },
  { slug: 'mestia', ka: 'მესტია', loc: 'მესტიაში', en: 'Mestia', ru: 'Местиа' },
  { slug: 'sighnaghi', ka: 'სიღნაღი', loc: 'სიღნაღში', en: 'Sighnaghi', ru: 'Сигнахи' },
  { slug: 'tskaltubo', ka: 'წყალტუბო', loc: 'წყალტუბოში', en: 'Tskaltubo', ru: 'Цхалтубо' },
  { slug: 'kazbegi', ka: 'ყაზბეგი', loc: 'ყაზბეგში', en: 'Kazbegi', ru: 'Казбеги' },
  // DE market (sivrce.de) — top 16 metros by population. Inventory-light:
  // pages self-throttle (≥1 listing rule); Berlin has city-info prose today.
  { slug: 'berlin', ka: 'ბერლინი', loc: 'ბერლინში', en: 'Berlin', ru: 'Берлин', market: 'de' },
  { slug: 'hamburg', ka: 'ჰამბურგი', loc: 'ჰამბურგში', en: 'Hamburg', ru: 'Гамбург', market: 'de' },
  { slug: 'munich', ka: 'მიუნხენი', loc: 'მიუნხენში', en: 'Munich', ru: 'Мюнхен', market: 'de' },
  { slug: 'cologne', ka: 'კელნი', loc: 'კელნში', en: 'Cologne', ru: 'Кёльн', market: 'de' },
  { slug: 'frankfurt', ka: 'ფრანკფურტი', loc: 'ფრანკფურტში', en: 'Frankfurt', ru: 'Франкфурт', market: 'de' },
  { slug: 'stuttgart', ka: 'შტუტგარტი', loc: 'შტუტგარტში', en: 'Stuttgart', ru: 'Штутгарт', market: 'de' },
  { slug: 'duesseldorf', ka: 'დიუსელდორფი', loc: 'დიუსელდორფში', en: 'Düsseldorf', ru: 'Дюссельдорф', market: 'de' },
  { slug: 'leipzig', ka: 'ლაიფციგი', loc: 'ლაიფციგში', en: 'Leipzig', ru: 'Лейпциг', market: 'de' },
  { slug: 'dortmund', ka: 'დორტმუნდი', loc: 'დორტმუნდში', en: 'Dortmund', ru: 'Дортмунд', market: 'de' },
  { slug: 'essen', ka: 'ესენი', loc: 'ესენში', en: 'Essen', ru: 'Эссен', market: 'de' },
  { slug: 'bremen', ka: 'ბრემენი', loc: 'ბრემენში', en: 'Bremen', ru: 'Бремен', market: 'de' },
  { slug: 'dresden', ka: 'დრეზდენი', loc: 'დრეზდენში', en: 'Dresden', ru: 'Дрезден', market: 'de' },
  { slug: 'hanover', ka: 'ჰანოვერი', loc: 'ჰანოვერში', en: 'Hanover', ru: 'Ганновер', market: 'de' },
  { slug: 'nuremberg', ka: 'ნიურნბერგი', loc: 'ნიურნბერგში', en: 'Nuremberg', ru: 'Нюрнберг', market: 'de' },
  { slug: 'duisburg', ka: 'დუისბურგი', loc: 'დუისბურგში', en: 'Duisburg', ru: 'Дуйсбург', market: 'de' },
  { slug: 'bochum', ka: 'ბოხუმი', loc: 'ბოხუმში', en: 'Bochum', ru: 'Бохум', market: 'de' },
]

export type District = GeoLoc & { citySlug: string }

export const DISTRICTS: District[] = [
  { slug: 'vake', ka: 'ვაკე', loc: 'ვაკეში', en: 'Vake', ru: 'Ваке', citySlug: 'tbilisi' },
  { slug: 'saburtalo', ka: 'საბურთალო', loc: 'საბურთალოზე', en: 'Saburtalo', ru: 'Сабуртало', citySlug: 'tbilisi' },
  { slug: 'mtatsminda', ka: 'მთაწმინდა', loc: 'მთაწმინდაზე', en: 'Mtatsminda', ru: 'Мтацминда', citySlug: 'tbilisi' },
  { slug: 'didi-dighomi', ka: 'დიდი დიღომი', loc: 'დიდ დიღომში', en: 'Didi Dighomi', ru: 'Диди Дигоми', citySlug: 'tbilisi' },
  { slug: 'ortachala', ka: 'ორთაჭალა', loc: 'ორთაჭალაში', en: 'Ortachala', ru: 'Ортачала', citySlug: 'tbilisi' },
  { slug: 'isani', ka: 'ისანი', loc: 'ისანში', en: 'Isani', ru: 'Исани', citySlug: 'tbilisi' },
  { slug: 'gldani', ka: 'გლდანი', loc: 'გლდანში', en: 'Gldani', ru: 'Глдани', citySlug: 'tbilisi' },
  { slug: 'krtsanisi', ka: 'კრწანისი', loc: 'კრწანისში', en: 'Krtsanisi', ru: 'Крцаниси', citySlug: 'tbilisi' },
  { slug: 'avlabari', ka: 'ავლაბარი', loc: 'ავლაბარში', en: 'Avlabari', ru: 'Авлабари', citySlug: 'tbilisi' },
  { slug: 'tskneti', ka: 'წყნეთი', loc: 'წყნეთში', en: 'Tskneti', ru: 'Цкнети', citySlug: 'tbilisi' },
  { slug: 'tskhvarichamia', ka: 'ცხვარიჭამია', loc: 'ცხვარიჭამიაში', en: 'Tskhvarichamia', ru: 'Цхваричамия', citySlug: 'tbilisi' },
  // ponytail: no inventory here today — pages self-throttle (≥1 listing rule) and go
  // live free the moment real listings land (ss.ge ranks with exactly these districts).
  { slug: 'old-tbilisi', ka: 'ძველი თბილისი', loc: 'ძველ თბილისში', en: 'Old Tbilisi', ru: 'Старый Тбилиси', citySlug: 'tbilisi' },
  { slug: 'varketili', ka: 'ვარკეთილი', loc: 'ვარკეთილში', en: 'Varketili', ru: 'Варкетили', citySlug: 'tbilisi' },
  { slug: 'chughureti', ka: 'ჩუღურეთი', loc: 'ჩუღურეთში', en: 'Chughureti', ru: 'Чугурети', citySlug: 'tbilisi' },
  { slug: 'nadzaladevi', ka: 'ნაძალადევი', loc: 'ნაძალადევში', en: 'Nadzaladevi', ru: 'Надзаладеви', citySlug: 'tbilisi' },
  // Leaf ubani competitors rank on (full picker list: georgia-locations.json).
  { slug: 'didube', ka: 'დიდუბე', loc: 'დიდუბეში', en: 'Didube', ru: 'Дидубе', citySlug: 'tbilisi' },
  { slug: 'vera', ka: 'ვერა', loc: 'ვერაში', en: 'Vera', ru: 'Вера', citySlug: 'tbilisi' },
  { slug: 'digomis-masivi', ka: 'დიღმის მასივი', loc: 'დიღმის მასივში', en: 'Dighomi Massive', ru: 'Дигомский массив', citySlug: 'tbilisi' },
  { slug: 'baghebi', ka: 'ბაგები', loc: 'ბაგებში', en: 'Baghebi', ru: 'Багеби', citySlug: 'tbilisi' },
  { slug: 'nutsubidze', ka: 'ნუცუბიძის ფერდობი', loc: 'ნუცუბიძის ფერდობზე', en: 'Nutsubidze Plateau', ru: 'Плато Нуцубидзе', citySlug: 'tbilisi' },
  { slug: 'vashlijvari', ka: 'ვაშლიჯვარი', loc: 'ვაშლიჯვარში', en: 'Vashlijvari', ru: 'Вашлиджвари', citySlug: 'tbilisi' },
  { slug: 'samgori', ka: 'სამგორი', loc: 'სამგორში', en: 'Samgori', ru: 'Самгори', citySlug: 'tbilisi' },
  { slug: 'temka', ka: 'თემქა', loc: 'თემქაში', en: 'Temka', ru: 'Темка', citySlug: 'tbilisi' },
  { slug: 'mukhiani', ka: 'მუხიანი', loc: 'მუხიანში', en: 'Mukhiani', ru: 'Мухиани', citySlug: 'tbilisi' },
  { slug: 'vazisubani', ka: 'ვაზისუბანი', loc: 'ვაზისუბანში', en: 'Vazisubani', ru: 'Вазисубани', citySlug: 'tbilisi' },
  { slug: 'akhali-bulvari', ka: 'ახალი ბულვარი', loc: 'ახალ ბულვარზე', en: 'New Boulevard', ru: 'Новый бульвар', citySlug: 'batumi' },
  { slug: 'dzveli-batumi', ka: 'ძველი ბათუმი', loc: 'ძველ ბათუმში', en: 'Old Batumi', ru: 'Старый Батуми', citySlug: 'batumi' },
  { slug: 'makhinjauri', ka: 'მახინჯაური', loc: 'მახინჯაურში', en: 'Makhinjauri', ru: 'Махинджаури', citySlug: 'batumi' },
  { slug: 'rustavelis-ubani', ka: 'რუსთაველის უბანი', loc: 'რუსთაველის უბანში', en: 'Rustaveli District', ru: 'Район Руставели', citySlug: 'batumi' },
  { slug: 'airport-ubani', ka: 'აეროპორტის უბანი', loc: 'აეროპორტის უბანში', en: 'Airport District', ru: 'Район аэропорта', citySlug: 'batumi' },
  { slug: 'kutaisi-centri', ka: 'ცენტრი', loc: 'ცენტრში', en: 'Center', ru: 'Центр', citySlug: 'kutaisi' },
  { slug: 'avtokarkhana', ka: 'ავტოქარხანა', loc: 'ავტოქარხანის უბანში', en: 'Avtokarkhana', ru: 'Автокархана', citySlug: 'kutaisi' },
  { slug: 'nikea', ka: 'ნიკეა', loc: 'ნიკეაში', en: 'Nikea', ru: 'Никеа', citySlug: 'kutaisi' },
  // Berlin (sivrce.de) — 12 Bezirke + popular Ortsteile; district pages go
  // live with DE inventory (≥1 listing rule), guides live in neighborhoods.ts.
  { slug: 'mitte', ka: 'მიტე', loc: 'მიტეში', en: 'Mitte', ru: 'Митте', citySlug: 'berlin' },
  { slug: 'kreuzberg', ka: 'კროიცბერგი', loc: 'კროიცბერგში', en: 'Kreuzberg', ru: 'Кройцберг', citySlug: 'berlin' },
  { slug: 'prenzlauer-berg', ka: 'პრენცლაუერ-ბერგი', loc: 'პრენცლაუერ-ბერგში', en: 'Prenzlauer Berg', ru: 'Пренцлауэр-Берг', citySlug: 'berlin' },
  { slug: 'charlottenburg', ka: 'შარლოტენბურგი', loc: 'შარლოტენბურგში', en: 'Charlottenburg', ru: 'Шарлоттенбург', citySlug: 'berlin' },
  { slug: 'neukoelln', ka: 'ნოიკოლნი', loc: 'ნოიკოლნში', en: 'Neukölln', ru: 'Нойкёльн', citySlug: 'berlin' },
  { slug: 'friedrichshain', ka: 'ფრიდრიხსჰაინი', loc: 'ფრიდრიხსჰაინში', en: 'Friedrichshain', ru: 'Фридрихсхайн', citySlug: 'berlin' },
  { slug: 'pankow', ka: 'პანკოვი', loc: 'პანკოვში', en: 'Pankow', ru: 'Панков', citySlug: 'berlin' },
  { slug: 'reinickendorf', ka: 'რაინიკენდორფი', loc: 'რაინიკენდორფში', en: 'Reinickendorf', ru: 'Райниккендорф', citySlug: 'berlin' },
  { slug: 'spandau', ka: 'შპანდაუ', loc: 'შპანდაუში', en: 'Spandau', ru: 'Шпандау', citySlug: 'berlin' },
  { slug: 'steglitz-zehlendorf', ka: 'შტეგლიც-ცელენდორფი', loc: 'შტეგლიც-ცელენდორფში', en: 'Steglitz-Zehlendorf', ru: 'Штеглиц-Целендорф', citySlug: 'berlin' },
  { slug: 'tempelhof-schoeneberg', ka: 'ტემპელჰოფ-შენებერგი', loc: 'ტემპელჰოფ-შენებერგში', en: 'Tempelhof-Schöneberg', ru: 'Темпельхоф-Шёнеберг', citySlug: 'berlin' },
  { slug: 'treptow-koepenick', ka: 'ტრეპტოვ-კეპენიკი', loc: 'ტრეპტოვ-კეპენიკში', en: 'Treptow-Köpenick', ru: 'Трептов-Кёпеник', citySlug: 'berlin' },
  { slug: 'marzahn-hellersdorf', ka: 'მარცან-ჰელერსდორფი', loc: 'მარცან-ჰელერსდორფში', en: 'Marzahn-Hellersdorf', ru: 'Марцан-Хеллерсдорф', citySlug: 'berlin' },
  { slug: 'lichtenberg', ka: 'ლიხტენბერგი', loc: 'ლიხტენბერგში', en: 'Lichtenberg', ru: 'Лихтенберг', citySlug: 'berlin' },
]

/** City display name per locale (CITIES registry, fallback raw). */
export function cityName(city: string, loc: DirLoc): string {
  const c = CITIES.find((c) => c.ka === city)
  return c ? (loc === 'ka' ? c.ka : loc === 'ru' ? c.ru : c.en) : city
}

export interface FaqItem {
  q: string
  a: string
}

/** FAQPage JSON-LD matching a visible FaqSection one-to-one. */
export function faqPageLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

/** Shared micro-labels used on hub cards and detail stat rows. */
export const MICRO: Record<
  DirLoc,
  {
    builtPct: (n: number) => string
    handover: string
    flats: string
    perM2: string
    perM2From: string
    priceFromM2: string
    website: string
    listingsIn: (city: string) => string
    listingsShort: string
    prev: string
    next: string
    page: (n: number) => string
    emptyProjects: string
  }
> = {
  ka: {
    builtPct: (n) => `აშენებულია ${n}%`,
    handover: 'ჩაბარება',
    flats: 'ბინა',
    perM2: '/მ²',
    perM2From: '/მ²-დან',
    priceFromM2: 'ფასი /მ²-დან',
    website: 'ვებგვერდი',
    listingsIn: (city) => `განცხადებები ქ. ${city.endsWith('ი') ? city.slice(0, -1) : city}ში`,
    listingsShort: 'განცხადებები',
    prev: 'წინა გვერდი',
    next: 'შემდეგი გვერდი',
    page: (n) => `გვერდი ${n}`,
    emptyProjects: 'პროექტები ჯერ არ არის ხელმისაწვდომი — სცადე მოგვიანებით',
  },
  en: {
    builtPct: (n) => `${n}% built`,
    handover: 'Handover',
    flats: 'Flats',
    perM2: '/m²',
    perM2From: '/m² from',
    priceFromM2: 'Price from /m²',
    website: 'Website',
    listingsIn: (city) => `Listings in ${cityName(city, 'en')}`,
    listingsShort: 'Listings',
    prev: 'Previous page',
    next: 'Next page',
    page: (n) => `Page ${n}`,
    emptyProjects: 'No projects available yet — check back soon',
  },
  ru: {
    builtPct: (n) => `построено ${n}%`,
    handover: 'Сдача',
    flats: 'Квартиры',
    perM2: '/м²',
    perM2From: '/м² от',
    priceFromM2: 'Цена от /м²',
    website: 'Сайт',
    listingsIn: (city) => `Объявления в ${cityName(city, 'ru')}`,
    listingsShort: 'Объявления',
    prev: 'Предыдущая страница',
    next: 'Следующая страница',
    page: (n) => `Страница ${n}`,
    emptyProjects: 'Проекты пока недоступны — загляните позже',
  },
}
