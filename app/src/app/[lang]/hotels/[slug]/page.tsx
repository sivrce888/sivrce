import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { MapPin, ChevronLeft, ExternalLink } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { jsonLd } from '@/lib/utils'
import { pageMeta } from '@/lib/i18n/server'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { compareLinks, hotelRooms, isPopularDestination, kaIn, parseStay, placeBySlug } from '@/lib/hotels'
import { HotelsView } from '../page'

interface Copy {
  kicker: string
  title: string
  rooms: string
  gdsQuote: string
  feeIncl: (n: number) => string
  otaFrom: (n: number) => string
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
  bookLive: string
}

const COPY: Record<'ka' | 'en' | 'ru' | 'de', Copy> = {
  ka: {
    kicker: 'სასტუმრო',
    title: 'ცოცხალი ფასები',
    rooms: 'ნომრები',
    gdsQuote: 'sivrce',
    feeIncl: (n) => `ჩათვლით ${n} ₾ sivrce`,
    otaFrom: (n) => `OTA ${n} ₾`,
    refundable: 'უფასო გაუქმება',
    nonRefundable: 'გაუქმების გარეშე',
    perNightShort: '/ღამე',
    compare: 'ცოცხალი ფასები:',
    back: 'ყველა სასტუმრო',
    map: 'რუკაზე',
    emptyLive: 'ამ თარიღებზე GDS ნომერი არ არის — შეადარეთ პარტნიორებზე.',
    emptyUnconfigured: 'GDS ტარიფები გასაღებების შემდეგ — პარტნიორებზე ფასები ახლავეა.',
    emptyError: 'GDS დროებით მიუწვდომელია — სცადეთ პარტნიორები.',
    nights: (n) => (n === 1 ? '1 ღამე' : `${n} ღამე`),
    guests: (n) => `${n} სტუმარი`,
    bookLive: 'ცოცხალი ფასი და ჯავშანი',
  },
  en: {
    kicker: 'Hotel',
    title: 'Live rates',
    rooms: 'Rooms',
    gdsQuote: 'sivrce',
    feeIncl: (n) => `incl. ${n} ₾ sivrce`,
    otaFrom: (n) => `OTA ${n} ₾`,
    refundable: 'Free cancellation',
    nonRefundable: 'Non-refundable',
    perNightShort: '/night',
    compare: 'Live prices:',
    back: 'All hotels',
    map: 'Map',
    emptyLive: 'No GDS rooms for these dates — compare live partner rates.',
    emptyUnconfigured: 'GDS quotes appear once provider keys are set — partner rates are live now.',
    emptyError: 'GDS unavailable right now — use partner rates.',
    nights: (n) => (n === 1 ? '1 night' : `${n} nights`),
    guests: (n) => `${n} ${n === 1 ? 'guest' : 'guests'}`,
    bookLive: 'Live price & book',
  },
  ru: {
    kicker: 'Отель',
    title: 'Живые цены',
    rooms: 'Номера',
    gdsQuote: 'sivrce',
    feeIncl: (n) => `вкл. ${n} ₾ sivrce`,
    otaFrom: (n) => `OTA ${n} ₾`,
    refundable: 'Бесплатная отмена',
    nonRefundable: 'Без возврата',
    perNightShort: '/ночь',
    compare: 'Живые цены:',
    back: 'Все отели',
    map: 'Карта',
    emptyLive: 'На эти даты GDS номеров нет — сравните у партнёров.',
    emptyUnconfigured: 'Котировки GDS появятся после ключей — цены партнёров уже живые.',
    emptyError: 'GDS временно недоступен — смотрите партнёров.',
    nights: (n) => (n === 1 ? '1 ночь' : `${n} ноч.`),
    guests: (n) => `${n} ${n === 1 ? 'гость' : 'гостей'}`,
    bookLive: 'Живая цена и бронь',
  },
  de: {
    kicker: 'Hotel',
    title: 'Live-Preise',
    rooms: 'Zimmer',
    gdsQuote: 'sivrce',
    feeIncl: (n) => `inkl. ${n} ₾ sivrce`,
    otaFrom: (n) => `OTA ${n} ₾`,
    refundable: 'Kostenlose Stornierung',
    nonRefundable: 'Nicht erstattbar',
    perNightShort: '/Nacht',
    compare: 'Live-Preise:',
    back: 'Alle Hotels',
    map: 'Karte',
    emptyLive: 'Keine GDS-Zimmer für diese Daten — Partnerpreise vergleichen.',
    emptyUnconfigured: 'GDS-Kurse nach Anbieter-Schlüsseln — Partnerpreise sind jetzt live.',
    emptyError: 'GDS gerade nicht verfügbar — Partnerpreise nutzen.',
    nights: (n) => (n === 1 ? '1 Nacht' : `${n} Nächte`),
    guests: (n) => `${n} ${n === 1 ? 'Gast' : 'Gäste'}`,
    bookLive: 'Live-Preis & buchen',
  },
}

const gel = (n: number) => `${Math.round(n).toLocaleString('en-US')} ₾`

interface PageProps {
  params: Promise<{ lang: string; slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const HOTEL_ID = /^[A-Za-z0-9_-]{1,32}$/

/** Crawlable city hub metadata — /hotels/tbilisi etc. */
function cityMeta(slug: string, lang: Lang): Metadata {
  const place = placeBySlug(slug)
  const city = place?.en ?? slug
  return pageMeta(`/hotels/${slug}`, lang, {
    ka: {
      title: `სასტუმროები ${place ? kaIn(place.ka) : slug} — ცოცხალი ფასები და ჯავშანი`,
      description: `${place?.ka ?? slug}: რეალური სასტუმროები, ცოცხალი ფასები და ჯავშანი Google Hotels-სა და Booking.com-ზე.`,
    },
    en: {
      title: `Hotels in ${city} — live rates and booking`,
      description: `Real hotels in ${city}. Live prices and booking on Google Hotels and Booking.com. GDS quotes from Amadeus when connected.`,
    },
    ru: {
      title: `Отели в ${city} — живые цены и бронь`,
      description: `Отели в ${city}: реальные отели, живые цены и бронь на Google Hotels и Booking.com.`,
    },
    de: {
      title: `Hotels in ${city} — Live-Preise und Buchung`,
      description: `Echte Hotels in ${city}. Live-Preise und Buchung über Google Hotels und Booking.com.`,
    },
  })
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ lang: raw, slug }, sp] = await Promise.all([params, searchParams])
  const lang = isValidLang(raw) ? raw : 'ka'
  if (isPopularDestination(slug)) return cityMeta(slug, lang)
  const hotelId = slug
  const { checkIn, checkOut, adults } = stayOf(sp)
  const { hotelName, mode } = await hotelRooms({ hotelId, checkIn, checkOut, adults })
  const name = mode === 'live' ? hotelName : null
  const title = name ? `${name} — live rates` : 'Hotel — live rates'
  const description = name
    ? `Rooms and GDS quotes for ${name}. Book live prices on Google Hotels or Booking.com.`
    : 'Hotel rooms. Live partner rates; GDS quotes when Amadeus is connected.'
  if (!HOTEL_ID.test(hotelId))
    return pageMeta(`/hotels/${hotelId}`, lang, {
      ka: { title: 'სასტუმრო — ცოცხალი ფასები', description: 'სასტუმროს ნომრები და ცოცხალი ფასები.' },
      en: { title: 'Hotel — live rates', description: 'Hotel rooms and live rates.' },
    })
  return pageMeta(`/hotels/${hotelId}`, lang, {
    ka: {
      title: name ? `${name} — ცოცხალი ფასები` : 'სასტუმრო — ცოცხალი ფასები',
      description: name
        ? `${name} — ნომრები და GDS ტარიფი. ჯავშანი Google Hotels / Booking.com-ზე.`
        : 'სასტუმროს ნომრები. ცოცხალი ფასები პარტნიორებზე.',
    },
    en: { title, description },
  })
}

function stayOf(sp: Awaited<PageProps['searchParams']>) {
  const get = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '')
  const adultsRaw = Number.parseInt(get('adults') || '2', 10)
  return {
    checkIn: get('checkIn'),
    checkOut: get('checkOut'),
    adults: Number.isFinite(adultsRaw) ? Math.min(Math.max(adultsRaw, 1), 9) : 2,
  }
}

export default async function HotelDetailPage({ params, searchParams }: PageProps) {
  const [{ lang: raw, slug }, sp] = await Promise.all([params, searchParams])
  // /hotels/tbilisi is a crawlable destination hub, /hotels/g…-d… a hotel — one segment, two personalities.
  if (isPopularDestination(slug)) return HotelsView({ lang: raw, sp, canonicalCity: slug })

  const hotelId = slug
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  const copy = COPY[lang as keyof typeof COPY] ?? COPY.en

  if (!HOTEL_ID.test(hotelId)) notFound()

  const citySlug = typeof sp.city === 'string' && placeBySlug(sp.city) ? sp.city : 'tbilisi'
  const place = placeBySlug(citySlug)!
  const { checkIn, checkOut, adults } = stayOf(sp)
  const stay = parseStay(checkIn, checkOut)
  if (!stay) redirect(`/${lang}/hotels?city=${encodeURIComponent(citySlug)}`)

  const nameParam = typeof sp.name === 'string' ? sp.name.slice(0, 80) : null
  const { mode, hotels: rooms, hotelName, fx } = await hotelRooms({ hotelId, checkIn, checkOut, adults })
  const name = hotelName ?? nameParam ?? hotelId
  const links = compareLinks(`${name} ${place.en}`, checkIn, checkOut, adults)
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${place.en}`)}`
  const backParams = new URLSearchParams({ city: citySlug, checkIn, checkOut, adults: String(adults) })
  const book = links[0]

  const hotelLd =
    mode === 'live' && rooms.length
      ? jsonLd({
          '@context': 'https://schema.org',
          '@type': 'Hotel',
          name,
          address: rooms[0].address ?? undefined,
          priceRange: `${gel(rooms[0].providerGel)} – ${gel(rooms[rooms.length - 1].providerGel)}`,
          makesOffer: {
            '@type': 'Offer',
            priceCurrency: 'GEL',
            lowPrice: rooms[0].providerGel,
            highPrice: rooms[rooms.length - 1].providerGel,
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
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[14px] font-bold">
          <Link
            href={`/${lang}/hotels?${backParams}`}
            className="inline-flex items-center gap-2 rounded-control border border-white/20 bg-white/10 px-5 py-2.5 text-white backdrop-blur-md hover:bg-white/20"
          >
            <ChevronLeft size={16} />
            {copy.back}
          </Link>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-control border border-white/20 bg-white/10 px-5 py-2.5 text-white backdrop-blur-md hover:bg-white/20"
          >
            <MapPin size={16} className="text-sv-blue-light" />
            {copy.map}
          </a>
        </div>
      </PageHero>

      <main className="mx-auto max-w-[1240px] px-5 pb-24 pt-8 md:px-10">
        <div className="mb-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="sv-h2 text-sv-ink">{copy.rooms}</h2>
            <span className="text-[13px] font-bold text-sv-ink/60">
              {copy.nights(stay.nights)} · {copy.guests(adults)}
            </span>
          </div>

          {mode !== 'live' || rooms.length === 0 ? (
            <div className="rounded-card bg-sv-surface p-10 text-center shadow-card border border-sv-cloud">
              <p className="text-[17px] font-bold text-sv-ink">
                {mode === 'unconfigured' ? copy.emptyUnconfigured : mode === 'error' ? copy.emptyError : copy.emptyLive}
              </p>
              <a
                href={book.url}
                target="_blank"
                rel="sponsored nofollow noopener"
                className="mt-6 inline-flex items-center gap-2 rounded-control bg-sv-orange px-5 py-3 text-[14px] font-extrabold text-sv-ink shadow-glow-orange"
              >
                {copy.bookLive} <ExternalLink size={14} />
              </a>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {rooms.map((r, idx) => (
                <li
                  key={r.offerId ?? r.providerGel + idx}
                  className="flex flex-col justify-between rounded-card bg-sv-surface p-6 shadow-card border border-sv-cloud"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[18px] font-black leading-snug text-sv-ink">{r.roomType ?? name}</h3>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-extrabold ${
                        r.refundable ? 'bg-sv-blue/10 text-sv-blue' : 'bg-sv-cloud text-sv-ink/60'
                      }`}
                    >
                      {r.refundable ? copy.refundable : copy.nonRefundable}
                    </span>
                  </div>
                  <div className="mt-6 border-t border-sv-cloud pt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-sv-ink/40">{copy.gdsQuote}</p>
                      <p className="text-[28px] font-black leading-none text-sv-ink">{gel(r.totalGel)}</p>
                      <p className="mt-1 text-[12px] font-medium text-sv-ink/50">
                        ≈ {gel(r.totalGel / stay.nights)}
                        {copy.perNightShort}
                      </p>
                      <p className="mt-1 text-[12px] font-semibold text-sv-ink/50">
                        {copy.feeIncl(r.feeGel)} · {copy.otaFrom(r.providerGel)}
                      </p>
                    </div>
                    <a
                      href={book.url}
                      target="_blank"
                      rel="sponsored nofollow noopener"
                      className="rounded-control bg-sv-orange px-5 py-3 text-[14px] font-black text-sv-ink shadow-glow-orange"
                    >
                      {copy.bookLive}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-card bg-sv-surface p-6 shadow-card border border-sv-cloud">
          <p className="text-[14px] font-bold text-sv-ink/70">
            {copy.compare}{' '}
            {links.map((l, i) => (
              <span key={l.name}>
                {i > 0 ? ' · ' : ''}
                <a
                  href={l.url}
                  target="_blank"
                  rel="sponsored nofollow noopener"
                  className="text-sv-blue underline decoration-sv-blue/30 underline-offset-2 hover:decoration-sv-blue font-bold"
                >
                  {l.name}
                </a>
              </span>
            ))}
          </p>
          <p className="mt-3 text-[12px] font-medium leading-relaxed text-sv-ink/40">
            Amadeus GDS · Xotelo OTA · {fx === 'live' ? 'FX: open.er-api.com' : 'FX: fallback'} · {place.en} · {copy.nights(stay.nights)}
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
