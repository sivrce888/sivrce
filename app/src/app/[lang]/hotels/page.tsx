import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
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
  website: string
  feeNote: (fee: string) => string
  providerRate: string
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
  distance: (km: string) => string
}

const COPY: Record<'ka' | 'en' | 'ru' | 'de', Copy> = {
  ka: {
    kicker: 'სასტუმროები',
    title: 'სასტუმროები ცოცხალი ფასებით',
    subtitle: 'GDS-ის ფასები პირდაპირ ავიაციის სისტემიდან — გამჭვირვალე სერვისის საფასურით, დამატებით გადასახადების გარეშე.',
    city: 'ქალაქი',
    checkIn: 'ჩასვლა',
    checkOut: 'წასვლა',
    guests: 'სტუმრები',
    search: 'ძებნა',
    liveBadge: 'ცოცხალი ფასები · Amadeus GDS',
    browseBadge: 'ღია კატალოგი · OpenStreetMap',
    website: 'ვებსაიტი',
    feeNote: (fee) => `მოიცავს ${fee} ₾ sivrce-ის სერვისის საფასურს`,
    providerRate: 'მომწოდებლის ფასი',
    refundable: 'თავისუფალი გაუქმება',
    nonRefundable: 'არა აბრულებს',
    perNight: (n) => (n === 1 ? '1 ღამე' : `${n} ღამე`),
    perNightShort: '/ღამე',
    compare: 'შედარება:',
    emptyLive: 'ამ თარიღებზე ხელმისაწვდომობა ვერ მოიძებნა — სცადეთ სხვა თარიღები.',
    emptyUnconfigured: 'ცოცხალი ფასები მალე ჩაირთვება — მომწოდებლის გასაღებები მოლოდინშია.',
    emptyError: 'ფასები ამჟამად მიუწვდომელია — სცადეთ ხელახლა.',
    emptyFiltered: 'ფილტრებს ვერაფერი შეესაბამება — შეცვალეთ პირობები.',
    clearFilters: 'ფილტრების გასუფთავება',
    filters: 'ფილტრები',
    sortPrice: 'ჯერ იაფი',
    sortDistance: 'ცენტრთან ახლოს',
    viewDetails: 'ნახვა',
    distance: (km) => `${km} კმ ცენტრიდან`,
  },
  en: {
    kicker: 'Hotels',
    title: 'Hotels with live rates',
    subtitle: 'GDS rates straight from the airline-grade inventory system — transparent service fee, no hidden extras.',
    city: 'City',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    guests: 'Guests',
    search: 'Search',
    liveBadge: 'Live rates · Amadeus GDS',
    browseBadge: 'Open directory · OpenStreetMap',
    website: 'Website',
    feeNote: (fee) => `Includes ${fee} ₾ Sivrce service fee`,
    providerRate: 'Provider rate',
    refundable: 'Free cancellation',
    nonRefundable: 'Non-refundable',
    perNight: (n) => (n === 1 ? '1 night' : `${n} nights`),
    perNightShort: '/night',
    compare: 'Compare:',
    emptyLive: 'No availability for these dates — try different dates.',
    emptyUnconfigured: 'Live rates arrive here soon — provider keys pending.',
    emptyError: 'Rates unavailable right now — please retry.',
    emptyFiltered: 'Nothing matches these filters — loosen them a little.',
    clearFilters: 'Clear filters',
    filters: 'Filters',
    sortPrice: 'Cheapest first',
    sortDistance: 'Closest to centre',
    viewDetails: 'View details',
    distance: (km) => `${km} km from centre`,
  },
  ru: {
    kicker: 'Отели',
    title: 'Отели с живыми ценами',
    subtitle: 'Цены GDS напрямую из системы уровня авиационных бронирований — прозрачный сервисный сбор, без скрытых доплат.',
    city: 'Город',
    checkIn: 'Заезд',
    checkOut: 'Выезд',
    guests: 'Гости',
    search: 'Найти',
    liveBadge: 'Живые цены · Amadeus GDS',
    browseBadge: 'Открытый каталог · OpenStreetMap',
    website: 'Сайт',
    feeNote: (fee) => `Включая ${fee} ₾ сервисный сбор sivrce`,
    providerRate: 'Цена поставщика',
    refundable: 'Бесплатная отмена',
    nonRefundable: 'Без возврата',
    perNight: (n) => (n === 1 ? '1 ночь' : `${n} ноч.`),
    perNightShort: '/ночь',
    compare: 'Сравнить:',
    emptyLive: 'Нет доступности на эти даты — попробуйте другие.',
    emptyUnconfigured: 'Живые цены появятся здесь скоро — ключи поставщика на подходе.',
    emptyError: 'Цены временно недоступны — повторите попытку.',
    emptyFiltered: 'Под фильтры ничего не подошло — ослабьте условия.',
    clearFilters: 'Сбросить фильтры',
    filters: 'Фильтры',
    sortPrice: 'Сначала дешёвые',
    sortDistance: 'Ближе к центру',
    viewDetails: 'Подробнее',
    distance: (km) => `${km} км от центра`,
  },
  de: {
    kicker: 'Hotels',
    title: 'Hotels mit Live-Preisen',
    subtitle: 'GDS-Preise direkt aus dem Reservierungssystem der Flugbranche — transparente Servicegebühr, keine versteckten Kosten.',
    city: 'Stadt',
    checkIn: 'Anreise',
    checkOut: 'Abreise',
    guests: 'Gäste',
    search: 'Suchen',
    liveBadge: 'Live-Preise · Amadeus GDS',
    browseBadge: 'Offenes Verzeichnis · OpenStreetMap',
    website: 'Website',
    feeNote: (fee) => `Inklusive ${fee} ₾ Sivrce-Servicegebühr`,
    providerRate: 'Anbieterpreis',
    refundable: 'Kostenlose Stornierung',
    nonRefundable: 'Nicht erstattbar',
    perNight: (n) => (n === 1 ? '1 Nacht' : `${n} Nächte`),
    perNightShort: '/Nacht',
    compare: 'Vergleichen:',
    emptyLive: 'Für diese Daten keine Verfügbarkeit — andere Daten versuchen.',
    emptyUnconfigured: 'Live-Preise folgen in Kürze — Anbieter-Schlüssel ausstehend.',
    emptyError: 'Preise gerade nicht verfügbar — bitte erneut versuchen.',
    emptyFiltered: 'Nichts passt zu diesen Filtern — etwas lockern.',
    clearFilters: 'Filter zurücksetzen',
    filters: 'Filter',
    sortPrice: 'Günstigste zuerst',
    sortDistance: 'Zentrumsnähe',
    viewDetails: 'Ansehen',
    distance: (km) => `${km} km vom Zentrum`,
  },
}

const gel = (n: number) => `${Math.round(n).toLocaleString('en-US')} ₾`
const isoDay = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10)

const CITIES = [...WORLD_PLACES].sort((a, b) => a.en.localeCompare(b.en))

/** Per-night price-cap chips, ₾ — language-neutral labels. */
const CAPS = [100, 250, 500]

/** Deterministic brand-gradient monogram — no provider photos exist, none invented. */
const MONOGRAMS = [
  'from-sv-blue to-sv-violet',
  'from-sv-violet to-sv-navy-soft',
  'from-sv-orange to-sv-violet',
  'from-sv-blue to-sv-navy-soft',
]
const monogram = (id: string) => MONOGRAMS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % MONOGRAMS.length]

const chipCls = (active: boolean) =>
  `rounded-full px-4 py-1.5 text-[12px] font-bold transition-colors ${
    active ? 'bg-sv-blue text-white' : 'bg-sv-cloud text-sv-ink/60 hover:bg-sv-blue/10 hover:text-sv-blue'
  }`

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  return pageMeta('/hotels', lang, {
    ka: {
      title: 'სასტუმროები ცოცხალი ფასებით',
      description: 'სასტუმროების ფასები ცოცხლად, Amadeus GDS-დან. გამჭვირვალე სერვისის საფასური, შედარება Booking-სა და Expedia-სთან.',
    },
    en: {
      title: 'Hotels with live rates',
      description: 'Live hotel rates from the Amadeus GDS. Transparent service fee, side-by-side with Booking.com and Expedia.',
    },
    ru: {
      title: 'Отели с живыми ценами',
      description: 'Живые цены на отели из Amadeus GDS. Прозрачный сервисный сбор, сравнение с Booking.com и Expedia.',
    },
    de: {
      title: 'Hotels mit Live-Preisen',
      description: 'Live-Hotelpreise aus dem Amadeus GDS. Transparente Servicegebühr, Vergleich mit Booking.com und Expedia.',
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

  // URL state for chips + detail links; chips flip one key and keep the rest.
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
        <form method="get" className="mt-8 flex flex-wrap items-end gap-3" aria-label={copy.search}>
          <label className="flex min-w-[10rem] flex-1 flex-col gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-sv-blue-light">
            {copy.city}
            <select
              name="city"
              defaultValue={citySlug}
              className="rounded-control border border-white/20 bg-sv-surface px-3 py-2.5 text-[15px] font-semibold text-sv-ink"
            >
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.en}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-sv-blue-light">
            {copy.checkIn}
            <input
              type="date"
              name="checkIn"
              defaultValue={checkIn}
              min={isoDay(0)}
              required
              className="rounded-control border border-white/20 bg-sv-surface px-3 py-2.5 text-[15px] font-semibold text-sv-ink"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-sv-blue-light">
            {copy.checkOut}
            <input
              type="date"
              name="checkOut"
              defaultValue={checkOut}
              min={isoDay(1)}
              required
              className="rounded-control border border-white/20 bg-sv-surface px-3 py-2.5 text-[15px] font-semibold text-sv-ink"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-sv-blue-light">
            {copy.guests}
            <select
              name="adults"
              defaultValue={String(adults)}
              className="rounded-control border border-white/20 bg-sv-surface px-3 py-2.5 text-[15px] font-semibold text-sv-ink"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-control bg-sv-orange px-6 py-3 text-[15px] font-black text-sv-ink shadow-glow-orange transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {copy.search}
          </button>
        </form>
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
        <div className="h-9 w-56 animate-pulse rounded bg-sv-cloud" />
        <div className="h-7 w-44 animate-pulse rounded-full bg-sv-cloud" />
      </div>
      <div className="mb-6 flex gap-2" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-sv-cloud" />
        ))}
      </div>
      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex flex-col gap-4 rounded-card bg-sv-surface p-5 shadow-card">
            <div className="h-28 animate-pulse rounded-control bg-sv-cloud" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-sv-cloud" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-sv-cloud" />
            <div className="mt-auto h-9 w-1/3 animate-pulse rounded bg-sv-cloud" />
          </li>
        ))}
      </ul>
    </>
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
  const mode = stayValid ? (result?.mode ?? 'error') : 'live'
  const links = compareLinks(placeEn, checkIn, checkOut, adults)
  const filtered = applyView(result?.hotels ?? [], view, nights)
  const browse = result?.browse ?? []
  const overFiltered = !stayValid || mode !== 'live' ? false : filtered.length === 0 && (result?.hotels.length ?? 0) > 0

  const hotelsLd =
    mode === 'live' && filtered.length
      ? jsonLd({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: filtered.slice(0, 10).map((h, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Hotel',
              name: h.name,
              address: h.address ?? undefined,
              offers: {
                '@type': 'Offer',
                price: h.totalGel,
                priceCurrency: 'GEL',
                availability: 'https://schema.org/InStock',
                validFrom: checkIn,
              },
            },
          })),
        })
      : mode === 'browse' && browse.length
        ? jsonLd({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: browse.slice(0, 10).map((h, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'Hotel',
                name: h.name,
                address: h.address ?? undefined,
                ...(h.stars ? { starRating: { '@type': 'Rating', ratingValue: h.stars } } : {}),
              },
            })),
          })
        : null

  // Mode is only known after the search resolves, so the title row + filter
  // chips live here — chips are meaningless in browse mode and stay hidden.
  const header = (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="sv-h2 text-sv-ink">
          {placeEn} · {copy.perNight(nights)}
        </h2>
        <span className="rounded-full bg-sv-cloud px-4 py-1.5 text-[12px] font-bold text-sv-ink/60">
          {mode === 'browse' ? copy.browseBadge : copy.liveBadge}
        </span>
      </div>
      {mode === 'live' ? (
        <nav aria-label={copy.filters} className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-sv-ink/40">{copy.filters}</span>
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

  const compareRow = (
    <p className="border-t border-sv-cloud pt-3 text-[13px] font-semibold text-sv-ink/60">
      {copy.compare}{' '}
      {links.map((l, i) => (
        <span key={l.name}>
          {i > 0 ? ' · ' : ''}
          <a
            href={l.url}
            target="_blank"
            rel="noopener nofollow"
            className="text-sv-blue underline decoration-sv-blue/30 underline-offset-2 hover:decoration-sv-blue"
          >
            {l.name}
          </a>
        </span>
      ))}
    </p>
  )

  if (mode === 'browse' && browse.length) {
    return (
      <>
        {hotelsLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: hotelsLd }} /> : null}
        {header}
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {browse.map((h) => (
            <li
              key={h.id}
              className="flex flex-col gap-4 rounded-card bg-sv-surface p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div
                aria-hidden
                className={`flex h-28 items-center justify-center rounded-control bg-gradient-to-br ${monogram(h.id)}`}
              >
                <span className="text-[30px] font-black text-white/90">{h.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[18px] font-extrabold leading-snug text-sv-ink">{h.name}</h3>
                {h.stars ? (
                  <span className="shrink-0 text-[13px] font-bold tracking-[0.1em] text-sv-orange" aria-label={`${h.stars}★`}>
                    {'★'.repeat(h.stars)}
                  </span>
                ) : null}
              </div>
              {h.address || h.distanceKm !== null ? (
                <p className="flex items-center gap-1.5 text-[14px] font-medium text-sv-ink/50">
                  <MapPin size={14} className="shrink-0 text-sv-blue" aria-hidden />
                  {h.address}
                  {h.address && h.distanceKm !== null ? ' · ' : ''}
                  {h.distanceKm !== null ? copy.distance(h.distanceKm.toFixed(1)) : ''}
                </p>
              ) : null}
              <div className="mt-auto flex flex-col gap-2">
                {h.website ? (
                  <a
                    href={h.website}
                    target="_blank"
                    rel="noopener nofollow"
                    className="w-fit text-[14px] font-bold text-sv-blue underline decoration-sv-blue/30 underline-offset-2 hover:decoration-sv-blue"
                  >
                    {copy.website} ↗
                  </a>
                ) : null}
                {h.phone ? (
                  <a href={`tel:${h.phone.replace(/\s/g, '')}`} className="w-fit text-[14px] font-semibold text-sv-ink/60 hover:text-sv-blue">
                    {h.phone}
                  </a>
                ) : null}
                {compareRow}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-10 max-w-3xl text-[13px] font-medium leading-relaxed text-sv-ink/40">
          OpenStreetMap · © OpenStreetMap contributors (ODbL)
        </p>
      </>
    )
  }

  if (mode !== 'live' || filtered.length === 0) {
    return (
      <>
        {hotelsLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: hotelsLd }} /> : null}
        {header}
        <p className="rounded-card bg-sv-surface p-8 text-center text-[16px] font-medium text-sv-ink/60 shadow-card">
          {overFiltered
            ? copy.emptyFiltered
            : !stayValid || mode === 'live'
              ? copy.emptyLive
              : mode === 'unconfigured'
                ? copy.emptyUnconfigured
                : copy.emptyError}
        </p>
        {overFiltered ? (
          <p className="mt-4 text-center">
            <a href={`?${qs({ sort: null, refund: null, max: null })}`} className="text-[14px] font-bold text-sv-blue underline decoration-sv-blue/30 underline-offset-2 hover:decoration-sv-blue">
              {copy.clearFilters}
            </a>
          </p>
        ) : null}
      </>
    )
  }

  return (
    <>
      {hotelsLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: hotelsLd }} /> : null}
      {header}
      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((h) => (
          <li
            key={h.offerId ?? h.hotelId}
            className="flex flex-col gap-4 rounded-card bg-sv-surface p-5 shadow-card transition-shadow hover:shadow-card-hover"
          >
            <Link
              href={`/${lang}/hotels/${h.hotelId}?${qs()}`}
              className="flex flex-col gap-3"
              aria-label={`${h.name} — ${copy.viewDetails}`}
            >
              <div
                aria-hidden
                className={`flex h-28 items-center justify-center rounded-control bg-gradient-to-br ${monogram(h.hotelId)}`}
              >
                <span className="text-[30px] font-black text-white/90">{h.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[18px] font-extrabold leading-snug text-sv-ink">{h.name}</h3>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${
                    h.refundable ? 'bg-sv-blue/10 text-sv-blue' : 'bg-sv-cloud text-sv-ink/50'
                  }`}
                >
                  {h.refundable ? copy.refundable : copy.nonRefundable}
                </span>
              </div>
              {h.address || h.distanceKm !== null ? (
                <p className="flex items-center gap-1.5 text-[14px] font-medium text-sv-ink/50">
                  <MapPin size={14} className="shrink-0 text-sv-blue" aria-hidden />
                  {h.address}
                  {h.address && h.distanceKm !== null ? ' · ' : ''}
                  {h.distanceKm !== null ? copy.distance(h.distanceKm.toFixed(1)) : ''}
                </p>
              ) : null}
              {h.roomType ? (
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-sv-ink/40">{h.roomType}</p>
              ) : null}
              <div className="mt-auto">
                <p className="text-[13px] font-medium text-sv-ink/40">
                  {copy.providerRate} {gel(h.providerGel)}
                </p>
                <p className="text-[26px] font-black leading-tight text-sv-ink">{gel(h.totalGel)}</p>
                <p className="text-[12px] font-medium text-sv-ink/50">
                  {copy.feeNote(gel(h.feeGel))} · ≈ {gel(h.totalGel / nights)}{copy.perNightShort}
                </p>
              </div>
            </Link>
            {compareRow}
          </li>
        ))}
      </ul>
      <p className="mt-10 max-w-3xl text-[13px] font-medium leading-relaxed text-sv-ink/40">
        Amadeus GDS · {result?.fx === 'live' ? 'FX: open.er-api.com' : 'FX: fallback'} ·{' '}
        {result ? `margin ${result.marginPct}%` : ''}
      </p>
    </>
  )
}
