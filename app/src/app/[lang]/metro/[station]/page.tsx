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
  METRO_LINES,
  METRO_RADIUS_M,
  getMetroStation,
  metroNeighbours,
  type MetroStation,
} from '@/data/tbilisi-metro'
import { getListingsNearMetro } from '@/lib/listings-db'
import { DISTRICTS, parseSeoSlug, statsOf, type District, type Faq } from '@/lib/seo-pages'
import { jsonLd } from '@/lib/utils'
import { listingPath } from '@/lib/listing-slug'
import { isValidLang, translateRaw, type Lang } from '@/lib/i18n/core'
import { kaOnlyAlternates, OG_LOCALE } from '@/lib/i18n/server'

const BASE = 'https://sivrce.ge'

export const revalidate = 300

function districtOf(station: MetroStation): District | undefined {
  return DISTRICTS.find((d) => d.slug === station.district && d.citySlug === 'tbilisi')
}

async function resolve(stationSlug: string) {
  const station = getMetroStation(stationSlug)
  if (!station) return null
  const listings = await getListingsNearMetro(station.lat, station.lng, METRO_RADIUS_M)
  return { station, listings }
}

interface PageProps {
  params: Promise<{ lang: string; station: string }>
}

/** On-page copy per locale — {var}/{plural:one|other} templates resolved via translateRaw. */
interface Copy {
  ariaCrumbs: string
  crumbHome: string
  crumbMetro: string
  lineBadge: string
  near: string
  titleFull: string
  titleEmpty: string
  h1: string
  descEmpty: string
  descFull: string
  statListings: string
  statAvg: string
  statFrom: string
  perM2: string
  chipSearch: string
  chipAll: string
  chipStation: string
  chipAllStations: string
  chipDistrict: string
  listingsAria: string
  emptyTitle: string
  emptyBody: string
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
  faq4q: string
  faq4a: string
  ldStation: string
  city: string
}

// ka strings verbatim; canonicals stay ka (kaOnlyAlternates) — this localizes the visit, not the index.
const C: Record<'ka' | 'en' | 'ru' | 'de', Copy> = {
  ka: {
    ariaCrumbs: 'ბრედკრამბი',
    crumbHome: 'მთავარი',
    crumbMetro: 'მეტრო',
    lineBadge: 'მე-{line} ხაზი · {lineName}',
    near: '',
    titleFull: 'ბინები {near}, თბილისში — {n} განცხადება',
    titleEmpty: 'ბინები {near}, თბილისში — იყიდება და ქირავდება',
    h1: 'ბინები {near}',
    descEmpty:
      'ბინები {near}{place} — იყიდება და ქირავდება. რეალური ფასები, AI შეფასება და პირდაპირი კონტაქტი მესაკუთრესთან sivrce-ზე.',
    descFull:
      '{n} განცხადება {near}{place} — ფასები {min}-დან. AI ფასის შეფასება და პირდაპირი კონტაქტი მესაკუთრესთან sivrce-ზე.',
    statListings: 'განცხადება',
    statAvg: 'საშუალო ფასი',
    statFrom: 'საწყისი ფასი',
    perM2: '/მ²',
    chipSearch: 'ძიება: {name}',
    chipAll: '{name} — ყველა განცხადება',
    chipStation: 'სადგური: {name}',
    chipAllStations: 'ყველა სადგური',
    chipDistrict: 'უბანი: {name}',
    listingsAria: 'განცხადებები',
    emptyTitle: 'სადგურთან ახლოს ჯერ განცხადება არ არის',
    emptyBody: 'მარაგი ყოველდღე იცვლება — მოძებნეთ ბინა ძიებით, დაათვალიერეთ მთლიანი უბანი ან მეზობელი სადგურები.',
    introTitle: 'ბინები {near} — ბაზრის მიმოხილვა',
    introEmpty:
      '„{name}“ — მე-{line} ხაზის სადგური{place}. ამ წამს სადგურის ფეხით მოსასვლელ რადიუსში აქტიური განცხადება არ არის, მაგრამ მარაგი ყოველდღე იცვლება — განცხადების გამოქვეყნებისთანავე აქ იხილავთ ფასს, ფოტოებს და AI შეფასებას. ამავე უბნის სრული მარაგი იხილეთ უბნის გვერდზე ან მეტროს სხვა სადგურებთან.',
    introFull:
      '„{name}“ — მე-{line} ხაზის სადგური ({lineName}){place}. მეტრო თბილისში ერთადერთი ტრანსპორტია, რომელიც ტრაფიკს არ ექვემდებარება, ამიტომ სადგურთან ახლოს არსებული ბინები როგორც საცხოვრებლად, ისე ქირით მუდამ მოთხოვნადია. ამჟამად 15 წუთიან ფეხით მანძილზე {n} აქტიური განცხადებაა: ფასები {min}-დან {max}-მდე იცვლება{perM2}. ყველა განცხადება მოწმდება sivrce-ის ვერიფიკაციის სისტემით, AI კი თითოეულ ფასს ბაზრის რეალურ მაჩვენებლებთან ადარებს.',
    perM2Frag: ', საშუალო კვადრატულის ფასი {avg}/მ²-ია',
    faqAria: 'ხშირად დასმული კითხვები',
    faqHeading: 'ხშირად დასმული კითხვები',
    faq1q: 'რა ღირს ბინა {near}?',
    faq1aAvg:
      'ამჟამად საშუალო ფასი {avg}/მ²-ია. ყველაზე ხელმისაწვდომი ვარიანტი {min} ღირს, პრემიუმ სეგმენტი კი {max}-მდე აღწევს. AI ფასის შეფასება თითოეული განცხადების ბარათზე ჩანს.',
    faq1a:
      'ფასები {min}-დან იწყება და {max}-მდე იცვლება. AI ფასის შეფასება თითოეული განცხადების ბარათზე ჩანს.',
    faq1aEmpty:
      'ფასი ბინის ფართზე, სართულზე, რემონტსა და სადგურამდე მანძილზეა დამოკიდებული. უბნის მიმდინარე ფასები დაათვალიერე უბნის გვერდზე, ხოლო კონკრეტული ბინის ღირებულებას თითოეული განცხადების AI შეფასება გიჩვენებს.',
    faq2q: 'რატომ არის მოთხოვნადი ბინები {near}?',
    faq2a:
      'მეტრო თბილისში ერთადერთი ტრანსპორტია, რომელიც გაცოცხლებულ ტრაფიკს არ ექვემდებარება — მგზავრობის დრო პროგნოზირებადია დღის ნებისმიერ საათზე. სწორედ ამიტომ {near} ბინები უფრო სწრაფად იყიდება და ქირავდება, ვიდრე იმავე უბნის სადგურისგან მოშორებული ნაწილები.',
    faq3q: 'როგორ ვიპოვო ვერიფიცირებული განცხადებები {near}?',
    faq3a:
      'ამ გვერდზე ნაჩვენებია სადგურიდან 15 წუთიან ფეხით მანძილზე არსებული ყველა აქტიური განცხადება. sivrce-ზე თითოეული განცხადება გადის მონაცემთა შემოწმებას: მესაკუთრის ვერიფიკაცია, ფოტოების ავთენტურობა და ფასის ბაზრის შედარება.',
    faq4q: 'შემიძლია თუ არა უფასოდ განცხადების დამატება?',
    faq4a:
      'დიახ — sivrce-ზე განცხადების დამატება უფასოა. VIP პაკეტები (VIP, VIP+, SUPER VIP) განცხადებას ძიების თავში აჩვენებს და საშუალოდ 5-ჯერ მეტ ნახვას იძლევა.',
    ldStation: '{name} — მეტროსადგური',
    city: 'თბილისი',
  },
  en: {
    ariaCrumbs: 'Breadcrumb',
    crumbHome: 'Home',
    crumbMetro: 'Metro',
    lineBadge: 'Line {line} · {lineName}',
    near: 'near {name} Metro Station',
    titleFull: 'Apartments {near}, Tbilisi — {n} {plural:listing|listings}',
    titleEmpty: 'Apartments {near}, Tbilisi — for sale and rent',
    h1: 'Apartments {near}',
    descEmpty:
      'Apartments {near}{place} — for sale and rent. Real prices, AI valuation and direct contact with owners on sivrce.',
    descFull:
      '{n} {plural:listing|listings} {near}{place} — prices from {min}. AI price valuation and direct contact with owners on sivrce.',
    statListings: 'Listings',
    statAvg: 'Average price',
    statFrom: 'Starting price',
    perM2: '/m²',
    chipSearch: 'Search: {name}',
    chipAll: '{name} — all listings',
    chipStation: 'Station: {name}',
    chipAllStations: 'All stations',
    chipDistrict: 'District: {name}',
    listingsAria: 'Listings',
    emptyTitle: 'No listings near this station yet',
    emptyBody: 'Inventory changes daily — search for an apartment, browse the whole district or neighbouring stations.',
    introTitle: 'Apartments {near} — market overview',
    introEmpty:
      '“{name}” is a station on Line {line}{place}. Right now there are no active listings within walking distance of the station, but inventory changes daily — the moment a listing is published you will see its price, photos and AI valuation here. See the full inventory of this district on the district page or at other metro stations.',
    introFull:
      '“{name}” is a station on Line {line} ({lineName}){place}. The metro is the only transport in Tbilisi that is not affected by traffic, so apartments close to a station are always in demand, both for living and for rent. There are currently {n} active {plural:listing|listings} within a 15-minute walk: prices range from {min} to {max}{perM2}. Every listing is verified by sivrce’s verification system, and AI compares each price against real market benchmarks.',
    perM2Frag: ', average price {avg}/m²',
    faqAria: 'Frequently asked questions',
    faqHeading: 'Frequently asked questions',
    faq1q: 'How much does an apartment cost {near}?',
    faq1aAvg:
      'The average price is currently {avg}/m². The most affordable option costs {min}, while the premium segment reaches up to {max}. The AI price valuation is shown on every listing card.',
    faq1a: 'Prices start at {min} and go up to {max}. The AI price valuation is shown on every listing card.',
    faq1aEmpty:
      'The price depends on the apartment’s size, floor, renovation and distance to the station. Browse the district’s current prices on the district page — the AI valuation on each listing shows the value of a specific apartment.',
    faq2q: 'Why are apartments {near} in demand?',
    faq2a:
      'The metro is the only transport in Tbilisi that is not affected by heavy traffic — journey times are predictable at any hour of the day. That is exactly why apartments {near} sell and rent out faster than the parts of the same district farther from the station.',
    faq3q: 'How do I find verified listings {near}?',
    faq3a:
      'This page shows every active listing within a 15-minute walk of the station. On sivrce, each listing goes through data verification: owner verification, photo authenticity and market price comparison.',
    faq4q: 'Can I post a listing for free?',
    faq4a:
      'Yes — posting a listing on sivrce is free. VIP packages (VIP, VIP+, SUPER VIP) place the listing at the top of search results and deliver on average 5 times more views.',
    ldStation: '{name} Metro Station',
    city: 'Tbilisi',
  },
  ru: {
    ariaCrumbs: 'Навигация',
    crumbHome: 'Главная',
    crumbMetro: 'Метро',
    lineBadge: '{line}-я линия · {lineName}',
    near: 'рядом с метро {name}',
    titleFull: 'Квартиры {near}, Тбилиси — {n} {plural:объявление|объявления|объявлений}',
    titleEmpty: 'Квартиры {near}, Тбилиси — продажа и аренда',
    h1: 'Квартиры {near}',
    descEmpty:
      'Квартиры {near}{place} — продажа и аренда. Реальные цены, ИИ-оценка и прямой контакт с владельцем на sivrce.',
    descFull:
      '{n} {plural:объявление|объявления|объявлений} {near}{place} — цены от {min}. ИИ-оценка цены и прямой контакт с владельцем на sivrce.',
    statListings: 'Объявления',
    statAvg: 'Средняя цена',
    statFrom: 'Начальная цена',
    perM2: '/м²',
    chipSearch: 'Поиск: {name}',
    chipAll: '{name} — все объявления',
    chipStation: 'Станция: {name}',
    chipAllStations: 'Все станции',
    chipDistrict: 'Район: {name}',
    listingsAria: 'Объявления',
    emptyTitle: 'Рядом со станцией пока нет объявлений',
    emptyBody: 'Предложение меняется каждый день — воспользуйтесь поиском, посмотрите весь район или соседние станции.',
    introTitle: 'Квартиры {near} — обзор рынка',
    introEmpty:
      '«{name}» — станция {line}-й линии{place}. Прямо сейчас активных объявлений в пешей доступности от станции нет, но предложение меняется каждый день — сразу после публикации объявления здесь появятся цена, фотографии и ИИ-оценка. Полный ассортимент этого района смотрите на странице района или у других станций метро.',
    introFull:
      '«{name}» — станция {line}-й линии ({lineName}){place}. Метро — единственный транспорт в Тбилиси, который не зависит от пробок, поэтому квартиры рядом со станцией всегда востребованы как для проживания, так и для аренды. Сейчас в 15 минутах ходьбы {n} {plural:активное объявление|активных объявления|активных объявлений}: цены от {min} до {max}{perM2}. Каждое объявление проверяется системой верификации sivrce, а ИИ сравнивает каждую цену с реальными рыночными показателями.',
    perM2Frag: ', средняя цена квадратного метра — {avg}',
    faqAria: 'Часто задаваемые вопросы',
    faqHeading: 'Часто задаваемые вопросы',
    faq1q: 'Сколько стоит квартира {near}?',
    faq1aAvg:
      'Сейчас средняя цена — {avg}/м². Самый доступный вариант стоит {min}, премиальный сегмент достигает {max}. ИИ-оценка цены видна на карточке каждого объявления.',
    faq1a: 'Цены начинаются от {min} и достигают {max}. ИИ-оценка цены видна на карточке каждого объявления.',
    faq1aEmpty:
      'Цена зависит от площади квартиры, этажа, ремонта и расстояния до станции. Текущие цены района смотрите на странице района, а стоимость конкретной квартиры покажет ИИ-оценка каждого объявления.',
    faq2q: 'Почему востребованы квартиры {near}?',
    faq2a:
      'Метро — единственный транспорт в Тбилиси, который не зависит от оживлённого трафика: время поездки предсказуемо в любой час дня. Именно поэтому квартиры {near} продаются и сдаются быстрее, чем удалённые от станции части того же района.',
    faq3q: 'Как найти проверенные объявления {near}?',
    faq3a:
      'На этой странице показаны все активные объявления в 15 минутах ходьбы от станции. На sivrce каждое объявление проходит проверку данных: верификация владельца, подлинность фотографий и сравнение цены с рынком.',
    faq4q: 'Можно ли бесплатно добавить объявление?',
    faq4a:
      'Да — добавление объявления на sivrce бесплатно. VIP-пакеты (VIP, VIP+, SUPER VIP) показывают объявление в топе поиска и дают в среднем в 5 раз больше просмотров.',
    ldStation: '{name} — станция метро',
    city: 'Тбилиси',
  },
  de: {
    ariaCrumbs: 'Brotkrumen',
    crumbHome: 'Startseite',
    crumbMetro: 'Metro',
    lineBadge: 'Linie {line} · {lineName}',
    near: 'nahe der Metrostation {name}',
    titleFull: 'Wohnungen {near}, Tiflis — {n} {plural:Inserat|Inserate}',
    titleEmpty: 'Wohnungen {near}, Tiflis — zu verkaufen und zur Miete',
    h1: 'Wohnungen {near}',
    descEmpty:
      'Wohnungen {near}{place} — zu verkaufen und zur Miete. Echte Preise, KI-Bewertung und direkter Kontakt zu Eigentümern auf sivrce.',
    descFull:
      '{n} {plural:Inserat|Inserate} {near}{place} — Preise ab {min}. KI-Preisschätzung und direkter Kontakt zu Eigentümern auf sivrce.',
    statListings: 'Inserate',
    statAvg: 'Durchschnittspreis',
    statFrom: 'Startpreis',
    perM2: '/m²',
    chipSearch: 'Suche: {name}',
    chipAll: '{name} — alle Inserate',
    chipStation: 'Station: {name}',
    chipAllStations: 'Alle Stationen',
    chipDistrict: 'Viertel: {name}',
    listingsAria: 'Inserate',
    emptyTitle: 'Noch keine Inserate in Stationsnähe',
    emptyBody:
      'Das Angebot ändert sich täglich — suchen Sie eine Wohnung, stöbern Sie im gesamten Viertel oder bei benachbarten Stationen.',
    introTitle: 'Wohnungen {near} — Marktüberblick',
    introEmpty:
      '„{name}“ ist eine Station der Linie {line}{place}. Im Moment gibt es im zu Fuß erreichbaren Umkreis der Station keine aktiven Inserate, das Angebot ändert sich jedoch täglich — sobald ein Inserat veröffentlicht wird, sehen Sie hier Preis, Fotos und KI-Bewertung. Das vollständige Angebot dieses Viertels finden Sie auf der Viertelsseite oder bei anderen Metrostationen.',
    introFull:
      '„{name}“ ist eine Station der Linie {line} ({lineName}){place}. Die Metro ist das einzige Verkehrsmittel in Tiflis, das nicht vom Verkehr abhängt — Wohnungen in Stationsnähe sind daher sowohl zum Wohnen als auch zur Miete stets gefragt. Derzeit gibt es innerhalb von 15 Gehminuten {n} {plural:aktives Inserat|aktive Inserate}: Die Preise reichen von {min} bis {max}{perM2}. Jedes Inserat wird durch das Verifizierungssystem von sivrce geprüft, und die KI vergleicht jeden Preis mit realen Marktbenchmarks.',
    perM2Frag: ', Durchschnittspreis {avg}/m²',
    faqAria: 'Häufig gestellte Fragen',
    faqHeading: 'Häufig gestellte Fragen',
    faq1q: 'Was kostet eine Wohnung {near}?',
    faq1aAvg:
      'Der Durchschnittspreis liegt derzeit bei {avg}/m². Die günstigste Option kostet {min}, das Premiumsegment erreicht bis zu {max}. Die KI-Preisschätzung ist auf jeder Inseratkarte sichtbar.',
    faq1a: 'Die Preise beginnen bei {min} und reichen bis {max}. Die KI-Preisschätzung ist auf jeder Inseratkarte sichtbar.',
    faq1aEmpty:
      'Der Preis hängt von der Fläche, der Etage, dem Renovierungszustand und der Entfernung zur Station ab. Aktuelle Viertelpreise sehen Sie auf der Viertelsseite, den Wert einer bestimmten Wohnung zeigt die KI-Bewertung jedes Inserats.',
    faq2q: 'Warum sind Wohnungen {near} gefragt?',
    faq2a:
      'Die Metro ist das einzige Verkehrsmittel in Tiflis, das vom dichten Verkehr unberührt bleibt — die Fahrzeit ist zu jeder Tageszeit vorhersehbar. Genau deshalb werden Wohnungen {near} schneller verkauft und vermietet als die von der Station entfernten Teile desselben Viertels.',
    faq3q: 'Wie finde ich verifizierte Inserate {near}?',
    faq3a:
      'Auf dieser Seite sind alle aktiven Inserate innerhalb von 15 Gehminuten von der Station aufgeführt. Auf sivrce durchläuft jedes Inserat eine Datenprüfung: Eigentümer-Verifizierung, Echtheit der Fotos und Vergleich des Preises mit dem Markt.',
    faq4q: 'Kann ich ein Inserat kostenlos einstellen?',
    faq4a:
      'Ja — das Einstellen eines Inserats auf sivrce ist kostenlos. VIP-Pakete (VIP, VIP+, SUPER VIP) zeigen das Inserat ganz oben in den Suchergebnissen und bringen im Durchschnitt 5-mal mehr Aufrufe.',
    ldStation: '{name} — Metrostation',
    city: 'Tiflis',
  },
}

type CopyLang = keyof typeof C
const cLang = (l: Lang): CopyLang => (l === 'ka' || l === 'ru' || l === 'de' ? l : 'en')

const nameOf = (s: MetroStation, l: CopyLang) => (l === 'ka' ? s.ka : s.en)
const nearOf = (s: MetroStation, l: CopyLang) => (l === 'ka' ? s.near : translateRaw(C[l].near, { name: s.en }))
const distLocOf = (d: District, l: CopyLang) => (l === 'ka' ? d.loc : l === 'ru' ? d.ru : d.en)
const distNameOf = (d: District, l: CopyLang) => (l === 'ka' ? d.ka : l === 'ru' ? d.ru : d.en)

function titleOfStation(station: MetroStation, count: number, cl: CopyLang): string {
  const near = nearOf(station, cl)
  return count > 0 ? translateRaw(C[cl].titleFull, { near, n: count }) : translateRaw(C[cl].titleEmpty, { near })
}

function descriptionOfStation(
  station: MetroStation,
  district: District | undefined,
  listings: Listing[],
  cl: CopyLang,
): string {
  const near = nearOf(station, cl)
  const place = district ? `, ${distLocOf(district, cl)}` : ''
  // ≤160 chars — Lighthouse/Google meta-description budget.
  if (listings.length === 0) return translateRaw(C[cl].descEmpty, { near, place })
  const s = statsOf(listings)
  return translateRaw(C[cl].descFull, { near, place, n: s.count, min: formatUSD(s.minPrice) })
}

/** Intro paragraph — unique per station via live stats; honest when empty. */
function introOfStation(station: MetroStation, district: District | undefined, listings: Listing[], cl: CopyLang): string {
  const place = district ? `, ${distLocOf(district, cl)}` : ''
  const v: Record<string, string | number> = { name: nameOf(station, cl), line: station.line, place }
  if (listings.length === 0) return translateRaw(C[cl].introEmpty, v)
  const s = statsOf(listings)
  return translateRaw(C[cl].introFull, {
    ...v,
    lineName: METRO_LINES[station.line],
    n: s.count,
    min: formatUSD(s.minPrice),
    max: formatUSD(s.maxPrice),
    perM2: s.avgPerM2 ? translateRaw(C[cl].perM2Frag, { avg: formatUSD(s.avgPerM2) }) : '',
  })
}

function faqsOfStation(station: MetroStation, listings: Listing[], cl: CopyLang): Faq[] {
  const near = nearOf(station, cl)
  // ka re-inflects the adessive („მეტროსთან“ → „მეტროს მახლობლად“); other locales reuse the phrase.
  const nearLoc = cl === 'ka' ? station.near.replace(/მეტროსთან$/, 'მეტროს მახლობლად') : near
  const s = listings.length > 0 ? statsOf(listings) : null
  const v: Record<string, string | number> = s
    ? { min: formatUSD(s.minPrice), max: formatUSD(s.maxPrice), ...(s.avgPerM2 ? { avg: formatUSD(s.avgPerM2) } : {}) }
    : {}
  return [
    {
      q: translateRaw(C[cl].faq1q, { near }),
      a: s ? (s.avgPerM2 ? translateRaw(C[cl].faq1aAvg, v) : translateRaw(C[cl].faq1a, v)) : translateRaw(C[cl].faq1aEmpty),
    },
    { q: translateRaw(C[cl].faq2q, { near }), a: translateRaw(C[cl].faq2a, { near: nearLoc }) },
    { q: translateRaw(C[cl].faq3q, { near }), a: translateRaw(C[cl].faq3a) },
    { q: translateRaw(C[cl].faq4q), a: translateRaw(C[cl].faq4a) },
  ]
}

function stationLd(
  station: MetroStation,
  district: District | undefined,
  listings: Listing[],
  crumbs: { name: string; href: string }[],
  faqs: Faq[],
  title: string,
  description: string,
  cl: CopyLang,
) {
  const path = `/metro/${station.slug}`
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
      {
        '@type': 'TransitStation',
        name: translateRaw(C[cl].ldStation, { name: nameOf(station, cl) }),
        alternateName: `${station.en} Metro Station`,
        geo: { '@type': 'GeoCoordinates', latitude: station.lat, longitude: station.lng },
        containedInPlace: { '@type': 'City', name: C[cl].city },
        ...(district ? { address: { '@type': 'PostalAddress', addressRegion: distNameOf(district, cl), addressLocality: C[cl].city, addressCountry: 'GE' } } : {}),
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
        itemListElement: crumbs.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          item: `${BASE}${c.href}`,
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: rawLang, station: s } = await params
  const cl = cLang(isValidLang(rawLang) ? rawLang : 'ka')
  const ctx = await resolve(s)
  if (!ctx) return {}
  const title = titleOfStation(ctx.station, ctx.listings.length, cl)
  const description = descriptionOfStation(ctx.station, districtOf(ctx.station), ctx.listings, cl)
  const path = `/metro/${ctx.station.slug}`
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

export default async function MetroStationPage({ params }: PageProps) {
  const { lang: rawLang, station: s } = await params
  const lang = isValidLang(rawLang) ? rawLang : 'ka'
  const cl = cLang(lang)
  const c = C[cl]
  const ctx = await resolve(s)
  if (!ctx) notFound()
  const { station, listings } = ctx
  const district = districtOf(station)
  const neighbours = metroNeighbours(station.slug)
  const near = nearOf(station, cl)

  const stats = listings.length > 0 ? statsOf(listings) : null
  const faqs = faqsOfStation(station, listings, cl)
  const title = titleOfStation(station, listings.length, cl)
  const description = descriptionOfStation(station, district, listings, cl)
  // District hub self-throttles (≥1 listing rule) — link only when it exists.
  const districtHub = district ? parseSeoSlug(['tbilisi', district.slug]) !== null : false

  const crumbs = [
    { name: c.crumbHome, href: '/' },
    { name: c.crumbMetro, href: '/metro' },
    { name: nameOf(station, cl), href: `/metro/${station.slug}` },
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
            <SparkMark className="h-3.5 w-3.5" aria-hidden />{' '}
            {translateRaw(c.lineBadge, { line: station.line, lineName: METRO_LINES[station.line] })}
          </span>
          <WeatherBadge
            coords={{ lat: station.lat, lng: station.lng }}
            label={nameOf(station, cl)}
            className="mb-3 ml-2 rounded-full border border-sv-ink/[0.06] bg-sv-surface px-3 py-1.5 text-sv-ink/60 shadow-card"
          />
          <AirBadge
            coords={{ lat: station.lat, lng: station.lng }}
            lang={lang}
            className="mb-3 ml-2 rounded-full border border-sv-ink/[0.06] bg-sv-surface px-3 py-1.5 text-sv-ink/60 shadow-card"
          />
          <h1 className="max-w-[900px] text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[44px]">
            {translateRaw(c.h1, { near })}
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

        {/* Link mesh — district hub, search, neighbours, metro index */}
        <div className="mb-8 flex flex-wrap gap-2">
          {districtHub && <Chip label={distNameOf(district!, cl)} href={`/tbilisi/${district!.slug}`} />}
          <Chip label={translateRaw(c.chipSearch, { name: nameOf(station, cl) })} href={`/search?q=${encodeURIComponent(station.ka)}`} />
          <Chip
            label={translateRaw(c.chipAll, { name: nameOf(station, cl) })}
            href={`/search?city=${encodeURIComponent('თბილისი')}&district=${encodeURIComponent(district?.ka ?? 'თბილისი')}`}
          />
          {neighbours.map((n) => (
            <Chip key={n.slug} label={translateRaw(c.chipStation, { name: nameOf(n, cl) })} href={`/metro/${n.slug}`} />
          ))}
          <Chip label={c.chipAllStations} href="/metro" active />
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
              <Chip label={translateRaw(c.chipSearch, { name: nameOf(station, cl) })} href={`/search?q=${encodeURIComponent(station.ka)}`} active />
              {district && <Chip label={translateRaw(c.chipDistrict, { name: distNameOf(district, cl) })} href={`/tbilisi/${district.slug}`} />}
              {neighbours.map((n) => (
                <Chip key={n.slug} label={nameOf(n, cl)} href={`/metro/${n.slug}`} />
              ))}
            </div>
          </section>
        )}

        {/* SEO intro */}
        <section className="mt-14 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
          <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
            {translateRaw(c.introTitle, { near })}
          </h2>
          <p className="mt-3 max-w-[860px] text-[15px] font-medium leading-relaxed text-sv-ink/65">
            {introOfStation(station, district, listings, cl)}
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
        dangerouslySetInnerHTML={{
          __html: jsonLd(stationLd(station, district, listings, crumbs, faqs, title, description, cl)),
        }}
      />
    </div>
  )
}
