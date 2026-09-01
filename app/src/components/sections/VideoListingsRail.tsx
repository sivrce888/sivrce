'use client'

import LocalizedLink from '@/components/LocalizedLink'
import { Reveal } from '@/components/Reveal'
import HScroll from '@/components/HScroll'
import { Clapperboard, Play } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { listingPath } from '@/lib/listing-slug'
import { useCurrency, formatListingPrice } from '@/lib/currency'
import type { Listing } from '@/lib/listings-db'
import { cardOf } from '@/lib/media'

/** Homepage portrait rail — listings with YouTube or uploaded video. */
export default function VideoListingsRail({ items }: { items: Listing[] }) {
  const { b, t } = useI18n()
  const { currency, rate } = useCurrency()
  if (items.length === 0) return null

  return (
    <section
      className="border-b border-sv-ink/[0.06] bg-sv-surface py-6 md:py-8"
      aria-label={b('home.stories.videoTitle')}
    >
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal>
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="flex items-center gap-2.5 text-[17px] font-black tracking-[-0.03em] text-sv-ink md:text-[19px]">
              <Clapperboard className="h-[18px] w-[18px] text-sv-blue" aria-hidden />
              {b('home.stories.videoTitle')}
            </h2>
            <LocalizedLink
              href="/add-listing#add-video"
              className="shrink-0 text-[12px] font-extrabold text-sv-blue transition-colors hover:text-sv-blue-deep"
            >
              {b('home.stories.videoHow')}
            </LocalizedLink>
          </div>
          <HScroll aria-label={b('home.stories.videoTitle')} step={180} className="gap-3 pb-1 pt-0.5">
            {items.map((l) => {
              const price = formatListingPrice({
                priceUSD: l.priceUSD,
                priceGEL: l.priceGEL,
                priceOriginal: l.priceOriginal,
                currencyOriginal: l.currencyOriginal,
                currencyPreference: currency,
                rate,
              }).primary
              const src = cardOf(l.img) ?? l.img
              return (
                <LocalizedLink
                  key={l.id}
                  href={`${listingPath(l)}?play=1`}
                  className="group relative w-[148px] shrink-0 overflow-hidden rounded-tile shadow-card transition-transform duration-300 ease-[cubic-bezier(0.21,0.65,0.2,1)] hover:scale-[1.03] hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
                >
                  <span className="relative block aspect-[9/16] bg-sv-navy-soft">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      width={296}
                      height={526}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-sv-navy/80 to-transparent" />
                    <span
                      className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-sv-navy/55 text-white shadow-glow-blue-sm backdrop-blur-sm transition-transform duration-300 ease-[cubic-bezier(0.21,0.65,0.2,1)] group-hover:scale-110"
                      aria-hidden
                    >
                      <Play className="ml-0.5 h-5 w-5 fill-white" />
                    </span>
                    <span className="absolute inset-x-0 bottom-0 z-[1] px-3 pb-3">
                      <span className="block text-[14px] font-black tabular-nums tracking-[-0.02em] text-white">
                        {price}
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-[11px] font-bold leading-snug text-white/85">
                        {l.title}
                      </span>
                    </span>
                    <span className="sr-only">{t('detail.playVideo')}</span>
                  </span>
                </LocalizedLink>
              )
            })}
          </HScroll>
        </Reveal>
      </div>
    </section>
  )
}
