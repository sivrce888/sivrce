import Link from 'next/link'
import { Building2, Landmark, MapPin, ScrollText, ShieldCheck } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import CountryHero from '@/components/country/CountryHero'
import { COUNTRY_NAMES, cityPack, type CountryCopy } from '@/lib/country-copy'
import { MARKET_COSTS, buyerCosts, cityRateRows, marketMoney } from '@/lib/countries/costs'
import { COM_ORIGIN, MARKETS, type PathCountryId } from '@/lib/markets'
import type { Lang } from '@/lib/i18n/core'

/**
 * Market home for every country except Germany, which keeps DeMarketHome for
 * its street-verified project and developer rails.
 *
 * Same section rhythm as /de (hero → facts → cities → cost of buying →
 * rental law → briefing → FAQ), but every figure is pulled from that
 * country's own statute via lib/countries/costs.ts. A French reader sees
 * DMTO and the DPE; a Scot sees LBTT, not SDLT.
 *
 * Server-rendered throughout — no client JS beyond the hero search that was
 * already there.
 */

function Kicker({ icon: Icon, children }: { icon: typeof Building2; children: string }) {
  return (
    <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep dark:text-sv-blue-light">
      <Icon className="h-3.5 w-3.5" aria-hidden /> {children}
    </span>
  )
}

function SectionHead({
  kicker,
  icon,
  title,
  sub,
}: {
  kicker: string
  icon: typeof Building2
  title: string
  sub: string
}) {
  return (
    <Reveal className="mb-10 flex-wrap">
      <Kicker icon={icon}>{kicker}</Kicker>
      <h2 className="sv-h2 text-sv-ink">{title}</h2>
      <p className="mt-2 max-w-2xl text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">{sub}</p>
    </Reveal>
  )
}

const ICONS = [Landmark, ScrollText, ShieldCheck, MapPin] as const

function FactsBand({ country }: { country: PathCountryId }) {
  const facts = MARKET_COSTS[country].facts
  if (!facts.length) return null
  return (
    <section className="bg-sv-cloud py-16 md:py-20">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-4 px-5 md:grid-cols-4 md:px-10">
        {facts.map((f, i) => {
          const Icon = ICONS[i] ?? Landmark
          return (
            <Reveal key={f.label} delay={i * 0.02} className="h-full">
              <div className="flex h-full flex-col gap-2 rounded-card border border-sv-ink/[0.07] bg-sv-surface p-5 shadow-card md:p-6">
                <Icon className="h-5 w-5 text-sv-blue" aria-hidden />
                <span className="text-[26px] font-black tracking-tight text-sv-ink md:text-[32px]">{f.n}</span>
                <span className="text-[13px] font-bold leading-snug text-sv-ink/60">{f.label}</span>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

function CitiesBand({ country, current }: { country: PathCountryId; current?: string }) {
  const m = MARKET_COSTS[country]
  const rows = cityRateRows(country, (s) => cityPack(country, s)?.name ?? null)
  if (rows.length < 2) return null
  const prefix = MARKETS[country].pathPrefix
  return (
    <section className="bg-sv-cloud py-16 md:py-20">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <SectionHead icon={MapPin} kicker="Cities" title={m.citiesTitle} sub={m.citiesSub} />
        <Reveal>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ slug, name, fact }) => {
              const here = slug === current
              return (
                <li key={slug}>
                  <Link
                    href={`${prefix}/${slug}`}
                    aria-current={here ? 'page' : undefined}
                    className={`flex items-center justify-between gap-3 rounded-module border bg-sv-surface px-5 py-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-sv-blue/30 hover:shadow-card-hover ${
                      here ? 'border-sv-blue/40' : 'border-sv-ink/[0.07]'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-extrabold text-sv-ink">{name}</span>
                      <span className="block truncate text-[12px] font-bold text-sv-ink/45">{fact.region}</span>
                    </span>
                    <span
                      className="shrink-0 rounded-full bg-sv-blue/10 px-3 py-1 text-[12px] font-black text-sv-blue-deep dark:text-sv-blue-light"
                      title={fact.chipTitle}
                    >
                      {fact.chip}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

function CostAndRules({ country, city }: { country: PathCountryId; city?: string }) {
  const m = MARKET_COSTS[country]
  // A hub prices the market's flagship city by name. Averaging a federal
  // country into one "national rate" would invent a number nobody pays.
  const costCity = city ?? MARKETS[country].defaultCitySlug
  const costs = buyerCosts(country, costCity)
  if (!costs) return null
  const money = marketMoney(country)
  const place = cityPack(country, costCity)?.name ?? COUNTRY_NAMES[country]
  // TRY has no stable nominal anchor — show every line as a share of price.
  const cell = (n: number, pct: number) => (costs.percentOnly ? `${pct}%` : money(n))
  return (
    <section className="bg-sv-cloud pb-16 md:pb-24">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal className="h-full">
            <div className="h-full rounded-card border border-sv-ink/[0.07] bg-sv-surface p-6 shadow-card md:p-8">
              <Kicker icon={Landmark}>What a purchase really costs</Kicker>
              <h2 className="text-[22px] font-black tracking-tight text-sv-ink">
                {costs.percentOnly
                  ? `Buyer costs in ${place}, as a share of price`
                  : `${money(costs.price)} home in ${place}`}
              </h2>
              <dl className="mt-5 space-y-2.5 text-[15px] font-bold">
                {costs.lines.map((l) => (
                  <div key={l.label} className="flex justify-between gap-4 text-sv-ink/70">
                    <dt>{l.label}</dt>
                    <dd className="shrink-0 tabular-nums">{cell(l.amount, l.pct)}</dd>
                  </div>
                ))}
                <div className="mt-3 flex justify-between gap-4 border-t border-sv-ink/[0.08] pt-3 text-[17px] font-black text-sv-ink">
                  <dt>{costs.percentOnly ? 'Total on top of the price' : m.cashLabel}</dt>
                  <dd className="shrink-0 tabular-nums">
                    {costs.percentOnly ? `${costs.totalPct}%` : money(costs.total)}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-[13px] font-semibold leading-relaxed text-sv-ink/55">
                ≈ +{costs.totalPct}% over the price. {m.note}
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.04} className="h-full">
            <div className="h-full rounded-card bg-sv-navy p-6 shadow-glow-navy md:p-8">
              <Kicker icon={ShieldCheck}>Rentals run on rules</Kicker>
              <h2 className="text-[22px] font-black tracking-tight text-white">{m.rentTitle}</h2>
              <ul className="mt-5 space-y-4 text-[15px] font-medium leading-relaxed text-white/75">
                {m.rentRules.map((r) => (
                  <li key={r.slice(0, 24)}>{r}</li>
                ))}
              </ul>
              <p className="mt-6 text-[13px] font-bold text-white/50">{m.rentNote}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export default function MarketHome({
  country,
  copy,
  city,
  intent,
  lang = 'en',
  crumbs,
}: {
  country: PathCountryId
  copy: CountryCopy
  city?: string
  intent?: 'buy' | 'rent'
  lang?: Lang
  crumbs: { name: string; href: string }[]
}) {
  const market = MARKETS[country]
  const cities = market.citySlugs.flatMap((s) => {
    const p = cityPack(country, s)
    return p ? [{ slug: s, name: p.name }] : []
  })
  const pack = city ? cityPack(country, city) : null
  return (
    <main id="main">
      <CountryHero
        country={country}
        copy={copy}
        city={city}
        intent={intent}
        cities={cities}
        lang={lang}
      />
      <FactsBand country={country} />
      <CostAndRules country={country} city={city} />
      <CitiesBand country={country} current={city} />
      <section className="bg-sv-cloud pb-16 md:pb-24">
        <div className="mx-auto max-w-3xl px-5 md:px-10">
          <nav aria-label="Breadcrumb" className="mb-8 text-[13px] font-semibold text-sv-ink/50">
            {crumbs.map((c, i) => (
              <span key={c.href}>
                {i > 0 ? <span className="px-2" aria-hidden>/</span> : null}
                <a href={c.href} className="hover:text-sv-blue">{c.name}</a>
              </span>
            ))}
          </nav>
          <Reveal>
            <article className="speakable-lead space-y-5 text-[16px] font-medium leading-relaxed text-sv-ink/80">
              {copy.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </article>
          </Reveal>
          {pack && !intent && (pack.buy || pack.rent) && (
            <div className="mt-10 flex flex-wrap gap-3">
              {pack.buy && (
                <Link
                  href={`${market.pathPrefix}/${city}/buy`}
                  className="rounded-full bg-sv-blue px-5 py-2.5 text-[14px] font-extrabold text-white"
                >
                  Buy in {pack.name}
                </Link>
              )}
              {pack.rent && (
                <Link
                  href={`${market.pathPrefix}/${city}/rent`}
                  className="rounded-full border border-sv-ink/10 px-5 py-2.5 text-[14px] font-extrabold text-sv-ink"
                >
                  Rent in {pack.name}
                </Link>
              )}
            </div>
          )}
          {copy.faqs.length > 0 && (
            <section className="mt-14">
              <h2 className="text-[22px] font-black tracking-tight text-sv-ink">FAQ</h2>
              <dl className="mt-6 space-y-6">
                {copy.faqs.map((f) => (
                  <div key={f.q}>
                    <dt className="font-extrabold text-sv-ink">{f.q}</dt>
                    <dd className="mt-2 text-[15px] font-medium text-sv-ink/75">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          <p className="mt-14 text-[13px] font-semibold text-sv-ink/45">
            All markets:{' '}
            <a href={`${COM_ORIGIN}/?worldwide=1`} className="text-sv-blue">sivrce.com</a>
            {' · '}
            Georgia marketplace:{' '}
            <a href="https://sivrce.ge/" className="text-sv-blue">sivrce.ge</a>
            {' · '}
            Prices and availability are published only when a verified listing exists.
            Market currency: {market.currency}.
          </p>
        </div>
      </section>
    </main>
  )
}
