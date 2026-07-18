'use client'

import LocalizedLink from '@/components/LocalizedLink'
import { Reveal } from '@/components/Reveal'
import { useI18n } from '@/lib/i18n/context'
import type { Listing } from '@/lib/listings-db'

/** Homepage Stories strip — paid storyUntil listings. */
export default function StoriesRail({ items }: { items: Listing[] }) {
  const { b } = useI18n()
  if (items.length === 0) return null

  return (
    <section
      className="border-b border-sv-ink/[0.06] bg-sv-cloud/60 py-5 md:py-6"
      aria-label={b('home.stories.kicker')}
    >
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal>
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-sv-ink/40">
            {b('home.stories.kicker')}
          </p>
          <div className="scrollbar-hide flex gap-3.5 overflow-x-auto pb-1 pt-0.5">
            {items.map((l) => (
              <LocalizedLink
                key={l.id}
                href={`/listing/${l.id}`}
                className="group flex w-[84px] shrink-0 flex-col items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
              >
                <span className="rounded-full bg-gradient-to-br from-sv-orange via-sv-orange-deep to-sv-violet p-[2.5px] shadow-glow-orange transition-transform duration-300 ease-[cubic-bezier(0.21,0.65,0.2,1)] group-hover:scale-[1.05]">
                  <span className="block overflow-hidden rounded-full bg-sv-cloud p-[2.5px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={l.img}
                      alt=""
                      width={72}
                      height={72}
                      className="h-[72px] w-[72px] rounded-full object-cover"
                    />
                  </span>
                </span>
                <span className="line-clamp-1 w-full text-center text-[11px] font-extrabold tracking-[-0.01em] text-sv-ink">
                  {l.district || l.city}
                </span>
                <span className="line-clamp-1 w-full text-center text-[10px] font-bold text-sv-ink/45">
                  {formatStoryPrice(l.priceGEL)}
                </span>
              </LocalizedLink>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function formatStoryPrice(gel: number): string {
  if (gel >= 1_000_000) return `${(gel / 1_000_000).toFixed(1).replace(/\.0$/, '')}მ₾`
  if (gel >= 1000) return `${Math.round(gel / 1000)}ათ.₾`
  return `${gel}₾`
}
