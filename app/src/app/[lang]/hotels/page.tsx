import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Star, ShieldCheck, Zap, ExternalLink, SlidersHorizontal, Phone } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { jsonLd } from '@/lib/utils'
import { pageMeta } from '@/lib/i18n/server'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { WORLD_PLACES } from '@/data/world-places'
import {
  applyView,
  compareLinks,
  parseStay,
  parseView,
  placeBySlug,
  searchHotels,
  type HotelView,
} from '@/lib/hotels'

interface Copy {
  kicker: string
  title: string
  subtitle: string
  city: string
  checkIn: string
  checkOut: string
  guests: string
  search: string
  liveBadge: string
  browseBadge: string
  pricesUnavailable: string
  website: string
  gdsQuote: string
  feeIncl: (n: number) => string
  otaFrom: (n: number) => string
  refundable: string
  nonRefundable: string
  perNight: (n: number) => string
  perNightShort: string
  compare: string
  emptyLive: string
  emptyUnconfigured: string
  emptyError: string
  emptyFiltered: string
  clearFilters: string
  filters: string
  sortPrice: string
  sortDistance: string
  viewDetails: string
  bookLive: string
  distance: (km: string) => string
  propRates: string
  propRatesSub: string
  propDirect: string
  propDirectSub: string
  propReal: string
  propRealSub: string
  propBook: string
  propBookSub: string
  popularCities: string
  partnerHint: string
}

const COPY: Record<'ka' | 'en' | 'ru' | 'de', Copy> = {
  ka: {
    kicker: 'სასტუმროები',
    title: 'სასტუმროები — ცოცხალი ფასები და ჯავშანი',
    subtitle:
      'რეალური სასტუმროები. ცოცხალი ფასები და ჯავშანი Google Hotels-სა და Booking.com-ზე. პირდაპირი ტელეფონი და საიტი, თუ სასტუმროს აქვს. GDS ტარიფი ბარათზე — როცა Amadeus ჩართულია.',
    city: 'ქალაქი',
    checkIn: 'ჩასვლა',
    checkOut: 'წასვლა',
    guests: 'სტუმრები',
    search: 'ცოცხალი ფასები',
    liveBadge: 'ცოცხალი ფასები',
    browseBadge: 'ღია კატალოგი · OpenStreetMap',
    pricesUnavailable: 'ამ ძიებაზე ცოცხალი ფასები ამჟამად მიუწვდომელია — გახსენი პარტნიორი ქვემოთ დღევანდელი ტარიფისთვის.',
    website: 'ვებსაიტი',
    gdsQuote: 'sivrce',
    feeIncl: (n) => `ჩათვლით ${n} ₾ sivrce`,
    otaFrom: (n) => `OTA ${n} ₾`,
    refundable: 'უფასო გაუქმება',
    nonRefundable: 'გაუქმების გარეშე',
    perNight: (n) => (n === 1 ? '1 ღამე' : `${n} ღამე`),
    perNightShort: '/ღამე',
    compare: 'ცოცხალი ფასები:',
    emptyLive: 'ამ თარიღებზე GDS ადგილი ვერ მოიძებნა — შეადარეთ პარტნიორებზე.',
    emptyUnconfigured: 'GDS ტარიფები გასაღებების შემდეგ გამოჩნდება — პარტნიორებზე ფასები ახლავეა.',
    emptyError: 'GDS დროებით მიუწვდომელია — სცადეთ პარტნიორები.',
    emptyFiltered: 'ფილტრებს ვერაფერი შეესაბამება — შეცვალეთ პირობები.',
    clearFilters: 'ფილტრების გასუფთავება',
    filters: 'ფილტრები',
    sortPrice: 'ჯერ იაფი',
    sortDistance: 'ცენტრთან ახლოს',
    viewDetails: 'ნომრები',
    bookLive: 'ცოცხალი ფასი და ჯავშანი',
    distance: (km) => `${km} კმ ცენტრიდან`,
    propRates: 'ცოცხალი ფასები',
    propRatesSub: 'Google Hotels და Booking.com',
    propDirect: 'პირდაპირი კონტაქტი',
    propDirectSub: 'ტელეფონი და ოფიციალური საიტი',
    propReal: 'რეალური სასტუმროები',
    propRealSub: 'OpenStreetMap კატალოგი',
    propBook: 'ჯავშანი ერთ შეხებით',
    propBookSub: 'პარტნიორის უსაფრთხო გადახდა',
    popularCities: 'პოპულარული მიმართულებები:',
    partnerHint: 'შეადარეთ ცოცხალი ფასები პარტნიორებზე:',
  },
  en: {
    kicker: 'Hotels',
    title: 'Hotels — live rates and booking',
    subtitle:
      'Real hotels. Live prices and booking on Google Hotels and Booking.com. Direct phone and website when the hotel lists them. GDS quotes on-card when Amadeus is connected.',
    city: 'Destination',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    guests: 'Guests',
    search: 'Live rates',
    liveBadge: 'Live rates',
    browseBadge: 'Open directory · OpenStreetMap',
    pricesUnavailable: 'Live prices are unavailable for this search right now — open a partner below for today’s rate.',
    website: 'Website',
    gdsQuote: 'sivrce',
    feeIncl: (n) => `incl. ${n} ₾ sivrce`,
    otaFrom: (n) => `OTA ${n} ₾`,
    refundable: 'Free cancellation',
    nonRefundable: 'Non-refundable',
    perNight: (n) => (n === 1 ? '1 night' : `${n} nights`),
    perNightShort: '/night',
    compare: 'Live prices:',
    emptyLive: 'No GDS availability for these dates — compare live partner rates.',
    emptyUnconfigured: 'GDS quotes appear once provider keys are set — partner rates are live now.',
    emptyError: 'GDS unavailable right now — use partner rates.',
    emptyFiltered: 'Nothing matches these filters — loosen criteria.',
    clearFilters: 'Clear filters',
    filters: 'Filters',
    sortPrice: 'Lowest price',
    sortDistance: 'Closest to centre',
    viewDetails: 'Rooms',
    bookLive: 'Live price & book',
    distance: (km) => `${km} km from centre`,
    propRates: 'Live rates',
    propRatesSub: 'Google Hotels and Booking.com',
    propDirect: 'Direct contact',
    propDirectSub: 'Phone and official site',
    propReal: 'Real hotels',
    propRealSub: 'OpenStreetMap directory',
    propBook: 'Book in one tap',
    propBookSub: 'Secure partner checkout',
    popularCities: 'Popular destinations:',
    partnerHint: 'Compare live prices on partners:',
  },
  ru: {
    kicker: 'Отели',
    title: 'Отели — живые цены и бронь',
    subtitle:
      'Реальные отели. Живые цены и бронь на Google Hotels и Booking.com. Телефон и сайт, если отель их указал. Котировки GDS на карточке — когда подключён Amadeus.',
    city: 'Город',
    checkIn: 'Заезд',
    checkOut: 'Выезд',
    guests: 'Гости',
    search: 'Живые цены',
    liveBadge: 'Живые цены',
    browseBadge: 'Открытый каталог · OpenStreetMap',
    pricesUnavailable: 'Живые цены сейчас недоступны для этого поиска — откройте партнёра ниже, чтобы увидеть сегодняшний тариф.',
    website: 'Сайт',
    gdsQuote: 'sivrce',
    feeIncl: (n) => `вкл. ${n} ₾ sivrce`,
    otaFrom: (n) => `OTA ${n} ₾`,
    refundable: 'Бесплатная отмена',
    nonRefundable: 'Без возврата',
    perNight: (n) => (n === 1 ? '1 ночь' : `${n} ноч.`),
    perNightShort: '/ночь',
    compare: 'Живые цены:',
    emptyLive: 'На эти даты GDS нет мест — сравните у партнёров.',
    emptyUnconfigured: 'Котировки GDS появятся после ключей — цены партнёров уже живые.',
    emptyError: 'GDS временно недоступен — смотрите партнёров.',
    emptyFiltered: 'Фильтрам ничего не соответствует.',
    clearFilters: 'Сбросить фильтры',
    filters: 'Фильтры',
    sortPrice: 'Сначала дешёвые',
    sortDistance: 'Ближе к центру',
    viewDetails: 'Номера',
    bookLive: 'Живая цена и бронь',
    distance: (km) => `${km} км от центра`,
    propRates: 'Живые цены',
    propRatesSub: 'Google Hotels и Booking.com',
    propDirect: 'Прямой контакт',
    propDirectSub: 'Телефон и официальный сайт',
    propReal: 'Реальные отели',
    propRealSub: 'Каталог OpenStreetMap',
    propBook: 'Бронь в один тап',
    propBookSub: 'Оплата у партнёра',
    popularCities: 'Популярные направления:',
    partnerHint: 'Сравните живые цены у партнёров:',
  },
  de: {
    kicker: 'Hotels',
    title: 'Hotels — Live-Preise und Buchung',
    subtitle:
      'Echte Hotels. Live-Preise und Buchung über Google Hotels und Booking.com. Telefon und Website, wenn das Hotel sie nennt. GDS-Kurse auf der Karte, sobald Amadeus verbunden ist.',
    city: 'Ziel',
    checkIn: 'Anreise',
    checkOut: 'Abreise',
    guests: 'Gäste',
    search: 'Live-Preise',
    liveBadge: 'Live-Preise',
    browseBadge: 'Offenes Verzeichnis · OpenStreetMap',
    pricesUnavailable: 'Live-Preise sind für diese Suche gerade nicht verfügbar — Partner unten öffnen für den heutigen Tarif.',
    website: 'Website',
    gdsQuote: 'sivrce',
    feeIncl: (n) => `inkl. ${n} ₾ sivrce`,
    otaFrom: (n) => `OTA ${n} ₾`,
    refundable: 'Kostenlose Stornierung',
    nonRefundable: 'Nicht erstattbar',
    perNight: (n) => (n === 1 ? '1 Nacht' : `${n} Nächte`),
    perNightShort: '/Nacht',
    compare: 'Live-Preise:',
    emptyLive: 'Keine GDS-Verfügbarkeit für diese Daten — Partnerpreise vergleichen.',
    emptyUnconfigured: 'GDS-Kurse nach Anbieter-Schlüsseln — Partnerpreise sind jetzt live.',
    emptyError: 'GDS gerade nicht verfügbar — Partnerpreise nutzen.',
    emptyFiltered: 'Nichts passt zu diesen Filtern.',
    clearFilters: 'Filter leeren',
    filters: 'Filter',
    sortPrice: 'Günstigste',
    sortDistance: 'Nächste zur Mitte',
    viewDetails: 'Zimmer',
    bookLive: 'Live-Preis & buchen',
    distance: (km) => `${km} km vom Zentrum`,
    propRates: 'Live-Preise',
    propRatesSub: 'Google Hotels und Booking.com',
    propDirect: 'Direktkontakt',
    propDirectSub: 'Telefon und offizielle Seite',
    propReal: 'Echte Hotels',
    propRealSub: 'OpenStreetMap-Verzeichnis',
    propBook: 'Buchung in einem Tipp',
    propBookSub: 'Sichere Partnerkasse',
    popularCities: 'Beliebte Reiseziele:',
    partnerHint: 'Live-Preise bei Partnern vergleichen:',
  },
}

const gel = (n: number) => `${Math.round(n).toLocaleString('en-US')} ₾`
const isoDay = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10)

const CITIES = [...WORLD_PLACES].sort((a, b) => a.en.localeCompare(b.en))

const POPULAR_DESTINATIONS = [
  { slug: 'tbilisi', label: 'Tbilisi' },
  { slug: 'batumi', label: 'Batumi' },
  { slug: 'kutaisi', label: 'Kutaisi' },
  { slug: 'berlin', label: 'Berlin' },
  { slug: 'dubai', label: 'Dubai' },
  { slug: 'london', label: 'London' },
  { slug: 'paris', label: 'Paris' },
  { slug: 'rome', label: 'Rome' },
  { slug: 'istanbul', label: 'Istanbul' },
  { slug: 'vienna', label: 'Vienna' },
]

const CAPS = [100, 250, 500]

const chipCls = (active: boolean) =>
  `rounded-full px-4 py-1.5 text-[13px] font-bold transition-all shadow-sm ${
    active
      ? 'bg-sv-blue text-white shadow-glow-blue-sm'
      : 'bg-sv-cloud text-sv-ink/70 hover:bg-sv-blue/10 hover:text-sv-blue'
  }`

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  return pageMeta('/hotels', lang, {
    ka: {
      title: 'სასტუმროები — ცოცხალი ფასები და ჯავშანი',
      description: 'რეალური სასტუმროები. ცოცხალი ფასები და ჯავშანი Google Hotels-სა და Booking.com-ზე. GDS ტარიფები Amadeus-ით, როცა კავშირი ჩართულია.',
    },
    en: {
      title: 'Hotels — live rates and booking',
      description: 'Real hotels. Live prices and booking on Google Hotels and Booking.com. GDS quotes from Amadeus when connected.',
    },
    ru: {
      title: 'Отели — живые цены и бронь',
      description: 'Реальные отели. Живые цены и бронь на Google Hotels и Booking.com. Котировки GDS из Amadeus при подключении.',
    },
    de: {
      title: 'Hotels — Live-Preise und Buchung',
      description: 'Echte Hotels. Live-Preise und Buchung über Google Hotels und Booking.com. GDS-Kurse von Amadeus, wenn verbunden.',
    },
  })
}

interface PageProps {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function HotelsPage({ params, searchParams }: PageProps) {
  const [{ lang: raw }, sp] = await Promise.all([params, searchParams])
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  const copy = COPY[lang as keyof typeof COPY] ?? COPY.en

  const citySlug = typeof sp.city === 'string' && placeBySlug(sp.city) ? sp.city : 'tbilisi'
  const checkIn = typeof sp.checkIn === 'string' && sp.checkIn ? sp.checkIn : isoDay(7)
  const checkOut = typeof sp.checkOut === 'string' && sp.checkOut ? sp.checkOut : isoDay(9)
  const adultsRaw = Number.parseInt(typeof sp.adults === 'string' ? sp.adults : '2', 10)
  const adults = Number.isFinite(adultsRaw) ? Math.min(Math.max(adultsRaw, 1), 9) : 2
  const view = parseView(
    typeof sp.sort === 'string' ? sp.sort : undefined,
    typeof sp.refund === 'string' ? sp.refund : undefined,
    typeof sp.max === 'string' ? sp.max : undefined,
  )

  const place = placeBySlug(citySlug)!
  const stay = parseStay(checkIn, checkOut)
  const nights = stay?.nights ?? 2

  const base: Record<string, string> = { city: citySlug, checkIn, checkOut, adults: String(adults) }
  if (view.sort !== 'price') base.sort = view.sort
  if (view.refundOnly) base.refund = '1'
  if (view.maxGel !== null) base.max = String(view.maxGel)
  const qs = (over: Record<string, string | null> = {}) => {
    const p = new URLSearchParams(base)
    for (const [k, v] of Object.entries(over)) {
      if (v === null) p.delete(k)
      else p.set(k, v)
    }
    return p.toString()
  }

  return (
    <>
      <Navbar />
      <PageHero kicker={copy.kicker} title={copy.title} subtitle={copy.subtitle}>
        <div className="mx-auto w-full max-w-4xl">
          <form method="get" className="mt-8 grid grid-cols-1 gap-3 rounded-card bg-sv-surface/10 p-3 backdrop-blur-md border border-white/15 md:grid-cols-12" aria-label={copy.search}>
            <label className="flex flex-col gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-sv-blue-light md:col-span-4">
              {copy.city}
              <select
                name="city"
                defaultValue={citySlug}
                className="h-11 rounded-control border border-white/20 bg-sv-surface px-3 py-2 text-[15px] font-bold text-sv-ink focus:border-sv-blue focus:outline-none"
              >
                {CITIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.en} {c.ka !== c.en ? `(${c.ka})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-sv-blue-light md:col-span-3">
              {copy.checkIn}
              <input
                type="date"
                name="checkIn"
                defaultValue={checkIn}
                min={isoDay(0)}
                required
                className="h-11 rounded-control border border-white/20 bg-sv-surface px-3 py-2 text-[14px] font-bold text-sv-ink focus:border-sv-blue focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-sv-blue-light md:col-span-3">
              {copy.checkOut}
              <input
                type="date"
                name="checkOut"
                defaultValue={checkOut}
                min={isoDay(1)}
                required
                className="h-11 rounded-control border border-white/20 bg-sv-surface px-3 py-2 text-[14px] font-bold text-sv-ink focus:border-sv-blue focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-sv-blue-light md:col-span-2">
              {copy.guests}
              <select
                name="adults"
                defaultValue={String(adults)}
                className="h-11 rounded-control border border-white/20 bg-sv-surface px-3 py-2 text-[15px] font-bold text-sv-ink focus:border-sv-blue focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="md:col-span-12 mt-1">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-control bg-sv-orange px-6 py-3.5 text-[16px] font-black text-sv-ink shadow-glow-orange transition-all hover:scale-[1.01] hover:brightness-105 active:scale-[0.99]"
              >
                <Zap size={18} className="shrink-0" />
                {copy.search}
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[12px] font-bold text-white/80">
            <span className="text-sv-blue-light">{copy.popularCities}</span>
            {POPULAR_DESTINATIONS.map((dest) => (
              <a
                key={dest.slug}
                href={`?${qs({ city: dest.slug })}`}
                className={`rounded-full px-3 py-1 transition-all ${
                  citySlug === dest.slug
                    ? 'bg-white text-sv-ink shadow-glow-blue-sm font-extrabold'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {dest.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-4">
          {(
            [
              [copy.propRates, copy.propRatesSub, Zap],
              [copy.propDirect, copy.propDirectSub, Phone],
              [copy.propReal, copy.propRealSub, ShieldCheck],
              [copy.propBook, copy.propBookSub, Star],
            ] as const
          ).map(([t, s, Icon]) => (
            <div key={t} className="flex items-center gap-3 rounded-module border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-sv-blue/20 text-sv-blue-light">
                <Icon size={20} />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-extrabold text-white">{t}</p>
                <p className="text-[11px] font-medium text-white/60">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </PageHero>

      <main className="mx-auto max-w-[1440px] px-5 pb-24 pt-10 md:px-10">
        <Suspense key={qs()} fallback={<ResultsSkeleton />}>
          <Results
            lang={lang}
            copy={copy}
            placeLat={place.lat}
            placeLng={place.lng}
            placeEn={place.en}
            checkIn={checkIn}
            checkOut={checkOut}
            adults={adults}
            nights={nights}
            stayValid={stay !== null}
            view={view}
            qs={qs}
          />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}

function ResultsSkeleton() {
  return (
    <>
      <div className="mb-4 flex items-center justify-between" aria-hidden>
        <div className="h-9 w-56 animate-pulse rounded-lg bg-sv-cloud" />
        <div className="h-7 w-44 animate-pulse rounded-full bg-sv-cloud" />
      </div>
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex flex-col gap-4 rounded-card bg-sv-surface p-5 shadow-card">
            <div className="h-40 animate-pulse rounded-tile bg-sv-cloud" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-sv-cloud" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-sv-cloud" />
            <div className="mt-auto h-12 w-full animate-pulse rounded-control bg-sv-cloud" />
          </li>
        ))}
      </ul>
    </>
  )
}

function HotelPhoto({ src, name }: { src: string | null; name: string }) {
  return (
    <div className="relative mb-4 h-40 w-full overflow-hidden rounded-tile bg-sv-navy">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- ponytail: images unoptimized per next.config
        <img
          src={src}
          alt={name}
          width={360}
          height={160}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="h-full w-full object-cover"
        />
      ) : (
        <p className="flex h-full items-end p-4 text-[48px] font-black leading-none tracking-[-0.04em] text-white/25" aria-hidden>
          {name.slice(0, 1)}
        </p>
      )}
    </div>
  )
}

async function Results({
  lang,
  copy,
  placeLat,
  placeLng,
  placeEn,
  checkIn,
  checkOut,
  adults,
  nights,
  stayValid,
  view,
  qs,
}: {
  lang: Lang
  copy: Copy
  placeLat: number
  placeLng: number
  placeEn: string
  checkIn: string
  checkOut: string
  adults: number
  nights: number
  stayValid: boolean
  view: HotelView
  qs: (over?: Record<string, string | null>) => string
}) {
  const result = stayValid ? await searchHotels({ lat: placeLat, lng: placeLng, checkIn, checkOut, adults }) : null
  const browse = result?.browse ?? []
  const pricedBrowse = browse.filter((h) => h.totalGel && h.totalGel > 0)
  const mode = stayValid ? (result?.mode ?? 'error') : 'live'
  const showLive = mode === 'live' || pricedBrowse.length > 0
  const filtered = applyView(result?.hotels ?? [], view, nights)
  const overFiltered = !stayValid || mode !== 'live' ? false : filtered.length === 0 && (result?.hotels.length ?? 0) > 0

  const hotelsItems =
    mode === 'live' && filtered.length
      ? filtered.slice(0, 10).map((h, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Hotel',
            name: h.name,
            address: h.address ?? undefined,
            offers: {
              '@type': 'Offer',
              price: h.providerGel,
              priceCurrency: 'GEL',
              availability: 'https://schema.org/InStock',
              validFrom: checkIn,
            },
          },
        }))
      : mode === 'browse' && browse.length
        ? browse.slice(0, 10).map((h, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Hotel',
              name: h.name,
              address: h.address ?? undefined,
              ...(h.stars ? { starRating: { '@type': 'Rating', ratingValue: h.stars } } : {}),
              ...(h.providerGel
                ? {
                    offers: {
                      '@type': 'Offer',
                      price: h.providerGel,
                      priceCurrency: 'GEL',
                      availability: 'https://schema.org/InStock',
                      validFrom: checkIn,
                    },
                  }
                : {}),
            },
          }))
        : []

  const hotelsLd = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://sivrce.ge/hotels#webpage',
        url: 'https://sivrce.ge/hotels',
        name: copy.title,
        description: copy.subtitle,
        inLanguage: lang,
        isPartOf: { '@id': 'https://sivrce.ge/#website' },
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['h1', '.speakable-lead', 'h2'],
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'sivrce', item: 'https://sivrce.ge' },
          { '@type': 'ListItem', position: 2, name: copy.kicker, item: 'https://sivrce.ge/hotels' },
        ],
      },
      ...(hotelsItems.length
        ? [
            {
              '@type': 'ItemList',
              itemListElement: hotelsItems,
            },
          ]
        : []),
    ],
  })

  const header = (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-sv-cloud pb-5">
        <div>
          <h2 className="sv-h2 text-sv-ink">
            {placeEn} · {copy.perNight(nights)}
          </h2>
          <p className="mt-1 text-[13px] font-medium text-sv-ink/60">
            {mode === 'live' ? `${filtered.length}` : `${browse.length}`} · {placeEn}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-extrabold text-sv-blue shadow-sm">
          <span className="h-2 w-2 rounded-full bg-sv-blue animate-pulse" />
          {showLive ? copy.liveBadge : copy.browseBadge}
        </span>
      </div>
      {mode === 'live' ? (
        <nav aria-label={copy.filters} className="mb-8 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-[12px] font-black uppercase tracking-[0.14em] text-sv-ink/40 mr-2">
            <SlidersHorizontal size={14} />
            {copy.filters}
          </span>
          <a href={`?${qs({ sort: null })}`} className={chipCls(view.sort === 'price')} aria-current={view.sort === 'price' ? 'true' : undefined}>
            {copy.sortPrice}
          </a>
          <a href={`?${qs({ sort: 'distance' })}`} className={chipCls(view.sort === 'distance')} aria-current={view.sort === 'distance' ? 'true' : undefined}>
            {copy.sortDistance}
          </a>
          <a href={`?${qs({ refund: view.refundOnly ? null : '1' })}`} className={chipCls(view.refundOnly)} aria-current={view.refundOnly ? 'true' : undefined}>
            {copy.refundable}
          </a>
          {CAPS.map((cap) => (
            <a
              key={cap}
              href={`?${qs({ max: view.maxGel === cap ? null : String(cap) })}`}
              className={chipCls(view.maxGel === cap)}
              aria-current={view.maxGel === cap ? 'true' : undefined}
            >
              ≤ {cap} ₾{copy.perNightShort}
            </a>
          ))}
        </nav>
      ) : null}
    </>
  )

  const partnerRow = (query: string, all = false) => {
    const items = compareLinks(query, checkIn, checkOut, adults).slice(0, all ? 6 : 4)
    return (
      <p className="mt-3 border-t border-sv-cloud pt-3 text-[13px] font-medium text-sv-ink/60">
        <span className="font-bold text-sv-ink/80 mr-2">{copy.compare}</span>
        {items.map((l, i) => (
          <span key={l.name} className="inline-flex items-center gap-1">
            {i > 0 ? <span className="text-sv-ink/20">·</span> : null}
            <a
              href={l.url}
              target="_blank"
              rel="noopener nofollow"
              className="text-sv-blue underline decoration-sv-blue/30 underline-offset-2 hover:decoration-sv-blue font-semibold hover:text-sv-blue-deep"
            >
              {l.name}
            </a>
          </span>
        ))}
      </p>
    )
  }

  if (mode === 'browse' && browse.length) {
    return (
      <>
        {hotelsLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: hotelsLd }} /> : null}
        {header}
        {pricedBrowse.length === 0 ? (
          // The hero promises live rates; when the OTA feed returns nothing we
          // say so instead of rendering a price-less directory that looks like
          // the prices are simply missing. Partner links below still work.
          <p
            role="status"
            className="mb-6 rounded-card border border-sv-orange/25 bg-sv-orange/[0.07] px-5 py-4 text-[13px] font-semibold text-sv-ink/75"
          >
            {copy.pricesUnavailable}
          </p>
        ) : null}
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {browse.map((h) => {
            const book = compareLinks(`${h.name} ${placeEn}`, checkIn, checkOut, adults)[0]
            return (
              <li key={h.id} className="flex flex-col rounded-card bg-sv-surface p-5 shadow-card border border-sv-cloud">
                <HotelPhoto src={h.image} name={h.name} />
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[19px] font-black leading-snug tracking-[-0.03em] text-sv-ink">{h.name}</h3>
                  {h.stars ? (
                    <span className="shrink-0 rounded-full bg-sv-cloud px-2.5 py-1 text-[11px] font-extrabold text-sv-ink">
                      {h.stars}★
                    </span>
                  ) : null}
                </div>
                {h.address || h.distanceKm !== null ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-sv-ink/60">
                    <MapPin size={14} className="shrink-0 text-sv-blue" aria-hidden />
                    <span className="truncate">{h.address ?? placeEn}</span>
                    {h.distanceKm !== null ? <span>· {copy.distance(h.distanceKm.toFixed(1))}</span> : null}
                  </p>
                ) : null}
                <div className="mt-auto pt-5 flex flex-col gap-3">
                  {h.totalGel ? (
                    <div className="rounded-tile bg-sv-cloud/70 p-3.5 border border-sv-cloud">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-sv-ink/40">{copy.gdsQuote}</p>
                      <p className="text-[26px] font-black leading-tight text-sv-ink">{gel(h.totalGel)}</p>
                      <p className="text-[13px] font-bold text-sv-ink/70">
                        ≈ {gel(h.totalGel / nights)}
                        {copy.perNightShort} · {copy.perNight(nights)}
                      </p>
                      <p className="mt-1 text-[12px] font-semibold text-sv-ink/50">
                        {copy.feeIncl(h.feeGel ?? 0)} · {copy.otaFrom(h.providerGel ?? h.totalGel)}
                      </p>
                    </div>
                  ) : null}
                  <a
                    href={book.url}
                    target="_blank"
                    rel="noopener nofollow"
                    className="inline-flex items-center justify-center gap-2 rounded-control bg-sv-orange px-4 py-3 text-[14px] font-extrabold text-sv-ink shadow-glow-orange"
                  >
                    {copy.bookLive} <ExternalLink size={14} />
                  </a>
                  {h.taKey ? (
                    <Link
                      href={`/${lang}/hotels/${h.taKey}?${qs()}&name=${encodeURIComponent(h.name)}`}
                      className="inline-flex items-center justify-center rounded-control bg-sv-blue py-2.5 text-[14px] font-extrabold text-white"
                    >
                      {copy.viewDetails}
                    </Link>
                  ) : null}
                  <div className="flex items-center justify-between text-[13px] font-bold">
                    {h.website ? (
                      <a
                        href={h.website}
                        target="_blank"
                        rel="noopener nofollow"
                        className="inline-flex items-center gap-1 text-sv-blue underline decoration-sv-blue/30 underline-offset-2 hover:decoration-sv-blue"
                      >
                        {copy.website} <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span />
                    )}
                    {h.phone ? (
                      <a href={`tel:${h.phone.replace(/\s/g, '')}`} className="text-sv-ink/60 hover:text-sv-blue">
                        {h.phone}
                      </a>
                    ) : null}
                  </div>
                  {partnerRow(`${h.name} ${placeEn}`)}
                </div>
              </li>
            )
          })}
        </ul>
        <div className="mt-10 rounded-card bg-sv-surface p-6 shadow-card border border-sv-cloud">
          <p className="text-[14px] font-bold text-sv-ink mb-1">{copy.partnerHint}</p>
          {partnerRow(placeEn, true)}
        </div>
        <p className="mt-6 max-w-3xl text-[12px] font-medium leading-relaxed text-sv-ink/40">
          OpenStreetMap · Nominatim · Photon · Xotelo OTA · © OpenStreetMap contributors (ODbL)
        </p>
      </>
    )
  }

  if (mode !== 'live' || filtered.length === 0) {
    return (
      <>
        {hotelsLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: hotelsLd }} /> : null}
        {header}
        <div className="rounded-card bg-sv-surface p-12 text-center shadow-card border border-sv-cloud">
          <p className="text-[18px] font-bold text-sv-ink">
            {overFiltered
              ? copy.emptyFiltered
              : !stayValid || mode === 'live'
                ? copy.emptyLive
                : mode === 'unconfigured'
                  ? copy.emptyUnconfigured
                  : copy.emptyError}
          </p>
          <div className="mx-auto mt-8 max-w-2xl rounded-module bg-sv-cloud p-4 text-left">
            <p className="text-[13px] font-bold text-sv-ink/70 mb-2">{copy.partnerHint}</p>
            {partnerRow(placeEn, true)}
          </div>
          {overFiltered ? (
            <p className="mt-6">
              <a
                href={`?${qs({ sort: null, refund: null, max: null })}`}
                className="inline-flex items-center gap-2 rounded-control bg-sv-blue px-5 py-2.5 text-[14px] font-bold text-white shadow-glow-blue-sm"
              >
                {copy.clearFilters}
              </a>
            </p>
          ) : null}
        </div>
      </>
    )
  }

  return (
    <>
      {hotelsLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: hotelsLd }} /> : null}
      {header}
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((h) => {
          const book = compareLinks(`${h.name} ${placeEn}`, checkIn, checkOut, adults)[0]
          return (
            <li key={h.offerId ?? h.hotelId} className="flex flex-col rounded-card bg-sv-surface p-5 shadow-card border border-sv-cloud">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[19px] font-black leading-snug tracking-[-0.03em] text-sv-ink">{h.name}</h3>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-extrabold ${
                    h.refundable ? 'bg-sv-blue/10 text-sv-blue' : 'bg-sv-cloud text-sv-ink/60'
                  }`}
                >
                  {h.refundable ? copy.refundable : copy.nonRefundable}
                </span>
              </div>
              {h.address || h.distanceKm !== null ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-sv-ink/60">
                  <MapPin size={14} className="shrink-0 text-sv-blue" aria-hidden />
                  <span className="truncate">{h.address ?? placeEn}</span>
                  {h.distanceKm !== null ? <span>· {copy.distance(h.distanceKm.toFixed(1))}</span> : null}
                </p>
              ) : null}
              {h.roomType ? <p className="mt-1 text-[13px] font-semibold text-sv-ink/50">{h.roomType}</p> : null}
              <div className="mt-4 rounded-tile bg-sv-cloud/70 p-3.5 border border-sv-cloud">
                <p className="text-[11px] font-bold uppercase tracking-wider text-sv-ink/40">{copy.gdsQuote}</p>
                <p className="text-[26px] font-black leading-tight text-sv-ink">{gel(h.totalGel)}</p>
                <p className="text-[13px] font-bold text-sv-ink/70">
                  ≈ {gel(h.totalGel / nights)}
                  {copy.perNightShort} · {copy.perNight(nights)}
                </p>
                <p className="mt-1 text-[12px] font-semibold text-sv-ink/50">
                  {copy.feeIncl(h.feeGel)} · {copy.otaFrom(h.providerGel)}
                </p>
              </div>
              <div className="mt-auto pt-4 flex flex-col gap-2">
                <a
                  href={book.url}
                  target="_blank"
                  rel="noopener nofollow"
                  className="inline-flex items-center justify-center gap-2 rounded-control bg-sv-orange px-4 py-3 text-[14px] font-extrabold text-sv-ink shadow-glow-orange"
                >
                  {copy.bookLive} <ExternalLink size={14} />
                </a>
                <Link
                  href={`/${lang}/hotels/${h.hotelId}?${qs()}`}
                  className="inline-flex items-center justify-center rounded-control bg-sv-blue py-2.5 text-[14px] font-extrabold text-white"
                >
                  {copy.viewDetails}
                </Link>
                {partnerRow(`${h.name} ${placeEn}`)}
              </div>
            </li>
          )
        })}
      </ul>
      <div className="mt-10 rounded-card bg-sv-surface p-6 shadow-card border border-sv-cloud">
        <p className="text-[14px] font-bold text-sv-ink mb-1">{copy.partnerHint}</p>
        {partnerRow(placeEn, true)}
      </div>
      <p className="mt-6 max-w-3xl text-[13px] font-medium leading-relaxed text-sv-ink/40">
        Amadeus GDS · Xotelo OTA · {result?.fx === 'live' ? 'FX: open.er-api.com' : 'FX: fallback'} · quote, confirm on partner
      </p>
    </>
  )
}
