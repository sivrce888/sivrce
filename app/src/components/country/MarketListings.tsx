import Listings from '@/components/sections/Listings'
import ListingCard from '@/components/ListingCard'
import HScroll from '@/components/HScroll'
import { Reveal } from '@/components/Reveal'
import { COUNTRY_NAMES, cityPack } from '@/lib/country-copy'
import { cardPhotoPayload } from '@/lib/card-gallery-teaser'
import { homeScopeForCountry, homeSearchHref } from '@/lib/home-scope'
import { getAllListings, getHomeTierListings, type Listing } from '@/lib/listings-db'
import type { PathCountryId } from '@/lib/markets'
import LocalizedLink from '@/components/LocalizedLink'
import { ArrowRight } from 'lucide-react'

function railCard(l: Listing): Listing {
  const images = l.images.length ? l.images : [l.img]
  return { ...l, description: '', ...cardPhotoPayload(images) }
}

/** Live inventory on a country / city hub. Empty rails stay unmounted. */
export default async function MarketListings({
  country,
  city,
  intent,
  label,
}: {
  country: PathCountryId
  city?: string
  intent?: 'buy' | 'rent'
  /** Override rail heading (e.g. "Kolonaki · Athens" on a hood page). */
  label?: string
}) {
  const scope = homeScopeForCountry(country, city, intent)
  if (!scope) return null
  const [superVip, vipPlus] = await Promise.all([
    getHomeTierListings('diamond', 8, scope).catch(() => [] as Listing[]),
    getHomeTierListings('super_vip', 8, scope).catch(() => [] as Listing[]),
  ])
  const latest =
    superVip.length === 0 && vipPlus.length === 0
      ? await getAllListings(8, scope).catch(() => [] as Listing[])
      : []
  const place = label ?? (city ? (cityPack(country, city)?.name ?? city) : COUNTRY_NAMES[country])
  const viewAll = homeSearchHref({}, scope)
  return (
    <>
      <Listings
        items={superVip.map(railCard)}
        rail="superVip"
        href={homeSearchHref({ tier: 'diamond' }, scope)}
      />
      <Listings
        items={vipPlus.map(railCard)}
        rail="vipPlus"
        href={homeSearchHref({ tier: 'super_vip' }, scope)}
      />
      {latest.length > 0 ? (
        <section className="relative overflow-hidden bg-sv-surface py-[clamp(3.5rem,2.4rem+4vw,7rem)]">
          <div className="mx-auto max-w-[1440px] px-5 md:px-10">
            <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-5">
              <div>
                <h2 className="sv-h2 text-sv-ink">{place}</h2>
                <p className="mt-2 text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
                  Live listings in {place} only.
                </p>
              </div>
              <LocalizedLink
                href={viewAll}
                className="group flex items-center gap-2 text-[15px] font-extrabold text-sv-blue-deep transition-colors hover:text-sv-blue dark:text-sv-blue-light"
              >
                View all
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </LocalizedLink>
            </Reveal>
            <HScroll aria-label={place} step={420} className="gap-6 pb-2 pt-2">
              {latest.map((l, i) => (
                <ListingCard key={l.id} l={railCard(l)} i={i} animate={false} />
              ))}
            </HScroll>
          </div>
        </section>
      ) : null}
    </>
  )
}
