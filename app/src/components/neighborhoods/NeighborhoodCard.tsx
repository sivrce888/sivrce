'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'
import type { Neighborhood } from '@/data/neighborhoods'
import { pick, overallScore } from '@/data/neighborhoods'
import { useI18n } from '@/lib/i18n/context'
import { useNb } from './i18n'

/** Index card: hero image, livability score badge, avg price per m². */
export default function NeighborhoodCard({ n, count }: { n: Neighborhood; count: number }) {
  const { lang } = useI18n()
  const s = useNb()
  const score = overallScore(n)

  return (
    <Link
      href={`/neighborhoods/${n.slug}`}
      aria-label={`${pick(n.name, lang)} — ${s.viewGuide}`}
      className="group block rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue"
    >
      <article className="overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-card-hover">
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={n.img}
            alt={pick(n.name, lang)}
            fill
            sizes="(max-width:768px) 100vw, (max-width:1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-sv-navy/75 via-transparent to-transparent" />
          <div
            className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[13px] font-black text-sv-navy"
            aria-label={`${s.scoreLabel} ${score}/10`}
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-sv-blue/10 text-[11px] text-sv-blue">
              {score}
            </span>
            /10
          </div>
          <div className="absolute bottom-4 left-5 right-5">
            <h3 className="text-[22px] font-black text-white [text-shadow:0_2px_10px_rgba(5,11,38,0.55)]">
              {pick(n.name, lang)}
            </h3>
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-white/80">
              <MapPin className="h-4 w-4" /> {pick(n.city, lang)}
              {count > 0 && <> · {count} {s.listingsHere}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 p-5">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wider text-sv-ink/45">{s.avgPrice}</p>
            <p className="text-[17px] font-black text-sv-blue">
              ${n.avgPriceM2USD.toLocaleString('en-US')}
              <span className="text-[12px] font-bold text-sv-ink/60">{s.perM2}</span>
            </p>
          </div>
          <span className="flex min-h-[44px] items-center gap-2 text-[14px] font-extrabold text-sv-blue transition-colors duration-200 group-hover:text-sv-blue-deep">
            {s.viewGuide}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </article>
    </Link>
  )
}
