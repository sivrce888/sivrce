/**
 * Shared area intel for project + developer pages (server-only, zero client JS).
 * Reuses the buildings-page pattern: WeatherBadge (SSR, cached) + nearestMetro /
 * nearestAmenities over committed OSM POIs + neighborhood-guide deep link +
 * Apple/Google directions + every photo, lazily loaded.
 * ponytail: one component serves both entity pages; ceiling is live market
 * stats per district (market-stats.ts) when that query stays cheap.
 */
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Dumbbell,
  Globe,
  GraduationCap,
  Hospital,
  Landmark,
  Castle,
  MapPin,
  Pill,
  ShoppingBag,
  TrainFront,
  Trees,
  type LucideIcon,
} from 'lucide-react'
import { WeatherBadge } from '@/components/WeatherBadge'
import {
  formatMetroDist,
  nearestAmenities,
  nearestMetro,
  POI_COLORS,
  POI_LABELS,
  type PoiCategory,
} from '@/lib/map/pois'
import { pick } from '@/data/neighborhoods'
import type { Lang } from '@/lib/i18n/core'
import {
  countryOf,
  matchNeighborhood,
  placeLabels,
  resolvePlaceCity,
  validCoords,
  type PlaceCoords,
  type PlaceLoc,
} from '@/lib/place-context'

const AMENITY_ICON: Record<PoiCategory, LucideIcon> = {
  metro: TrainFront,
  school: GraduationCap,
  university: Landmark,
  park: Trees,
  hospital: Hospital,
  shop: ShoppingBag,
  gym: Dumbbell,
  pharmacy: Pill,
  landmark: Castle,
}

const T: Record<
  PlaceLoc,
  {
    country: string
    city: string
    neighborhood: string
    address: string
    around: string
    guide: string
  }
> = {
  ka: {
    country: 'ქვეყანა',
    city: 'ქალაქი',
    neighborhood: 'უბანი',
    address: 'მისამართი',
    around: 'ირგვლივ',
    guide: 'უბნის გზამკვლევი',
  },
  en: {
    country: 'Country',
    city: 'City',
    neighborhood: 'Neighborhood',
    address: 'Address',
    around: 'Nearby',
    guide: 'Neighborhood guide',
  },
  ru: {
    country: 'Страна',
    city: 'Город',
    neighborhood: 'Квартал',
    address: 'Адрес',
    around: 'Рядом',
    guide: 'Гид по району',
  },
  de: {
    country: 'Land',
    city: 'Stadt',
    neighborhood: 'Stadtteil',
    address: 'Adresse',
    around: 'In der Nähe',
    guide: 'Stadtteil-Guide',
  },
}

export async function PlaceContext({
  loc,
  lang,
  cityKa,
  district,
  location,
  coords,
  photos,
  photoAlt,
}: {
  loc: PlaceLoc
  lang: Lang
  cityKa: string
  district?: string
  location?: string
  coords?: PlaceCoords | null
  /** Render-everything gallery (developer pages); project pages keep their HScroll. */
  photos?: string[]
  photoAlt: string
}) {
  const t = T[loc]
  const head = placeLabels(loc)
  const at = validCoords(coords) ? coords : null
  const city = resolvePlaceCity(cityKa, at)
  const nbh = matchNeighborhood(cityKa, district, at)
  const metro = at ? nearestMetro(at.lat, at.lng) : null
  const amenities = at ? nearestAmenities(at.lat, at.lng).filter((a) => a.category !== 'metro') : []
  const mapsApple = at
    ? `https://maps.apple.com/?daddr=${at.lat},${at.lng}&q=${encodeURIComponent(location ?? cityKa)}`
    : null
  const mapsGoogle = at
    ? `https://www.google.com/maps/dir/?api=1&destination=${at.lat},${at.lng}`
    : null

  return (
    <>
      {photos && photos.length > 0 && (
        <section id="photos" className="mx-auto max-w-[1440px] scroll-mt-[7.5rem] px-5 pb-12 md:px-10">
          <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            {head.photos}
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((src, i) => (
              <div
                key={src}
                className="relative aspect-[16/10] overflow-hidden rounded-module bg-sv-cloud"
              >
                <Image
                  src={src}
                  alt={`${photoAlt} — ${head.photos} ${i + 1}`}
                  fill
                  sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 460px"
                  loading="lazy"
                  decoding="async"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="area" className="mx-auto max-w-[1440px] scroll-mt-[7.5rem] px-5 pb-12 md:px-10">
        <h2 className="flex flex-wrap items-center gap-3 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
          {head.area}
          <WeatherBadge
            coords={at ?? undefined}
            citySlug={city?.slug}
            label={location ?? cityKa}
            lang={lang}
            className="rounded-full border border-sv-ink/[0.06] bg-sv-surface px-3 py-1.5 text-sv-ink/60 shadow-card"
          />
        </h2>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            city
              ? ([
                  t.country,
                  loc === 'ka'
                    ? countryOf(city.cc).ka
                    : loc === 'ru'
                      ? countryOf(city.cc).ru
                      : loc === 'de'
                        ? (countryOf(city.cc).de ?? countryOf(city.cc).en)
                        : countryOf(city.cc).en,
                ] as const)
              : null,
            ([t.city, loc === 'ka' ? (city?.ka ?? cityKa) : (city?.en ?? cityKa)] as const),
            nbh ? ([t.neighborhood, pick(nbh.name, lang)] as const) : district ? ([t.neighborhood, district] as const) : null,
            location ? ([t.address, location] as const) : null,
          ]
            .filter((r): r is readonly [string, string] => !!r && !!r[1])
            .map(([k, v]) => (
              <div
                key={k}
                className="rounded-module border border-sv-ink/[0.06] bg-sv-surface px-4 py-3 shadow-card"
              >
                <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-sv-ink/60">
                  {k === t.country ? (
                    <Globe className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {k}
                </dt>
                <dd className="mt-1 text-[15px] font-extrabold text-sv-ink">{v}</dd>
              </div>
            ))}
        </dl>

        {metro && (
          <p className="mt-4 flex items-center gap-2 text-[14px] font-extrabold text-sv-blue-deep">
            <TrainFront className="h-4 w-4 shrink-0" aria-hidden />
            {metro.name} · {formatMetroDist(metro)}
          </p>
        )}

        {amenities.length > 0 && (
          <>
            <h3 className="mt-8 text-[17px] font-black tracking-[-0.02em] text-sv-ink">
              {t.around}
            </h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {amenities.slice(0, 8).map((a) => {
                const Icon = AMENITY_ICON[a.category]
                return (
                  <li
                    key={a.category}
                    className="flex items-start gap-3 rounded-module border border-sv-ink/[0.06] bg-sv-surface px-4 py-3.5 shadow-card"
                  >
                    <Icon
                      className="mt-0.5 h-5 w-5 shrink-0"
                      style={{ color: POI_COLORS[a.category] }}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-sv-ink/60">
                        {POI_LABELS[a.category]}
                      </p>
                      <p className="truncate text-[14px] font-extrabold text-sv-ink">{a.name}</p>
                      <p className="text-[12px] font-bold text-sv-ink/60">{formatMetroDist(a)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {nbh && (
            <Link
              href={`/neighborhoods/${nbh.slug}`}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-sv-blue px-5 py-2.5 text-[13px] font-extrabold text-white shadow-glow-blue-sm transition hover:bg-sv-blue-deep"
            >
              {t.guide}: {pick(nbh.name, lang)}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
          {mapsApple && (
            <a
              href={mapsApple}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-full bg-sv-navy px-5 py-2.5 text-[13px] font-extrabold text-white transition hover:bg-sv-navy-soft"
            >
              Apple Maps
            </a>
          )}
          {mapsGoogle && (
            <a
              href={mapsGoogle}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-full bg-sv-cloud px-5 py-2.5 text-[13px] font-extrabold text-sv-ink transition hover:bg-sv-ink/5"
            >
              Google Maps
            </a>
          )}
        </div>
      </section>
    </>
  )
}
