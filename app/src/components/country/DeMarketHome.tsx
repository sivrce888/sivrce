import Link from 'next/link'
import { ArrowUpRight, Building2, CalendarCheck, Home, Landmark, MapPin, ShieldCheck } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import HScroll from '@/components/HScroll'
import { PageHero } from '@/components/PageHero'
import type { Developer, Project } from '@/data/professionals'
import { NEW_DEVELOPERS_BERLIN, NEW_PROJECTS_BERLIN } from '@/data/projects-new-berlin'
import { NEW_DEVELOPERS_GERMANY, NEW_PROJECTS_GERMANY } from '@/data/projects-new-germany'
import { BERLIN_BEZIRKE, DE_CITIES, buyerCostBreakdown } from '@/lib/countries/de'
import type { CountryCopy } from '@/lib/country-copy'
import { COM_ORIGIN } from '@/lib/markets'
import { heroPair } from '@/lib/country-copy'
import { mapHrefForPlace } from '@/lib/map/map-href'
import { cityBySlug } from '@/lib/map/user-place'

/**
 * sivrce.com/de marketplace home — same section rhythm as sivrce.ge
 * (hero → stats → new-builds → cities → market rules → developers → FAQ),
 * German data: EUR, Grunderwerbsteuer, street-verified Berlin pipeline.
 * ponytail: typography cards — local project renders land with the photo
 * pipeline; swap card top for <Image> then. Cards link to the official
 * developer/project source (verified) until local detail pages exist.
 */

const CITY_EN = new Map(DE_CITIES.map((c) => [c.ka, c.de]))
const DISTRICT_EN = new Map(BERLIN_BEZIRKE.map((b) => [b.ka, b.de]))

function cityEn(p: Project): string {
  return CITY_EN.get(p.city) ?? 'Germany'
}

function districtEn(p: Project): string {
  const parts = p.location.split(',').map((s) => s.trim()).filter(Boolean)
  const last = parts[parts.length - 1] ?? ''
  if (parts.length >= 2 && !/\d/.test(last) && last !== cityEn(p)) return last
  return (p.district && DISTRICT_EN.get(p.district)) || ''
}

const DE_PROJECTS: Project[] = [...NEW_PROJECTS_BERLIN, ...NEW_PROJECTS_GERMANY]
  .sort((a, b) => (a.done >= 100 ? 1 : 0) - (b.done >= 100 ? 1 : 0) || b.done - a.done)

const DE_DEVELOPERS: Developer[] = (() => {
  const seen = new Set<string>()
  const out: Developer[] = []
  for (const d of [NEW_DEVELOPERS_BERLIN, NEW_DEVELOPERS_GERMANY].flat()) {
    const key = d.name.en.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(d)
  }
  return out.sort((a, b) => Number(b.verified) - Number(a.verified) || b.unitsDelivered - a.unitsDelivered)
})()

const DEV_SITE = new Map(DE_DEVELOPERS.map((d) => [d.slug, d.website ?? '']))
const DEV_BY_SLUG = new Map(DE_DEVELOPERS.map((d) => [d.slug, d.name.en]))

const RAIL_PROJECTS = DE_PROJECTS.slice(0, 12)
const RAIL_DEVELOPERS = DE_DEVELOPERS.slice(0, 12)
const UNITS_PIPELINE = DE_PROJECTS.filter((p) => p.done < 100).reduce((n, p) => n + (p.flats || 0), 0)
const VERIFIED_DEVS = DE_DEVELOPERS.filter((d) => d.verified).length
const BERLIN_PIN = cityBySlug('berlin') ?? { lat: 52.52, lng: 13.405 }

const nf = new Intl.NumberFormat('en-US')
const priceLabel = (p: Project) => (p.priceFromM2 === 'მოთხოვნით' ? 'On request' : p.priceFromM2)

function Kicker({ icon: Icon, children }: { icon: typeof Building2; children: string }) {
  return (
    <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep dark:text-sv-blue-light">
      <Icon className="h-3.5 w-3.5" /> {children}
    </span>
  )
}

function SectionHead({ kicker, icon, title, sub }: { kicker: string; icon: typeof Building2; title: string; sub: string }) {
  return (
    <Reveal className="mb-10 flex-wrap">
      <Kicker icon={icon}>{kicker}</Kicker>
      <h2 className="sv-h2 text-sv-ink">{title}</h2>
      <p className="mt-2 max-w-2xl text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">{sub}</p>
    </Reveal>
  )
}

function StatsBand() {
  const stats = [
    { icon: Building2, n: nf.format(DE_PROJECTS.length), label: 'street-verified new-builds' },
    { icon: Home, n: nf.format(UNITS_PIPELINE), label: 'homes in the pipeline' },
    { icon: ShieldCheck, n: nf.format(VERIFIED_DEVS), label: 'verified developers' },
    { icon: MapPin, n: String(DE_CITIES.length), label: 'city guides live' },
  ]
  return (
    <section className="bg-sv-cloud py-16 md:py-20">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-4 px-5 md:grid-cols-4 md:px-10">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.02} className="h-full">
            <div className="flex h-full flex-col gap-2 rounded-card border border-sv-ink/[0.07] bg-sv-surface p-5 shadow-card md:p-6">
              <s.icon className="h-5 w-5 text-sv-blue" aria-hidden />
              <span className="text-[28px] font-black tracking-tight text-sv-ink md:text-[34px]">{s.n}</span>
              <span className="text-[13px] font-bold leading-snug text-sv-ink/60">{s.label}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function ProjectRail() {
  return (
    <section id="new-builds" className="relative overflow-hidden bg-sv-cloud py-16 md:py-24">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <SectionHead
          icon={Building2}
          kicker="New-builds"
          title="Berlin new-builds, tracked to the address"
          sub="Every project is street-verified against official developer sources — house number, quarter, units, completion. Prices in EUR per m² where published."
        />
      </div>
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <HScroll aria-label="German new-build projects" step={320} className="gap-5 pb-4">
          {RAIL_PROJECTS.map((p) => {
            const href = DEV_SITE.get(p.developerSlug) ?? ''
            const dev = DEV_BY_SLUG.get(p.developerSlug) ?? ''
            const body = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-black uppercase tracking-wider text-sv-blue">
                      {districtEn(p) || cityEn(p)}
                    </p>
                    <h3 className="mt-1 truncate text-[17px] font-black text-sv-ink">{p.name}</h3>
                  </div>
                  <span className="shrink-0 rounded-full bg-sv-ink/[0.06] px-3 py-1 text-[12px] font-extrabold text-sv-ink/70">
                    {priceLabel(p)}
                    {p.priceFromM2 !== 'მოთხოვნით' ? <span className="text-sv-ink/45">/m²</span> : null}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-[13px] font-semibold leading-snug text-sv-ink/55">{p.location}</p>
                <div className="mx-0 mt-4 h-1.5 overflow-hidden rounded-full bg-sv-ink/[0.07]">
                  <div className="h-full rounded-full bg-gradient-to-r from-sv-blue to-sv-violet" style={{ width: `${p.done}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-[12px] font-extrabold text-sv-ink/65">
                  <span>{p.flats ? `${nf.format(p.flats)} units · ` : ''}{p.done}% built</span>
                  <span className="inline-flex items-center gap-1 text-sv-ink/45">
                    <CalendarCheck className="h-3.5 w-3.5" aria-hidden /> {p.finish}
                  </span>
                </div>
                {dev ? (
                  <p className="mt-3 border-t border-sv-ink/[0.06] pt-3 text-[12px] font-bold text-sv-ink/50">
                    Developer: <span className="text-sv-ink/75">{dev}</span>
                    {href ? <span className="text-sv-blue-deep dark:text-sv-blue-light"> · official source ↗</span> : null}
                  </p>
                ) : null}
              </>
            )
            const cls =
              'group flex w-[300px] shrink-0 flex-col rounded-tile border border-sv-ink/[0.07] bg-sv-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-sv-blue/30 hover:shadow-card-hover'
            return href ? (
              <a key={p.slug} href={href} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
            ) : (
              <div key={p.slug} className={cls}>{body}</div>
            )
          })}
        </HScroll>
      </div>
    </section>
  )
}

function CitiesBand() {
  return (
    <section className="bg-sv-cloud py-16 md:py-20">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <SectionHead
          icon={MapPin}
          kicker="Cities"
          title="16 metros, each with its own transfer tax"
          sub="Grunderwerbsteuer is state law — the same apartment costs a different surcharge in Munich and Cologne. City guides carry the local number."
        />
        <Reveal>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DE_CITIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/de/${c.slug}`}
                  className="flex items-center justify-between gap-3 rounded-module border border-sv-ink/[0.07] bg-sv-surface px-5 py-4 font-extrabold text-sv-ink shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-sv-blue/30 hover:shadow-card-hover"
                >
                  <span className="text-[15px]">{c.de}</span>
                  <span className="text-[12px] font-black text-sv-blue" title="Grunderwerbsteuer">
                    {c.transferTaxPct.toLocaleString('en-US', { minimumFractionDigits: 1 })}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

function BuyerCosts() {
  const ex = buyerCostBreakdown(500_000, 'berlin')
  if (!ex) return null
  const eur = (n: number) => `€${nf.format(n)}`
  return (
    <section className="bg-sv-cloud pb-16 md:pb-24">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal className="h-full">
            <div className="h-full rounded-card border border-sv-ink/[0.07] bg-sv-surface p-6 shadow-card md:p-8">
              <Kicker icon={Landmark}>What a purchase really costs</Kicker>
              <h3 className="text-[22px] font-black tracking-tight text-sv-ink">€500,000 apartment in Berlin</h3>
              <dl className="mt-5 space-y-2.5 text-[15px] font-bold">
                <div className="flex justify-between text-sv-ink/70">
                  <dt>Transfer tax (Grunderwerbsteuer 6.0%)</dt><dd>{eur(ex.transferTax)}</dd>
                </div>
                <div className="flex justify-between text-sv-ink/70">
                  <dt>Notary (≈1.5%)</dt><dd>{eur(ex.notary)}</dd>
                </div>
                <div className="flex justify-between text-sv-ink/70">
                  <dt>Land register (Grundbuch ≈0.5%)</dt><dd>{eur(ex.register)}</dd>
                </div>
                <div className="flex justify-between text-sv-ink/70">
                  <dt>Buyer agent share (3.57% incl. VAT)</dt><dd>{eur(ex.makler)}</dd>
                </div>
                <div className="mt-3 flex justify-between border-t border-sv-ink/[0.08] pt-3 text-[17px] font-black text-sv-ink">
                  <dt>Cash needed at notary</dt><dd>{eur(ex.total)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-[13px] font-semibold leading-relaxed text-sv-ink/55">
                ≈ +{ex.totalPct}% over the price. Provisionsfrei (no-agent) listings drop the Makler line.
                The notary reads the contract aloud before signature — German law, not a formality.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.04} className="h-full">
            <div className="h-full rounded-card bg-sv-navy p-6 shadow-glow-navy md:p-8">
              <Kicker icon={ShieldCheck}>Rentals run on rules</Kicker>
              <h3 className="text-[22px] font-black tracking-tight text-white">The rent side, in three lines</h3>
              <ul className="mt-5 space-y-4 text-[15px] font-medium leading-relaxed text-white/75">
                <li>Deposits cap at three months’ cold rent (§551 BGB) and must sit on a separate savings account.</li>
                <li>Mietpreisbremse caps new leases above local comparative rent in tight areas; Berlin’s Mietspiegel sets the benchmark.</li>
                <li>Modernization may be passed on at 8% of cost per year (§559 BGB) — check the Anpassung history before you underwrite.</li>
              </ul>
              <p className="mt-6 text-[13px] font-bold text-white/50">
                Qualitative anchors only — live numbers come from the official city Mietspiegel, never a hardcoded table.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function DeveloperRail() {
  return (
    <section className="relative overflow-hidden bg-sv-cloud py-16 md:py-24">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <SectionHead
          icon={ShieldCheck}
          kicker="Developers"
          title="The builders behind the pipeline"
          sub="Municipal landlords, premium Bauträger and boutique owner-run developers — tracked from Handelsregister to handover."
        />
      </div>
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <HScroll aria-label="German developers" step={320} className="gap-5 pb-4">
          {RAIL_DEVELOPERS.map((d) => {
            const initials = d.name.en
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase()
            const body = (
              <>
                <div className="flex items-center gap-3.5">
                  <span
                    aria-hidden
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-control bg-sv-blue/10 text-[15px] font-black text-sv-blue-deep dark:text-sv-blue-light"
                  >
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-[16px] font-black text-sv-ink">{d.name.en}</h3>
                      {d.verified && <ShieldCheck className="h-4 w-4 shrink-0 text-sv-blue" aria-label="Verified" />}
                    </div>
                    <p className="truncate text-[12px] font-bold text-sv-ink/60">
                      {CITY_EN.get(d.city) ?? d.city} · {d.yearsActive} yrs · {nf.format(d.unitsDelivered)} units delivered
                    </p>
                  </div>
                </div>
                <p className="mt-4 line-clamp-3 border-t border-sv-ink/[0.06] pt-3 text-[13px] font-semibold leading-snug text-sv-ink/60">
                  {d.description.en}
                </p>
                {d.website ? (
                  <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-extrabold text-sv-blue-deep dark:text-sv-blue-light">
                    Official site <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                ) : null}
              </>
            )
            const cls =
              'group flex w-[300px] shrink-0 flex-col rounded-tile border border-sv-ink/[0.07] bg-sv-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-sv-blue/30 hover:shadow-card-hover'
            return d.website ? (
              <a key={d.slug} href={d.website} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
            ) : (
              <div key={d.slug} className={cls}>{body}</div>
            )
          })}
        </HScroll>
      </div>
    </section>
  )
}

export default function DeMarketHome({ copy }: { copy: CountryCopy }) {
  const pair = heroPair(copy.h1)
  return (
    <main id="main">
      <PageHero
        kicker="sivrce · Germany"
        title={
          pair.place ? (
            <>
              <span className="block">{pair.lead}</span>
              <span className="text-gradient-blue">{pair.place}</span>
            </>
          ) : (
            copy.h1
          )
        }
        subtitle={copy.lede}
      >
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/de/berlin/buy"
            className="rounded-full bg-sv-orange px-5 py-2.5 text-[14px] font-extrabold text-sv-ink shadow-glow-orange"
          >
            Kaufen in Berlin
          </Link>
          <Link
            href="/de/berlin/rent"
            className="rounded-full bg-white/10 px-5 py-2.5 text-[14px] font-extrabold text-white ring-1 ring-white/15"
          >
            Mieten in Berlin
          </Link>
          <Link
            href={mapHrefForPlace(BERLIN_PIN.lat, BERLIN_PIN.lng, 11)}
            className="rounded-full bg-white/10 px-5 py-2.5 text-[14px] font-extrabold text-white/90 ring-1 ring-white/12"
          >
            Karte · StEP & ALKIS
          </Link>
          <a
            href="#new-builds"
            className="rounded-full bg-white/10 px-5 py-2.5 text-[14px] font-extrabold text-white/90 ring-1 ring-white/12"
          >
            {nf.format(DE_PROJECTS.length)} Neubauten
          </a>
        </div>
      </PageHero>
      <StatsBand />
      <ProjectRail />
      <CitiesBand />
      <BuyerCosts />
      <DeveloperRail />
      <section className="bg-sv-cloud pb-16 md:pb-24">
        <div className="mx-auto max-w-3xl px-5 md:px-10">
          <Reveal>
            <article className="speakable-lead space-y-5 text-[16px] font-medium leading-relaxed text-sv-ink/80">
              {copy.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </article>
          </Reveal>
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
            Prices and availability are published only when a verified listing exists. Market currency: EUR.
          </p>
        </div>
      </section>
    </main>
  )
}
