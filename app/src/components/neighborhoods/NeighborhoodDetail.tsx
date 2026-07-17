'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Building2, Gauge, Wallet, ArrowRight } from 'lucide-react'
import type { Neighborhood } from '@/data/neighborhoods'
import { pick, overallScore } from '@/data/neighborhoods'
import { LISTINGS } from '@/data/listings'
import ListingCard from '@/components/ListingCard'
import { ReviewsSection } from '@/components/reviews/ReviewsSection'
import { Reveal } from '@/components/Reveal'
import { useI18n } from '@/lib/i18n/context'
import ScoreBars from './ScoreBars'
import { useNb } from './i18n'

export default function NeighborhoodDetail({ n }: { n: Neighborhood }) {
  const { lang } = useI18n()
  const s = useNb()
  const score = overallScore(n)
  const listings = LISTINGS.filter((l) => n.districts.includes(l.district))
  const name = pick(n.name, lang)
  const city = pick(n.city, lang)

  return (
    <>
      {/* hero */}
      <section className="relative flex min-h-[420px] items-end overflow-hidden bg-sv-navy">
        <Image
          src={n.img}
          alt={name}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sv-navy via-sv-navy/40 to-sv-navy/20" />
        <div className="relative mx-auto w-full max-w-[1440px] px-5 pb-12 pt-32 md:px-10">
          <Reveal>
            <p className="mb-3 flex items-center gap-1.5 text-[14px] font-bold text-white/75">
              <MapPin className="h-4 w-4" /> {city}, {s.georgia}
            </p>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <h1 className="text-balance text-[38px] font-black tracking-[-0.02em] text-white md:text-[56px]">
                {name}
              </h1>
              <div
                className="flex items-center gap-2.5 rounded-card bg-white/95 px-5 py-3 shadow-card"
                aria-label={`${s.scoreLabel} ${score}/10`}
              >
                <span className="grid h-11 w-11 place-items-center rounded-control bg-sv-blue/10 text-[18px] font-black text-sv-blue">
                  {score}
                </span>
                <span className="text-[13px] font-bold leading-tight text-sv-ink/60">
                  {s.scoreLabel}
                  <br />
                  /10
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* quick stats */}
      <section className="border-b border-sv-ink/[0.06] bg-sv-surface">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 px-5 py-8 sm:grid-cols-3 md:px-10">
          {[
            { Icon: Wallet, label: s.avgPrice, value: `$${n.avgPriceM2USD.toLocaleString('en-US')}${s.perM2}` },
            { Icon: Gauge, label: s.scoreLabel, value: `${score}/10` },
            { Icon: Building2, label: s.listingsHere, value: String(listings.length) },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 rounded-module bg-sv-cloud p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-sv-blue/10 text-sv-blue">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-sv-ink/45">{label}</p>
                <p className="text-[18px] font-black text-sv-ink">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* description + scores */}
      <section className="bg-sv-cloud py-16 md:py-20">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 md:px-10 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <h2 className="mb-4 text-[26px] font-black tracking-[-0.02em] text-sv-ink md:text-[32px]">
              {s.aboutTitle}
            </h2>
            <p className="text-[16px] font-medium leading-relaxed text-sv-ink/75">
              {pick(n.description, lang)}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-8">
              <h2 className="mb-6 text-[20px] font-black tracking-[-0.02em] text-sv-ink">
                {s.scoresTitle}
              </h2>
              <ScoreBars scores={n.scores} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* listings in this area */}
      <section className="bg-sv-surface py-16 md:py-20">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <Reveal className="mb-8">
            <h2 className="text-[26px] font-black tracking-[-0.02em] text-sv-ink md:text-[32px]">
              {s.listingsTitle}
            </h2>
          </Reveal>
          {listings.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((l, i) => (
                <ListingCard key={l.id} l={l} i={i} layout="wide" />
              ))}
            </div>
          ) : (
            <Reveal>
              <div className="rounded-card border border-dashed border-sv-ink/15 bg-sv-cloud p-10 text-center">
                <p className="mb-5 text-[15px] font-semibold text-sv-ink/60">{s.noListings}</p>
                <Link
                  href={`/search?city=${encodeURIComponent(n.cityKey)}`}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-control bg-sv-blue px-6 py-3 text-[15px] font-extrabold text-white transition-colors duration-200 hover:bg-sv-blue-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue"
                >
                  {s.exploreCity} — {city}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* resident reviews */}
      <section aria-label={s.reviewsAria} className="bg-sv-cloud py-16 md:py-20">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <ReviewsSection targetType="neighborhood" targetId={n.slug} />
        </div>
      </section>
    </>
  )
}
