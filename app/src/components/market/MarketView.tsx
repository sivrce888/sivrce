'use client'

import LocalizedLink from '@/components/LocalizedLink'
import { Reveal } from '@/components/Reveal'
import { Wallet, BarChart3, Building2, TrendingUp, ArrowUpRight, ChevronRight } from 'lucide-react'
import type { MarketOverview } from '@/lib/market-stats'
import { useMarket } from './i18n'

const usd = (n: number) => `$${n.toLocaleString('en-US')}`

/** MoM chip — positive reads sv-blue on light surfaces (BRAND §3), negative orange-deep. */
function Mom({ value, label }: { value: number | null; label: string }) {
  if (value === null) return null
  return (
    <span
      title={label}
      className={`inline-flex items-center gap-0.5 text-[12px] font-black ${
        value > 0 ? 'text-sv-blue' : 'text-sv-orange-deep'
      }`}
    >
      <TrendingUp className={`h-3 w-3 ${value < 0 ? 'rotate-180' : ''}`} aria-hidden />
      {value > 0 ? '+' : '−'}
      {Math.abs(value)}%
    </span>
  )
}

export default function MarketView({
  data,
  updated,
}: {
  data: MarketOverview
  updated: string
}) {
  const s = useMarket()
  const { total } = data

  const cards = total
    ? [
        { Icon: Wallet, label: s.avgM2, value: `${usd(total.avgPerM2USD)}${s.perM2}`, mom: data.totalMom },
        { Icon: BarChart3, label: s.median, value: total.medianPriceUSD ? usd(total.medianPriceUSD) : '—', mom: null },
        { Icon: Building2, label: s.active, value: total.activeCount.toLocaleString('en-US'), mom: null },
        { Icon: TrendingUp, label: s.newListings, value: total.newListings.toLocaleString('en-US'), mom: null },
      ]
    : []

  return (
    <>
      {/* hero */}
      <section className="relative overflow-hidden bg-sv-navy">
        <div className="absolute inset-0 bg-dots-dark opacity-60" aria-hidden />
        <div
          className="animate-aurora-a absolute -left-[15%] top-[-30%] h-[75%] w-[60%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--sv-blue)_30%,transparent),transparent_65%)] blur-[90px]"
          aria-hidden
        />
        <div
          className="animate-aurora-b absolute right-[-12%] top-[-15%] h-[70%] w-[55%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--sv-violet)_22%,transparent),transparent_65%)] blur-[100px]"
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-[1440px] px-5 pb-14 pt-[calc(9rem+env(safe-area-inset-top,0px))] md:px-10 md:pb-20">
          <Reveal>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[13px] font-bold text-white/80">
              <TrendingUp className="h-4 w-4 text-sv-blue-light" aria-hidden />
              {s.eyebrow}
            </p>
            <h1 className="max-w-[16ch] text-balance text-[38px] font-black leading-[1.05] tracking-[-0.03em] text-white md:text-[60px]">
              {s.h1}
            </h1>
            <p className="mt-5 max-w-[52ch] text-[16px] font-medium leading-relaxed text-white/70 md:text-[18px]">
              {s.sub}
            </p>
            <p className="mt-6 text-[13px] font-semibold text-white/45">
              {s.updated}: {updated}
            </p>
          </Reveal>
        </div>
      </section>

      {total ? (
        <>
          {/* headline numbers */}
          <section className="border-b border-sv-ink/[0.06] bg-sv-surface" aria-label={s.eyebrow}>
            <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 px-5 py-10 sm:grid-cols-2 md:grid-cols-4 md:px-10">
              {cards.map(({ Icon, label, value, mom }, i) => (
                <Reveal key={label} delay={i * 0.04}>
                  <div className="flex h-full items-center gap-4 rounded-module bg-sv-cloud p-5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-sv-blue/10 text-sv-blue">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-bold uppercase tracking-wider text-sv-ink/45">
                        {label}
                      </p>
                      <p className="whitespace-nowrap [overflow-wrap:normal] text-[20px] font-black tabular-nums tracking-tight text-sv-ink">
                        {value}
                        {mom !== null && (
                          <span className="ml-2">
                            <Mom value={mom} label={s.vsPrevMonth} />
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* district board */}
          <section className="bg-sv-cloud py-16 md:py-20">
            <div className="mx-auto max-w-[1440px] px-5 md:px-10">
              <Reveal className="mb-8">
                <h2 className="text-balance text-[26px] font-black tracking-[-0.02em] text-sv-ink md:text-[36px]">
                  {s.districtsTitle}
                </h2>
                <p className="mt-2 text-[15px] font-medium text-sv-ink/60">{s.districtsSub}</p>
              </Reveal>
              <Reveal delay={0.05}>
                <div className="overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card">
                  <ul className="divide-y divide-sv-ink/[0.06]">
                    {data.districts.map((d, i) => (
                      <li key={d.district}>
                        <LocalizedLink
                          href={`/search?district=${encodeURIComponent(d.district)}`}
                          className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-sv-cloud/70 md:px-8 md:py-5"
                        >
                          <span className="w-6 shrink-0 text-[14px] font-black tabular-nums text-sv-ink/25">
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[16px] font-extrabold text-sv-ink md:text-[17px]">
                              {d.district}
                            </span>
                            <span className="text-[12px] font-semibold text-sv-ink/45">
                              {d.stats.activeCount.toLocaleString('en-US')} {s.listingsShort}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block whitespace-nowrap [overflow-wrap:normal] text-[15px] font-black tabular-nums tracking-tight text-sv-ink md:text-[19px]">
                              {usd(d.stats.avgPerM2USD)}
                              <span className="text-[12px] font-bold text-sv-ink/40">{s.perM2}</span>
                            </span>
                            <Mom value={d.mom} label={s.vsPrevMonth} />
                          </span>
                          <ChevronRight
                            className="h-5 w-5 shrink-0 text-sv-ink/25 transition-all group-hover:translate-x-0.5 group-hover:text-sv-blue"
                            aria-hidden
                          />
                        </LocalizedLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </section>
        </>
      ) : (
        <section className="bg-sv-cloud py-20 md:py-28">
          <div className="mx-auto max-w-[560px] px-5 text-center">
            <Reveal>
              <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-module bg-sv-blue/10 text-sv-blue">
                <BarChart3 className="h-7 w-7" aria-hidden />
              </span>
              <h2 className="text-balance text-[24px] font-black tracking-[-0.02em] text-sv-ink">
                {s.emptyTitle}
              </h2>
              <p className="mt-3 text-[15px] font-medium leading-relaxed text-sv-ink/60">
                {s.emptyBody}
              </p>
              <LocalizedLink
                href="/add-listing"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-sv-orange px-7 py-3.5 text-[15px] font-extrabold text-white shadow-glow-orange transition-all hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
              >
                {s.ctaSearch}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </LocalizedLink>
            </Reveal>
          </div>
        </section>
      )}

      {/* methodology + CTAs */}
      <section className="bg-sv-surface py-16 md:py-20">
        <div className="mx-auto grid max-w-[1440px] gap-6 px-5 md:grid-cols-[1.2fr_1fr] md:px-10">
          <Reveal>
            <div className="h-full rounded-card border border-sv-ink/[0.06] bg-sv-cloud p-7 md:p-9">
              <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink">
                {s.methodologyTitle}
              </h2>
              <p className="mt-3 text-[15px] font-medium leading-relaxed text-sv-ink/65">
                {s.methodology}
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="flex h-full flex-col justify-center gap-3">
              <LocalizedLink
                href="/search"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sv-blue px-7 py-3.5 text-[15px] font-extrabold text-white transition-colors hover:bg-sv-blue-deep"
              >
                {s.ctaSearch}
              </LocalizedLink>
              <LocalizedLink
                href="/neighborhoods"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-sv-ink/10 bg-sv-surface px-7 py-3.5 text-[15px] font-extrabold text-sv-ink transition-colors hover:border-sv-blue/30 hover:text-sv-blue"
              >
                {s.ctaNeighborhoods}
              </LocalizedLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
