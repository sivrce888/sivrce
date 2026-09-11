import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, Building2, CalendarCheck, Home, Landmark, MapPin, ShieldCheck } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import HScroll from '@/components/HScroll'
import CountryHero from '@/components/country/CountryHero'
import type { Developer, Project } from '@/data/professionals'
import { NEW_DEVELOPERS_BERLIN, NEW_PROJECTS_BERLIN } from '@/data/projects-new-berlin'
import { NEW_DEVELOPERS_GERMANY, NEW_PROJECTS_GERMANY } from '@/data/projects-new-germany'
import { BERLIN_BEZIRKE, DE_CITIES, buyerCostBreakdown, deCityBySlug } from '@/lib/countries/de'
import { cityPack, type CountryCopy } from '@/lib/country-copy'
import type { Lang } from '@/lib/i18n/core'
import { COM_ORIGIN, MARKETS } from '@/lib/markets'
import { hasPriceFrom, priceFromLabel } from '@/lib/directory-seo-lite'

/**
 * sivrce.com/de marketplace home — same section rhythm as sivrce.ge
 * (hero → stats → new-builds → cities → market rules → developers → FAQ),
 * German data: EUR, Grunderwerbsteuer, street-verified Berlin pipeline.
 * Project cards carry first-party generated renders (gen-project-renders.ts)
 * and link into the local /projects detail pages with the full gallery.
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

const DEV_BY_SLUG = new Map(DE_DEVELOPERS.map((d) => [d.slug, d.name.en]))

const UNITS_PIPELINE = DE_PROJECTS.filter((p) => p.done < 100).reduce((n, p) => n + (p.flats || 0), 0)
const VERIFIED_DEVS = DE_DEVELOPERS.filter((d) => d.verified).length

function projectsForCity(citySlug?: string): Project[] {
  const ka = citySlug ? deCityBySlug(citySlug)?.ka : null
  const scoped = ka ? DE_PROJECTS.filter((p) => p.city === ka) : DE_PROJECTS
  return (scoped.length >= 3 ? scoped : DE_PROJECTS).slice(0, 12)
}

function developersForCity(citySlug?: string): Developer[] {
  const ka = citySlug ? deCityBySlug(citySlug)?.ka : null
  const scoped = ka ? DE_DEVELOPERS.filter((d) => d.city === ka) : DE_DEVELOPERS
  return (scoped.length >= 3 ? scoped : DE_DEVELOPERS).slice(0, 12)
}

const nf = new Intl.NumberFormat('en-US')
const priceLabel = (p: Project) => priceFromLabel(p.priceFromM2, 'en')
/** Catalog finish strings arrive in ka ('ჩაბარებული') or German ('In Planung'/'Im Bau') — show EN on /de. */
const FINISH_EN = new Map([
  ['ჩაბარებული', 'Completed'],
  ['In Planung', 'In planning'],
  ['Im Bau', 'Under construction'],
])
const finishLabel = (p: Project) => FINISH_EN.get(p.finish) ?? p.finish

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

function StatsBand({ de }: { de: boolean }) {
  const stats = de
    ? [
        { icon: Building2, n: nf.format(DE_PROJECTS.length), label: 'straßenverifizierte Neubauten' },
        { icon: Home, n: nf.format(UNITS_PIPELINE), label: 'Wohnungen in der Pipeline' },
        { icon: ShieldCheck, n: nf.format(VERIFIED_DEVS), label: 'geprüfte Bauträger' },
        { icon: MapPin, n: String(DE_CITIES.length), label: 'Stadtguides live' },
      ]
    : [
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

function ProjectRail({ citySlug, de, lang }: { citySlug?: string; de: boolean; lang: Lang }) {
  const rail = projectsForCity(citySlug)
  return (
    <section id="new-builds" className="relative overflow-hidden bg-sv-cloud py-16 md:py-24">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <SectionHead
          icon={Building2}
          kicker={de ? 'Neubau' : 'New-builds'}
          title={de ? 'Berliner Neubauten, bis zur Hausnummer' : 'Berlin new-builds, tracked to the address'}
          sub={
            de
              ? 'Jedes Projekt ist gegen die offizielle Bauträgerquelle geprüft — Hausnummer, Quartier, Einheiten, Fertigstellung. Preise in EUR/m², wo veröffentlicht.'
              : 'Every project is street-verified against official developer sources — house number, quarter, units, completion. Prices in EUR per m² where published.'
          }
        />
      </div>
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <HScroll aria-label="German new-build projects" step={320} className="gap-5 pb-4">
          {rail.map((p) => {
            // /de/projects/<slug> resolves on sivrce.com via the DE-market
            // catch-all (CountryPage delegates to the project detail route)
            // and on sivrce.ge via the locale rewrite.
            const href = `/de/projects/${p.slug}`
            const dev = DEV_BY_SLUG.get(p.developerSlug) ?? ''
            const body = (
              <>
                <div className="relative -mx-5 -mt-5 mb-4 h-[170px] overflow-hidden rounded-tile rounded-b-none border-b border-sv-ink/[0.06]">
                  <Image src={p.img} alt={`${p.name} — ${dev || 'Neubau'} render`} fill sizes="300px" className="object-cover" />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-black uppercase tracking-wider text-sv-blue">
                      {districtEn(p) || cityEn(p)}
                    </p>
                    <h3 className="mt-1 truncate text-[17px] font-black text-sv-ink">{p.name}</h3>
                  </div>
                  <span className="shrink-0 rounded-full bg-sv-ink/[0.06] px-3 py-1 text-[12px] font-extrabold text-sv-ink/70">
                    {priceLabel(p)}
                    {hasPriceFrom(p.priceFromM2) ? <span className="text-sv-ink/45">/m²</span> : null}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-[13px] font-semibold leading-snug text-sv-ink/55">{p.location}</p>
                <div className="mx-0 mt-4 h-1.5 overflow-hidden rounded-full bg-sv-ink/[0.07]">
                  <div className="h-full rounded-full bg-gradient-to-r from-sv-blue to-sv-violet" style={{ width: `${p.done}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-[12px] font-extrabold text-sv-ink/65">
                  <span>{p.flats ? `${nf.format(p.flats)} ${de ? 'WE' : 'units'} · ` : ''}{p.done}% {de ? 'fertig' : 'built'}</span>
                  <span className="inline-flex items-center gap-1 text-sv-ink/45">
                    <CalendarCheck className="h-3.5 w-3.5" aria-hidden /> {finishLabel(p)}
                  </span>
                </div>
                {dev ? (
                  <p className="mt-3 border-t border-sv-ink/[0.06] pt-3 text-[12px] font-bold text-sv-ink/50">
                    {de ? 'Bauträger' : 'Developer'}: <span className="text-sv-ink/75">{dev}</span>
                  </p>
                ) : null}
              </>
            )
            const cls =
              'group flex w-[300px] shrink-0 flex-col rounded-tile border border-sv-ink/[0.07] bg-sv-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-sv-blue/30 hover:shadow-card-hover'
            return (
              <Link key={p.slug} href={href} className={cls}>
                {body}
              </Link>
            )
          })}
        </HScroll>
      </div>
    </section>
  )
}

function CitiesBand({ de }: { de: boolean }) {
  return (
    <section className="bg-sv-cloud py-16 md:py-20">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <SectionHead
          icon={MapPin}
          kicker={de ? 'Städte' : 'Cities'}
          title={de ? '16 Metropolen, jede mit eigener Grunderwerbsteuer' : '16 metros, each with its own transfer tax'}
          sub={
            de
              ? 'Grunderwerbsteuer ist Landesrecht — dieselbe Wohnung kostet in München und Köln unterschiedlich viel Nebenkosten. Der Stadtguide trägt die lokale Zahl.'
              : 'Grunderwerbsteuer is state law — the same apartment costs a different surcharge in Munich and Cologne. City guides carry the local number.'
          }
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

function BuyerCosts({ citySlug, de }: { citySlug?: string; de: boolean }) {
  const slug = citySlug && deCityBySlug(citySlug) ? citySlug : 'berlin'
  const city = deCityBySlug(slug)
  const place = city?.de ?? 'Berlin'
  const tax = city?.transferTaxPct ?? 6
  const ex = buyerCostBreakdown(500_000, slug)
  if (!ex) return null
  const eur = (n: number) => `€${nf.format(n)}`
  const taxLabel = de
    ? `Grunderwerbsteuer (${tax.toLocaleString('de-DE', { minimumFractionDigits: 1 })} %)`
    : `Transfer tax (Grunderwerbsteuer ${tax.toLocaleString('en-US', { minimumFractionDigits: 1 })}%)`
  return (
    <section className="bg-sv-cloud pb-16 md:pb-24">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal className="h-full">
            <div className="h-full rounded-card border border-sv-ink/[0.07] bg-sv-surface p-6 shadow-card md:p-8">
              <Kicker icon={Landmark}>{de ? 'Was ein Kauf wirklich kostet' : 'What a purchase really costs'}</Kicker>
              <h3 className="text-[22px] font-black tracking-tight text-sv-ink">
                {de ? `Wohnung 500.000 € in ${place}` : `€500,000 apartment in ${place}`}
              </h3>
              <dl className="mt-5 space-y-2.5 text-[15px] font-bold">
                <div className="flex justify-between text-sv-ink/70">
                  <dt>{taxLabel}</dt><dd>{eur(ex.transferTax)}</dd>
                </div>
                <div className="flex justify-between text-sv-ink/70">
                  <dt>{de ? 'Notar (≈1,5 %)' : 'Notary (≈1.5%)'}</dt><dd>{eur(ex.notary)}</dd>
                </div>
                <div className="flex justify-between text-sv-ink/70">
                  <dt>{de ? 'Grundbuch (≈0,5 %)' : 'Land register (Grundbuch ≈0.5%)'}</dt><dd>{eur(ex.register)}</dd>
                </div>
                <div className="flex justify-between text-sv-ink/70">
                  <dt>{de ? 'Käufer-Makleranteil (3,57 % inkl. MwSt.)' : 'Buyer agent share (3.57% incl. VAT)'}</dt><dd>{eur(ex.makler)}</dd>
                </div>
                <div className="mt-3 flex justify-between border-t border-sv-ink/[0.08] pt-3 text-[17px] font-black text-sv-ink">
                  <dt>{de ? 'Liquidität beim Notar' : 'Cash needed at notary'}</dt><dd>{eur(ex.total)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-[13px] font-semibold leading-relaxed text-sv-ink/55">
                {de
                  ? `≈ +${ex.totalPct} % auf den Kaufpreis. Provisionsfreie Inserate streichen die Maklerzeile. Der Notar verliest den Vertrag vor der Unterschrift — Gesetz, keine Formsache.`
                  : `≈ +${ex.totalPct}% over the price. Provisionsfrei (no-agent) listings drop the Makler line. The notary reads the contract aloud before signature — German law, not a formality.`}
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.04} className="h-full">
            <div className="h-full rounded-card bg-sv-navy p-6 shadow-glow-navy md:p-8">
              <Kicker icon={ShieldCheck}>{de ? 'Miete läuft nach Regeln' : 'Rentals run on rules'}</Kicker>
              <h3 className="text-[22px] font-black tracking-tight text-white">
                {de ? 'Die Mietseite, in drei Sätzen' : 'The rent side, in three lines'}
              </h3>
              <ul className="mt-5 space-y-4 text-[15px] font-medium leading-relaxed text-white/75">
                <li>
                  {de
                    ? 'Kaution höchstens drei Kaltmieten (§551 BGB), getrennt angelegt.'
                    : 'Deposits cap at three months’ cold rent (§551 BGB) and must sit on a separate savings account.'}
                </li>
                <li>
                  {de
                    ? 'Mietpreisbremse begrenzt Neuverträge über der ortsüblichen Vergleichsmiete; der Berliner Mietspiegel ist die Referenz.'
                    : 'Mietpreisbremse caps new leases above local comparative rent in tight areas; Berlin’s Mietspiegel sets the benchmark.'}
                </li>
                <li>
                  {de
                    ? 'Modernisierung darf mit 8 % der Kosten pro Jahr umgelegt werden (§559 BGB) — Anpassungen prüfen, bevor Sie unterschreiben.'
                    : 'Modernization may be passed on at 8% of cost per year (§559 BGB) — check the Anpassung history before you underwrite.'}
                </li>
              </ul>
              <p className="mt-6 text-[13px] font-bold text-white/50">
                {de
                  ? 'Qualitative Anker — lebende Zahlen kommen aus dem amtlichen Mietspiegel, nie aus einer hartkodierten Tabelle.'
                  : 'Qualitative anchors only — live numbers come from the official city Mietspiegel, never a hardcoded table.'}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function DeveloperRail({ citySlug, de }: { citySlug?: string; de: boolean }) {
  const rail = developersForCity(citySlug)
  return (
    <section className="relative overflow-hidden bg-sv-cloud py-16 md:py-24">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <SectionHead
          icon={ShieldCheck}
          kicker={de ? 'Bauträger' : 'Developers'}
          title={de ? 'Wer die Pipeline baut' : 'The builders behind the pipeline'}
          sub={
            de
              ? 'Kommunale Wohnungsunternehmen, Premium-Bauträger, inhabergeführte Boutiquen — vom Handelsregister bis zur Übergabe.'
              : 'Municipal landlords, premium Bauträger and boutique owner-run developers — tracked from Handelsregister to handover.'
          }
        />
      </div>
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <HScroll aria-label="German developers" step={320} className="gap-5 pb-4">
          {rail.map((d) => {
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
                      {CITY_EN.get(d.city) ?? d.city} · {d.yearsActive} {de ? 'J.' : 'yrs'} · {nf.format(d.unitsDelivered)} {de ? 'WE übergeben' : 'units delivered'}
                    </p>
                  </div>
                </div>
                <p className="mt-4 line-clamp-3 border-t border-sv-ink/[0.06] pt-3 text-[13px] font-semibold leading-snug text-sv-ink/60">
                  {d.description.en}
                </p>
                {d.website ? (
                  <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-extrabold text-sv-blue-deep dark:text-sv-blue-light">
                    {de ? 'Offizielle Seite' : 'Official site'} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
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

export default function DeMarketHome({
  copy,
  city,
  intent,
  lang = 'en',
}: {
  copy: CountryCopy
  city?: string
  intent?: 'buy' | 'rent'
  lang?: Lang
}) {
  const de = lang === 'de'
  const cities = MARKETS.de.citySlugs.flatMap((s) => {
    const p = cityPack('de', s)
    return p ? [{ slug: s, name: p.name }] : []
  })
  return (
    <main id="main">
      <CountryHero country="de" copy={copy} city={city} intent={intent} cities={cities} lang={lang} />
      <StatsBand de={de} />
      <ProjectRail citySlug={city} de={de} lang={lang} />
      <CitiesBand de={de} />
      <BuyerCosts citySlug={city} de={de} />
      <DeveloperRail citySlug={city} de={de} />
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
            {de ? 'Alle Märkte: ' : 'All markets: '}
            <a href={`${COM_ORIGIN}/?worldwide=1`} className="text-sv-blue">sivrce.com</a>
            {' · '}
            {de ? 'Marktplatz Georgien: ' : 'Georgia marketplace: '}
            <a href="https://sivrce.ge/" className="text-sv-blue">sivrce.ge</a>
            {' · '}
            {de
              ? 'Preise und Verfügbarkeit nur bei geprüftem Inserat. Marktwährung: EUR.'
              : 'Prices and availability are published only when a verified listing exists. Market currency: EUR.'}
          </p>
        </div>
      </section>
    </main>
  )
}
