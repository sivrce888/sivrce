import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, LayoutGrid, MapPin, Search, TrendingUp } from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import { AirBadge, WeatherBadge } from '@/components/WeatherBadge'
import { Chip } from '@/components/seo/SeoLanding'
import { formatUSD, type Listing } from '@/data/listings'
import {
  DISTRICT_COORDS,
  getStreet,
  streetLocative,
  type TbilisiStreet,
} from '@/data/tbilisi-streets'
import { getListingsOnStreet } from '@/lib/listings-db'
import { DISTRICTS, parseSeoSlug, statsOf, type District, type Faq } from '@/lib/seo-pages'
import { jsonLd } from '@/lib/utils'
import { listingPath } from '@/lib/listing-slug'
import { isValidLang, translateRaw, type Lang } from '@/lib/i18n/core'
import { kaOnlyAlternates, OG_LOCALE } from '@/lib/i18n/server'

const BASE = 'https://sivrce.ge'

export const revalidate = 300
function tbilisiDistrictOf(slug: string): District | undefined {
  return DISTRICTS.find((d) => d.slug === slug && d.citySlug === 'tbilisi')
}

async function resolve(districtSlug: string, streetSlug: string) {
  const district = tbilisiDistrictOf(districtSlug)
  const street = getStreet(streetSlug)
  if (!district || !street || street.district !== district.slug) return null
  // Live inventory only — mock LISTINGS inflated SEO stats.
  let listings: Listing[] = []
  try {
    listings = await getListingsOnStreet(street.ka, district.ka)
  } catch {
    listings = []
  }
  return { district, street, listings }
}

interface PageProps {
  params: Promise<{ lang: string; district: string; street: string }>
}

/** On-page copy per locale — {var}/{plural:one|other} templates resolved via translateRaw. */
interface Copy {
  ariaCrumbs: string
  crumbHome: string
  crumbTbilisi: string
  badge: string
  loc: string
  titleFull: string
  titleEmpty: string
  h1: string
  descEmpty: string
  descFull: string
  descPerM2: string
  statListings: string
  statAvg: string
  statFrom: string
  perM2: string
  chipSearch: string
  chipAll: string
  chipStreets: string
  chipMetro: string
  listingsAria: string
  emptyTitle: string
  emptyBody: string
  chipDistrict: string
  introTitle: string
  introEmpty: string
  introFull: string
  perM2Frag: string
  faqAria: string
  faqHeading: string
  faq1q: string
  faq1aAvg: string
  faq1a: string
  faq1aEmpty: string
  faq2q: string
  faq2a: string
  faq3q: string
  faq3a: string
}

// ka strings verbatim; canonicals stay ka (kaOnlyAlternates) — this localizes the visit, not the index.
const C: Record<'ka' | 'en' | 'ru' | 'de', Copy> = {
  ka: {
    ariaCrumbs: 'ბრედკრამბი',
    crumbHome: 'მთავარი',
    crumbTbilisi: 'თბილისი',
    badge: 'AI შეფასებით',
    loc: '',
    titleFull: 'ბინები {loc}, {districtLoc} — {n} განცხადება',
    titleEmpty: 'ბინები {loc}, {districtLoc} — იყიდება და ქირავდება',
    h1: 'ბინები {loc}',
    descEmpty:
      'ბინები {loc}, {districtLoc}, თბილისში: იყიდება და ქირავდება, ფასები და ახალი პროექტები. მოძებნეთ ბინა {street}-ზე sivrce-ის ვერიფიცირებული განცხადებებით — AI ფასის შეფასებით და პირდაპირი კონტაქტით მესაკუთრესთან.',
    descFull:
      'იყიდება და ქირავდება ბინები {loc}, {districtLoc}, თბილისში — {n} ვერიფიცირებული განცხადება sivrce-ზე.{perM2} ფასები {min}-დან {max}-მდე. AI ფასის შეფასება, 3D რუკა, პირდაპირი კონტაქტი მესაკუთრესთან.',
    descPerM2: ' საშუალო ფასი {avg}/მ².',
    statListings: 'განცხადება',
    statAvg: 'საშუალო ფასი',
    statFrom: 'საწყისი ფასი',
    perM2: '/მ²',
    chipSearch: 'ძიება: {name}',
    chipAll: '{name} — ყველა განცხადება',
    chipStreets: 'თბილისის ქუჩები',
    chipMetro: 'ბინები მეტროსთან',
    listingsAria: 'განცხადებები',
    emptyTitle: 'ამ ქუჩაზე ჯერ განცხადება არ არის',
    emptyBody: 'მარაგი ყოველდღე იცვლება — მოძებნეთ ბინა ძიებით ან დაათვალიერეთ მთლიანი უბანი.',
    chipDistrict: 'უბანი: {name}',
    introTitle: 'ბინები {loc} — ბაზრის მიმოხილვა',
    introEmpty:
      '{street} {districtLoc} — ამ წამს ქუჩაზე აქტიური განცხადება არ არის, მაგრამ მარაგი ყოველდღე იცვლება და ახალი ბინები ხშირად სწორედ ასეთ, მშვიდ ქუჩებზე ჩნდება პირველად. მოძებნეთ ბინა ძიებით ან დაათვალიერეთ {districtLoc} სხვა ქუჩები — განცხადების გამოქვეყნებისთანავე იხილავთ ფასს, ფოტოებს და AI შეფასებას.',
    introFull:
      '{street} — {districtLoc} ერთ-ერთი მოთხოვნადი მისამართია როგორც ყიდვისთვის, ისე ქირისთვის. ამჟამად ქუჩაზე {n} აქტიური განცხადებაა: ფასები {min}-დან {max}-მდე იცვლება{perM2}. ყველა განცხადება მოწმდება sivrce-ის ვერიფიკაციის სისტემით, AI კი თითოეულ ფასს ბაზრის რეალურ მაჩვენებლებთან ადარებს — ასე მყიდველიც და მოიჯარეც ერთ სივრცეში პოულობს საუკეთესო ვარიანტს.',
    perM2Frag: ', საშუალო კვადრატულის ფასი {avg}/მ²-ია',
    faqAria: 'ხშირად დასმული კითხვები',
    faqHeading: 'ხშირად დასმული კითხვები',
    faq1q: 'რა ღირს ბინა {loc}?',
    faq1aAvg:
      'ამჟამად საშუალო ფასი {avg}/მ²-ია. ყველაზე ხელმისაწვდომი ვარიანტი {min} ღირს, პრემიუმ სეგმენტი კი {max}-მდე აღწევს. AI ფასის შეფასება თითოეული განცხადების ბარათზე ჩანს.',
    faq1a: 'ფასები {min}-დან იწყება და {max}-მდე იცვლება. AI ფასის შეფასება თითოეული განცხადების ბარათზე ჩანს.',
    faq1aEmpty:
      'ფასი ბინის ფართზე, სართულზე, რემონტსა და კორპუსის მდებარეობაზეა დამოკიდებული. {districtLoc} მიმდინარე ფასები დაათვალიერე უბნის გვერდზე, ხოლო კონკრეტული ბინის ღირებულებას თითოეული განცხადების AI შეფასება გიჩვენებს.',
    faq2q: 'როგორ ვიპოვო ვერიფიცირებული განცხადებები {loc}?',
    faq2a:
      'ჩაწერეთ ძიებაში „{street}" ან აირჩიეთ უბანი — {district}. sivrce-ზე ყველა განცხადება გადის მონაცემთა შემოწმებას: მესაკუთრის ვერიფიკაცია, ფოტოების ავთენტურობა და ფასის ბაზრის შედარება.',
    faq3q: 'შემიძლია თუ არა უფასოდ განცხადების დამატება?',
    faq3a:
      'დიახ — sivrce-ზე განცხადების დამატება უფასოა. VIP პაკეტები (VIP, VIP+, SUPER VIP) განცხადებას ძიების თავში აჩვენებს და საშუალოდ 5-ჯერ მეტ ნახვას იძლევა.',
  },
  en: {
    ariaCrumbs: 'Breadcrumb',
    crumbHome: 'Home',
    crumbTbilisi: 'Tbilisi',
    badge: 'With AI valuation',
    loc: 'on {name}',
    titleFull: 'Apartments {loc}, {district} — {n} {plural:listing|listings}',
    titleEmpty: 'Apartments {loc}, {district} — for sale and rent',
    h1: 'Apartments {loc}',
    descEmpty:
      'Apartments {loc}, {district}, Tbilisi: for sale and rent, prices and new projects. Find an apartment on {street} with sivrce’s verified listings — AI price valuation and direct contact with the owner.',
    descFull:
      'Apartments for sale and rent {loc}, {district}, Tbilisi — {n} verified {plural:listing|listings} on sivrce.{perM2} Prices from {min} to {max}. AI price valuation, 3D map, direct contact with the owner.',
    descPerM2: ' Average price {avg}/m².',
    statListings: 'Listings',
    statAvg: 'Average price',
    statFrom: 'Starting price',
    perM2: '/m²',
    chipSearch: 'Search: {name}',
    chipAll: '{name} — all listings',
    chipStreets: 'Tbilisi streets',
    chipMetro: 'Apartments near the metro',
    listingsAria: 'Listings',
    emptyTitle: 'No listings on this street yet',
    emptyBody: 'Inventory changes daily — search for an apartment or browse the whole district.',
    chipDistrict: 'District: {name}',
    introTitle: 'Apartments {loc} — market overview',
    introEmpty:
      '{street} in {district} — there are no active listings on the street at this moment, but inventory changes daily and new apartments often appear first on quiet streets like this. Search for an apartment or browse other streets in {district} — the moment a listing is published you will see its price, photos and AI valuation.',
    introFull:
      '{street} in {district} is one of the most sought-after addresses, both for buying and for renting. There are currently {n} active {plural:listing|listings} on the street: prices range from {min} to {max}{perM2}. Every listing is verified by sivrce’s verification system, and AI compares each price against real market benchmarks — so buyers and tenants alike find the best option in one place.',
    perM2Frag: ', average price {avg}/m²',
    faqAria: 'Frequently asked questions',
    faqHeading: 'Frequently asked questions',
    faq1q: 'How much does an apartment cost {loc}?',
    faq1aAvg:
      'The average price is currently {avg}/m². The most affordable option costs {min}, while the premium segment reaches up to {max}. The AI price valuation is shown on every listing card.',
    faq1a: 'Prices start at {min} and go up to {max}. The AI price valuation is shown on every listing card.',
    faq1aEmpty:
      'The price depends on the apartment’s size, floor, renovation and the building’s location. Browse current prices in {district} on the district page — the AI valuation on each listing shows the value of a specific apartment.',
    faq2q: 'How do I find verified listings {loc}?',
    faq2a:
      'Type "{street}" into search or pick the district — {district}. On sivrce every listing goes through data verification: owner verification, photo authenticity and market price comparison.',
    faq3q: 'Can I post a listing for free?',
    faq3a:
      'Yes — posting a listing on sivrce is free. VIP packages (VIP, VIP+, SUPER VIP) place the listing at the top of search results and deliver on average 5 times more views.',
  },
  ru: {
    ariaCrumbs: 'Навигация',
    crumbHome: 'Главная',
    crumbTbilisi: 'Тбилиси',
    badge: 'С ИИ-оценкой',
    loc: 'на {name}',
    titleFull: 'Квартиры {loc}, {district} — {n} {plural:объявление|объявления|объявлений}',
    titleEmpty: 'Квартиры {loc}, {district} — продажа и аренда',
    h1: 'Квартиры {loc}',
    descEmpty:
      'Квартиры {loc}, {district}, Тбилиси: продажа и аренда, цены и новые проекты. Найдите квартиру на {street} с проверенными объявлениями sivrce — ИИ-оценка цены и прямой контакт с владельцем.',
    descFull:
      'Продажа и аренда квартир {loc}, {district}, Тбилиси — {n} {plural:проверенное объявление|проверенных объявления|проверенных объявлений} на sivrce.{perM2} Цены от {min} до {max}. ИИ-оценка цены, 3D-карта, прямой контакт с владельцем.',
    descPerM2: ' Средняя цена {avg}/м².',
    statListings: 'Объявления',
    statAvg: 'Средняя цена',
    statFrom: 'Начальная цена',
    perM2: '/м²',
    chipSearch: 'Поиск: {name}',
    chipAll: '{name} — все объявления',
    chipStreets: 'Улицы Тбилиси',
    chipMetro: 'Квартиры у метро',
    listingsAria: 'Объявления',
    emptyTitle: 'На этой улице пока нет объявлений',
    emptyBody: 'Предложение меняется каждый день — воспользуйтесь поиском или посмотрите весь район.',
    chipDistrict: 'Район: {name}',
    introTitle: 'Квартиры {loc} — обзор рынка',
    introEmpty:
      '{street} в {district} — прямо сейчас на улице нет активных объявлений, но предложение меняется каждый день, и новые квартиры часто появляются именно на таких тихих улицах. Воспользуйтесь поиском или посмотрите другие улицы в {district} — сразу после публикации объявления вы увидите цену, фотографии и ИИ-оценку.',
    introFull:
      '{street} в {district} — один из самых востребованных адресов как для покупки, так и для аренды. Сейчас на улице {n} {plural:активное объявление|активных объявления|активных объявлений}: цены от {min} до {max}{perM2}. Каждое объявление проверяется системой верификации sivrce, а ИИ сравнивает каждую цену с реальными рыночными показателями — так и покупатель, и арендатор находят лучший вариант в одном месте.',
    perM2Frag: ', средняя цена квадратного метра — {avg}',
    faqAria: 'Часто задаваемые вопросы',
    faqHeading: 'Часто задаваемые вопросы',
    faq1q: 'Сколько стоит квартира {loc}?',
    faq1aAvg:
      'Сейчас средняя цена — {avg}/м². Самый доступный вариант стоит {min}, премиальный сегмент достигает {max}. ИИ-оценка цены видна на карточке каждого объявления.',
    faq1a: 'Цены начинаются от {min} и достигают {max}. ИИ-оценка цены видна на карточке каждого объявления.',
    faq1aEmpty:
      'Цена зависит от площади квартиры, этажа, ремонта и расположения корпуса. Текущие цены в {district} смотрите на странице района, а стоимость конкретной квартиры покажет ИИ-оценка каждого объявления.',
    faq2q: 'Как найти проверенные объявления {loc}?',
    faq2a:
      'Введите в поиске «{street}» или выберите район — {district}. На sivrce каждое объявление проходит проверку данных: верификация владельца, подлинность фотографий и сравнение цены с рынком.',
    faq3q: 'Можно ли бесплатно добавить объявление?',
    faq3a:
      'Да — добавление объявления на sivrce бесплатно. VIP-пакеты (VIP, VIP+, SUPER VIP) показывают объявление в топе поиска и дают в среднем в 5 раз больше просмотров.',
  },
  de: {
    ariaCrumbs: 'Brotkrumen',
    crumbHome: 'Startseite',
    crumbTbilisi: 'Tiflis',
    badge: 'Mit KI-Bewertung',
    loc: 'in der {name}',
    titleFull: 'Wohnungen {loc}, {district} — {n} {plural:Inserat|Inserate}',
    titleEmpty: 'Wohnungen {loc}, {district} — zu verkaufen und zur Miete',
    h1: 'Wohnungen {loc}',
    descEmpty:
      'Wohnungen {loc}, {district}, Tiflis: zu verkaufen und zur Miete, Preise und neue Projekte. Finden Sie eine Wohnung in der {street} mit verifizierten Inseraten von sivrce — KI-Preisschätzung und direkter Kontakt zum Eigentümer.',
    descFull:
      'Wohnungen zu verkaufen und zur Miete {loc}, {district}, Tiflis — {n} {plural:verifiziertes Inserat|verifizierte Inserate} auf sivrce.{perM2} Preise von {min} bis {max}. KI-Preisschätzung, 3D-Karte, direkter Kontakt zum Eigentümer.',
    descPerM2: ' Durchschnittspreis {avg}/m².',
    statListings: 'Inserate',
    statAvg: 'Durchschnittspreis',
    statFrom: 'Startpreis',
    perM2: '/m²',
    chipSearch: 'Suche: {name}',
    chipAll: '{name} — alle Inserate',
    chipStreets: 'Tifliser Straßen',
    chipMetro: 'Wohnungen nahe der Metro',
    listingsAria: 'Inserate',
    emptyTitle: 'Auf dieser Straße gibt es noch keine Inserate',
    emptyBody: 'Das Angebot ändert sich täglich — suchen Sie eine Wohnung oder stöbern Sie im gesamten Viertel.',
    chipDistrict: 'Viertel: {name}',
    introTitle: 'Wohnungen {loc} — Marktüberblick',
    introEmpty:
      '{street} in {district} — im Moment gibt es auf der Straße keine aktiven Inserate, das Angebot ändert sich jedoch täglich, und neue Wohnungen erscheinen oft zuerst in ruhigen Straßen wie dieser. Suchen Sie eine Wohnung oder stöbern Sie in weiteren Straßen in {district} — sobald ein Inserat veröffentlicht wird, sehen Sie Preis, Fotos und KI-Bewertung.',
    introFull:
      '{street} in {district} ist eine der gefragtesten Adressen — sowohl zum Kauf als auch zur Miete. Derzeit gibt es auf der Straße {n} {plural:aktives Inserat|aktive Inserate}: Die Preise reichen von {min} bis {max}{perM2}. Jedes Inserat wird durch das Verifizierungssystem von sivrce geprüft, und die KI vergleicht jeden Preis mit realen Marktbenchmarks — so finden Käufer und Mieter gleichermaßen die beste Option an einem Ort.',
    perM2Frag: ', Durchschnittspreis {avg}/m²',
    faqAria: 'Häufig gestellte Fragen',
    faqHeading: 'Häufig gestellte Fragen',
    faq1q: 'Was kostet eine Wohnung {loc}?',
    faq1aAvg:
      'Der Durchschnittspreis liegt derzeit bei {avg}/m². Die günstigste Option kostet {min}, das Premiumsegment erreicht bis zu {max}. Die KI-Preisschätzung ist auf jeder Inseratkarte sichtbar.',
    faq1a: 'Die Preise beginnen bei {min} und reichen bis {max}. Die KI-Preisschätzung ist auf jeder Inseratkarte sichtbar.',
    faq1aEmpty:
      'Der Preis hängt von der Fläche, der Etage, dem Renovierungszustand und der Lage des Gebäudes ab. Aktuelle Preise in {district} sehen Sie auf der Viertelsseite, den Wert einer bestimmten Wohnung zeigt die KI-Bewertung jedes Inserats.',
    faq2q: 'Wie finde ich verifizierte Inserate {loc}?',
    faq2a:
      'Geben Sie „{street}" in die Suche ein oder wählen Sie das Viertel — {district}. Auf sivrce durchläuft jedes Inserat eine Datenprüfung: Eigentümer-Verifizierung, Echtheit der Fotos und Vergleich des Preises mit dem Markt.',
    faq3q: 'Kann ich ein Inserat kostenlos einstellen?',
    faq3a:
      'Ja — das Einstellen eines Inserats auf sivrce ist kostenlos. VIP-Pakete (VIP, VIP+, SUPER VIP) zeigen das Inserat ganz oben in den Suchergebnissen und bringen im Durchschnitt 5-mal mehr Aufrufe.',
  },
}

type CopyLang = keyof typeof C
const cLang = (l: Lang): CopyLang => (l === 'ka' || l === 'ru' || l === 'de' ? l : 'en')

const streetNameOf = (s: TbilisiStreet, l: CopyLang) => (l === 'ka' ? s.ka : s.en)
const locOf = (s: TbilisiStreet, l: CopyLang) => (l === 'ka' ? streetLocative(s.ka) : translateRaw(C[l].loc, { name: s.en }))
const distLocOf = (d: District, l: CopyLang) => (l === 'ka' ? d.loc : l === 'ru' ? d.ru : d.en)
const distNameOf = (d: District, l: CopyLang) => (l === 'ka' ? d.ka : l === 'ru' ? d.ru : d.en)

function titleOfStreet(street: TbilisiStreet, district: District, count: number, cl: CopyLang): string {
  const v = { loc: locOf(street, cl), districtLoc: distLocOf(district, cl) }
  return count > 0 ? translateRaw(C[cl].titleFull, { ...v, n: count }) : translateRaw(C[cl].titleEmpty, v)
}

function descriptionOfStreet(street: TbilisiStreet, district: District, listings: Listing[], cl: CopyLang): string {
  const v: Record<string, string | number> = {
    loc: locOf(street, cl),
    districtLoc: distLocOf(district, cl),
    street: streetNameOf(street, cl),
  }
  if (listings.length === 0) return translateRaw(C[cl].descEmpty, v)
  const s = statsOf(listings)
  return translateRaw(C[cl].descFull, {
    ...v,
    n: s.count,
    min: formatUSD(s.minPrice),
    max: formatUSD(s.maxPrice),
    perM2: s.avgPerM2 ? translateRaw(C[cl].descPerM2, { avg: formatUSD(s.avgPerM2) }) : '',
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: rawLang, district: d, street: s } = await params
  const cl = cLang(isValidLang(rawLang) ? rawLang : 'ka')
  const ctx = await resolve(d, s)
  if (!ctx) return {}
  const title = titleOfStreet(ctx.street, ctx.district, ctx.listings.length, cl)
  const description = descriptionOfStreet(ctx.street, ctx.district, ctx.listings, cl)
  const path = `/tbilisi/${ctx.district.slug}/${ctx.street.slug}`
  return {
    title,
    description,
    alternates: kaOnlyAlternates(path),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${BASE}${path}`,
      siteName: 'sivrce',
      locale: OG_LOCALE[cl],
      images: [{ url: '/images/og-brand.png', width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/images/og-brand.png'] },
  }
}

/** Intro paragraph — unique per street via live stats; honest when empty. */
function introOfStreet(street: TbilisiStreet, district: District, listings: Listing[], cl: CopyLang): string {
  const v: Record<string, string | number> = { street: streetNameOf(street, cl), districtLoc: distLocOf(district, cl) }
  if (listings.length === 0) return translateRaw(C[cl].introEmpty, v)
  const s = statsOf(listings)
  return translateRaw(C[cl].introFull, {
    ...v,
    n: s.count,
    min: formatUSD(s.minPrice),
    max: formatUSD(s.maxPrice),
    perM2: s.avgPerM2 ? translateRaw(C[cl].perM2Frag, { avg: formatUSD(s.avgPerM2) }) : '',
  })
}

function faqsOfStreet(street: TbilisiStreet, district: District, listings: Listing[], cl: CopyLang): Faq[] {
  const c = C[cl]
  const loc = locOf(street, cl)
  const s = listings.length > 0 ? statsOf(listings) : null
  const v: Record<string, string | number> = {
    loc,
    street: streetNameOf(street, cl),
    district: distNameOf(district, cl),
    districtLoc: distLocOf(district, cl),
    ...(s
      ? { min: formatUSD(s.minPrice), max: formatUSD(s.maxPrice), ...(s.avgPerM2 ? { avg: formatUSD(s.avgPerM2) } : {}) }
      : {}),
  }
  return [
    {
      q: translateRaw(c.faq1q, { loc }),
      a: s ? (s.avgPerM2 ? translateRaw(c.faq1aAvg, v) : translateRaw(c.faq1a, v)) : translateRaw(c.faq1aEmpty, v),
    },
    { q: translateRaw(c.faq2q, { loc }), a: translateRaw(c.faq2a, v) },
    { q: translateRaw(c.faq3q), a: translateRaw(c.faq3a) },
  ]
}

function streetLd(
  street: TbilisiStreet,
  district: District,
  listings: Listing[],
  crumbs: { name: string; href: string }[],
  faqs: Faq[],
  title: string,
  description: string,
  cl: CopyLang,
) {
  const path = `/tbilisi/${district.slug}/${street.slug}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: title,
        description,
        url: `${BASE}${path}`,
        inLanguage: cl,
        isPartOf: { '@id': `${BASE}/#website` },
      },
      ...(listings.length > 0
        ? [
            {
              '@type': 'ItemList',
              numberOfItems: listings.length,
              itemListElement: listings.slice(0, 30).map((l, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: `${BASE}${listingPath(l)}`,
                name: l.title,
              })),
            },
          ]
        : []),
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((cr, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: cr.name,
          item: `${BASE}${cr.href}`,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }
}

export default async function StreetPage({ params }: PageProps) {
  const { lang: rawLang, district: d, street: s } = await params
  const lang = isValidLang(rawLang) ? rawLang : 'ka'
  const cl = cLang(lang)
  const c = C[cl]
  const ctx = await resolve(d, s)
  if (!ctx) notFound()
  const { district, street, listings } = ctx

  const loc = locOf(street, cl)
  const stats = listings.length > 0 ? statsOf(listings) : null
  const faqs = faqsOfStreet(street, district, listings, cl)
  const title = titleOfStreet(street, district, listings.length, cl)
  const description = descriptionOfStreet(street, district, listings, cl)
  const coords = DISTRICT_COORDS[district.slug]
  // District hub self-throttles (≥1 listing rule) — link only when it exists.
  const districtHub = parseSeoSlug(['tbilisi', district.slug]) !== null

  const crumbs = [
    { name: c.crumbHome, href: '/' },
    { name: c.crumbTbilisi, href: '/tbilisi' },
    ...(districtHub ? [{ name: distNameOf(district, cl), href: `/tbilisi/${district.slug}` }] : []),
    { name: streetNameOf(street, cl), href: `/tbilisi/${district.slug}/${street.slug}` },
  ]

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="sv-pt-nav mx-auto max-w-[1440px] px-5 pb-20 md:px-10">
        {/* Breadcrumbs */}
        <nav aria-label={c.ariaCrumbs} className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-sv-ink/60">
            {crumbs.map((cr, i) => (
              <li key={cr.href} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />}
                {i === crumbs.length - 1 ? (
                  <span aria-current="page" className="text-sv-ink/80">
                    {cr.name}
                  </span>
                ) : (
                  <Link href={cr.href} className="transition-colors hover:text-sv-blue">
                    {cr.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep">
            <SparkMark className="h-3.5 w-3.5" aria-hidden /> {c.badge}
          </span>
          {coords && (
            <>
              <WeatherBadge
                coords={coords}
                label={distNameOf(district, cl)}
                className="mb-3 ml-2 rounded-full border border-sv-ink/[0.06] bg-sv-surface px-3 py-1.5 text-sv-ink/60 shadow-card"
              />
              <AirBadge
                coords={coords}
                lang={lang}
                className="mb-3 ml-2 rounded-full border border-sv-ink/[0.06] bg-sv-surface px-3 py-1.5 text-sv-ink/60 shadow-card"
              />
            </>
          )}
          <h1 className="max-w-[900px] text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[44px]">
            {translateRaw(c.h1, { loc })}
          </h1>
          <p className="mt-3 max-w-[720px] text-[15px] font-semibold text-sv-ink/60 md:text-[16px]">{description}</p>

          {/* Live stats — only with real inventory */}
          {stats && (
            <dl className="mt-6 flex flex-wrap gap-3">
              {[
                { icon: LayoutGrid, label: c.statListings, value: String(stats.count) },
                ...(stats.avgPerM2
                  ? [{ icon: TrendingUp, label: c.statAvg, value: `${formatUSD(stats.avgPerM2)}${c.perM2}` }]
                  : []),
                { icon: MapPin, label: c.statFrom, value: formatUSD(stats.minPrice) },
              ].map((st) => (
                <div
                  key={st.label}
                  className="flex items-center gap-3 rounded-module border border-sv-ink/[0.06] bg-sv-surface px-4 py-3 shadow-card"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-control bg-sv-blue/10">
                    <st.icon className="h-4 w-4 text-sv-blue" aria-hidden />
                  </span>
                  <div>
                    <dd className="text-[16px] font-black text-sv-ink">{st.value}</dd>
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-sv-ink/60">{st.label}</dt>
                  </div>
                </div>
              ))}
            </dl>
          )}
        </header>

        {/* Link mesh — district hub + search + streets directory */}
        <div className="mb-8 flex flex-wrap gap-2">
          {districtHub && <Chip label={distNameOf(district, cl)} href={`/tbilisi/${district.slug}`} />}
          <Chip label={translateRaw(c.chipSearch, { name: streetNameOf(street, cl) })} href={`/search?q=${encodeURIComponent(street.ka)}`} />
          <Chip
            label={translateRaw(c.chipAll, { name: distNameOf(district, cl) })}
            href={`/search?city=${encodeURIComponent('თბილისი')}&district=${encodeURIComponent(district.ka)}`}
          />
          <Chip label={c.chipStreets} href="/tbilisi/kuchebi" />
          <Chip label={c.chipMetro} href="/metro" />
        </div>

        {/* Listings */}
        {listings.length > 0 ? (
          <section aria-label={c.listingsAria} className="sv-card-grid">
            {listings.map((l, i) => (
              <ListingCard key={l.id} l={l} i={i} layout="wide" />
            ))}
          </section>
        ) : (
          <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 text-center shadow-card md:p-10">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-module bg-sv-blue/10">
              <Search className="h-5 w-5 text-sv-blue" aria-hidden />
            </span>
            <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
              {c.emptyTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-[520px] text-[14px] font-medium leading-relaxed text-sv-ink/60">
              {c.emptyBody}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Chip label={translateRaw(c.chipSearch, { name: streetNameOf(street, cl) })} href={`/search?q=${encodeURIComponent(street.ka)}`} active />
              {districtHub && (
                <Chip label={translateRaw(c.chipDistrict, { name: distNameOf(district, cl) })} href={`/tbilisi/${district.slug}`} />
              )}
            </div>
          </section>
        )}

        {/* SEO intro */}
        <section className="mt-14 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
          <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
            {translateRaw(c.introTitle, { loc })}
          </h2>
          <p className="mt-3 max-w-[860px] text-[15px] font-medium leading-relaxed text-sv-ink/65">
            {introOfStreet(street, district, listings, cl)}
          </p>
        </section>

        {/* FAQ */}
        <section className="mt-10" aria-label={c.faqAria}>
          <h2 className="mb-5 text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
            {c.faqHeading}
          </h2>
          <div className="grid gap-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-module border border-sv-ink/[0.06] bg-sv-surface px-5 py-4 shadow-card open:shadow-card-hover"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-extrabold text-sv-ink [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-sv-blue transition-transform duration-300 group-open:rotate-90"
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 text-[14px] font-medium leading-relaxed text-sv-ink/60">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(streetLd(street, district, listings, crumbs, faqs, title, description, cl)) }}
      />
    </div>
  )
}
