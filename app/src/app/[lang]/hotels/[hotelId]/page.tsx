import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { jsonLd } from '@/lib/utils'
import { pageMeta } from '@/lib/i18n/server'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { compareLinks, hotelRooms, parseStay, placeBySlug } from '@/lib/hotels'

interface Copy {
  kicker: string
  title: string
  rooms: string
  feeNote: (fee: string) => string
  providerRate: string
  refundable: string
  nonRefundable: string
  perNightShort: string
  compare: string
  back: string
  map: string
  emptyLive: string
  emptyUnconfigured: string
  emptyError: string
  nights: (n: number) => string
  guests: (n: number) => string
}

const COPY: Record<'ka' | 'en' | 'ru' | 'de', Copy> = {
  ka: {
    kicker: 'სასტუმრო',
    title: 'ცოცხალი ფასები · Amadeus GDS',
    rooms: 'ნომრები და ფასები',
    feeNote: (fee) => `მოიცავს ${fee} ₾ sivrce-ის სერვისის საფასურს`,
    providerRate: 'მომწოდებლის ფასი',
    refundable: 'თავისუფალი გაუქმება',
    nonRefundable: 'არა აბრულებს',
    perNightShort: '/ღამე',
    compare: 'შედარება:',
    back: 'ყველა სასტუმრო',
    map: 'რუკაზე ნახვა',
    emptyLive: 'ამ თარიღებზე თავისუფალი ნომერი არ არის — სცადეთ სხვა თარიღები.',
    emptyUnconfigured: 'ცოცხალი ფასები მალე ჩაირთვება — მომწოდებლის გასაღებები მოლოდინშია.',
    emptyError: 'ფასები ამჟამად მიუწვდომელია — სცადეთ ხელახლა.',
    nights: (n) => (n === 1 ? '1 ღამე' : `${n} ღამე`),
    guests: (n) => `${n} სტუმარი`,
  },
  en: {
    kicker: 'Hotel',
    title: 'Live rates · Amadeus GDS',
    rooms: 'Rooms & rates',
    feeNote: (fee) => `Includes ${fee} ₾ Sivrce service fee`,
    providerRate: 'Provider rate',
    refundable: 'Free cancellation',
    nonRefundable: 'Non-refundable',
    perNightShort: '/night',
    compare: 'Compare:',
    back: 'All hotels',
    map: 'View on map',
    emptyLive: 'No rooms available for these dates — try different dates.',
    emptyUnconfigured: 'Live rates arrive here soon — provider keys pending.',
    emptyError: 'Rates unavailable right now — please retry.',
    nights: (n) => (n === 1 ? '1 night' : `${n} nights`),
    guests: (n) => `${n} ${n === 1 ? 'guest' : 'guests'}`,
  },
  ru: {
    kicker: 'Отель',
    title: 'Живые цены · Amadeus GDS',
    rooms: 'Номера и цены',
    feeNote: (fee) => `Включая ${fee} ₾ сервисный сбор sivrce`,
    providerRate: 'Цена поставщика',
    refundable: 'Бесплатная отмена',
    nonRefundable: 'Без возврата',
    perNightShort: '/ночь',
    compare: 'Сравнить:',
    back: 'Все отели',
    map: 'Открыть на карте',
    emptyLive: 'На эти даты свободных номеров нет — попробуйте другие.',
    emptyUnconfigured: 'Живые цены появятся здесь скоро — ключи поставщика на подходе.',
    emptyError: 'Цены временно недоступны — повторите попытку.',
    nights: (n) => (n === 1 ? '1 ночь' : `${n} ноч.`),
    guests: (n) => `${n} ${n === 1 ? 'гость' : 'гостей'}`,
  },
  de: {
    kicker: 'Hotel',
    title: 'Live-Preise · Amadeus GDS',
    rooms: 'Zimmer & Preise',
    feeNote: (fee) => `Inklusive ${fee} ₾ Sivrce-Servicegebühr`,
    providerRate: 'Anbieterpreis',
    refundable: 'Kostenlose Stornierung',
    nonRefundable: 'Nicht erstattbar',
    perNightShort: '/Nacht',
    compare: 'Vergleichen:',
    back: 'Alle Hotels',
    map: 'Auf der Karte',
    emptyLive: 'Für diese Daten sind keine Zimmer frei — andere Daten versuchen.',
    emptyUnconfigured: 'Live-Preise folgen in Kürze — Anbieter-Schlüssel ausstehend.',
    emptyError: 'Preise gerade nicht verfügbar — bitte erneut versuchen.',
    nights: (n) => (n === 1 ? '1 Nacht' : `${n} Nächte`),
    guests: (n) => `${n} ${n === 1 ? 'Gast' : 'Gäste'}`,
  },
}

const gel = (n: number) => `${Math.round(n).toLocaleString('en-US')} ₾`

const MONOGRAMS = [
  'from-sv-blue to-sv-violet',
  'from-sv-violet to-sv-navy-soft',
  'from-sv-orange to-sv-violet',
  'from-sv-blue to-sv-navy-soft',
]
const monogram = (id: string) => MONOGRAMS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % MONOGRAMS.length]

interface PageProps {
  params: Promise<{ lang: string; hotelId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Amadeus hotelIds are short opaque codes — reject anything else at the trust boundary. */
const HOTEL_ID = /^[A-Za-z0-9_-]{1,32}$/

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ lang: raw, hotelId }, sp] = await Promise.all([params, searchParams])
  const lang = isValidLang(raw) ? raw : 'ka'
  const { checkIn, checkOut, adults } = await stayOf(sp)
  const { hotelName, mode } = await hotelRooms({ hotelId, checkIn, checkOut, adults })
  const name = mode === 'live' ? hotelName : null
  const title = name ? `${name} — live rates` : 'Hotel — live rates'
  const description = name
    ? `Rooms and live GDS rates for ${name}. Transparent Sivrce service fee, no hidden extras.`
    : 'Live hotel rates from the Amadeus GDS with a transparent service fee.'
  if (!HOTEL_ID.test(hotelId))
    return pageMeta(`/hotels/${hotelId}`, lang, {
      ka: { title: 'სასტუმრო — ცოცხალი ფასები', description: 'სასტუმროების ცოცხალი ფასები Amadeus GDS-დან.' },
      en: { title: 'Hotel — live rates', description: 'Live hotel rates from the Amadeus GDS.' },
    })
  return pageMeta(`/hotels/${hotelId}`, lang, {
    ka: {
      title: name ? `${name} — ცოცხალი ფასები` : 'სასტუმრო — ცოცხალი ფასები',
      description: name
        ? `${name}-ის ნომრები და ცოცხალი GDS ფასები. გამჭვირვალე sivrce-ის სერვისის საფასური.`
        : 'სასტუმროების ცოცხალი ფასები Amadeus GDS-დან, გამჭვირვალე სერვისის საფასურით.',
    },
    en: { title, description },
  })
}

async function stayOf(sp: Awaited<PageProps['searchParams']>) {
  const q = await sp
  const get = (k: string) => (typeof q[k] === 'string' ? (q[k] as string) : '')
  const adultsRaw = Number.parseInt(get('adults') || '2', 10)
  return {
    checkIn: get('checkIn'),
    checkOut: get('checkOut'),
    adults: Number.isFinite(adultsRaw) ? Math.min(Math.max(adultsRaw, 1), 9) : 2,
  }
}

export default async function HotelDetailPage({ params, searchParams }: PageProps) {
  const [{ lang: raw, hotelId }, sp] = await Promise.all([params, searchParams])
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  const copy = COPY[lang as keyof typeof COPY] ?? COPY.en

  if (!HOTEL_ID.test(hotelId)) notFound()

  const citySlug = typeof sp.city === 'string' && placeBySlug(sp.city) ? sp.city : 'tbilisi'
  const place = placeBySlug(citySlug)!
  const { checkIn, checkOut, adults } = await stayOf(sp)
  const stay = parseStay(checkIn, checkOut)
  if (!stay) redirect(`/${lang}/hotels?city=${encodeURIComponent(citySlug)}`)

  const { mode, hotels: rooms, hotelName, fx } = await hotelRooms({ hotelId, checkIn, checkOut, adults })
  const name = hotelName ?? hotelId
  const links = compareLinks(name, checkIn, checkOut, adults)
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${place.en}`)}`
  const backParams = new URLSearchParams({ city: citySlug, checkIn, checkOut, adults: String(adults) })

  const hotelLd =
    mode === 'live' && rooms.length
      ? jsonLd({
          '@context': 'https://schema.org',
          '@type': 'Hotel',
          name,
          address: rooms[0].address ?? undefined,
          priceRange: `${gel(rooms[rooms.length - 1].totalGel)} – ${gel(rooms[0].totalGel)}`,
          makesOffer: {
            '@type': 'Offer',
            priceCurrency: 'GEL',
            lowPrice: rooms[rooms.length - 1].totalGel,
            highPrice: rooms[0].totalGel,
            offerCount: rooms.length,
            validFrom: checkIn,
          },
        })
      : null

  return (
    <>
      <Navbar />
      {hotelLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: hotelLd }} /> : null}
      <PageHero kicker={copy.kicker} title={name} subtitle={`${copy.title} · ${copy.nights(stay.nights)} · ${copy.guests(adults)}`}>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[14px] font-semibold">
          <Link
            href={`/${lang}/hotels?${backParams}`}
            className="rounded-control border border-white/20 bg-white/5 px-4 py-2 text-white transition-colors hover:bg-white/10"
          >
            ← {copy.back}
          </Link>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener"
            className="rounded-control border border-white/20 bg-white/5 px-4 py-2 text-white transition-colors hover:bg-white/10"
          >
            {copy.map}
          </a>
        </div>
      </PageHero>

      <main className="mx-auto max-w-[1100px] px-5 pb-24 pt-10 md:px-10">
        <div
          aria-hidden
          className={`mb-8 flex h-36 items-center justify-center rounded-card bg-gradient-to-br md:h-44 ${monogram(hotelId)}`}
        >
          <span className="text-[44px] font-black text-white/90 md:text-[56px]">{name.charAt(0).toUpperCase()}</span>
        </div>

        <h2 className="sv-h2 mb-5 text-sv-ink">{copy.rooms}</h2>

        {mode !== 'live' || rooms.length === 0 ? (
          <p className="rounded-card bg-sv-surface p-8 text-center text-[16px] font-medium text-sv-ink/60 shadow-card">
            {mode === 'unconfigured' ? copy.emptyUnconfigured : mode === 'error' ? copy.emptyError : copy.emptyLive}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {rooms.map((r) => (
              <li key={r.offerId ?? r.totalGel} className="flex flex-col gap-3 rounded-card bg-sv-surface p-6 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[16px] font-extrabold uppercase tracking-[0.04em] text-sv-ink">
                    {r.roomType ?? name}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${
                      r.refundable ? 'bg-sv-blue/10 text-sv-blue' : 'bg-sv-cloud text-sv-ink/50'
                    }`}
                  >
                    {r.refundable ? copy.refundable : copy.nonRefundable}
                  </span>
                </div>
                <div className="mt-auto">
                  <p className="text-[13px] font-medium text-sv-ink/40">
                    {copy.providerRate} {gel(r.providerGel)}
                  </p>
                  <p className="text-[24px] font-black leading-tight text-sv-ink">{gel(r.totalGel)}</p>
                  <p className="text-[12px] font-medium text-sv-ink/50">
                    {copy.feeNote(gel(r.feeGel))} · ≈ {gel(r.totalGel / stay.nights)}{copy.perNightShort}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-10 text-[14px] font-semibold text-sv-ink/60">
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
        <p className="mt-4 max-w-3xl text-[13px] font-medium leading-relaxed text-sv-ink/40">
          Amadeus GDS · {fx === 'live' ? 'FX: open.er-api.com' : 'FX: fallback'} · {place.en} ·{' '}
          {copy.nights(stay.nights)}
        </p>
      </main>
      <Footer />
    </>
  )
}
