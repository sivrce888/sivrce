import { Building2, Globe2, MapPin, Search, Scale, KeyRound } from 'lucide-react'
import { getServerT } from '@/lib/i18n/server'
import { localizedHref, type Lang } from '@/lib/i18n/core'
import { deskWorldIndex, visitorDesk, type VisitorDesk } from '@/lib/home-desk'
import { globalOsStats } from '@/lib/countries/global-os'
import { COM_ORIGIN } from '@/lib/markets'

/**
 * sivrce.com World Desk — the visitor's own country first, the world index
 * under it. Server-only, zero client JS, every string from the locale dict.
 *
 * Honest by construction: purchase costs render only where a verified
 * statutory table exists, city links only where the market ships that page,
 * and a country with neither says so instead of faking a hub.
 * ponytail: two sections in one file; split when a third surface needs them.
 *
 * Country hubs are absolute sivrce.com URLs on purpose: `/de` is Germany only
 * on that host — everywhere else `/de` is the German locale prefix.
 */

const fmtNum = (n: number, lang: Lang) => {
  try {
    return new Intl.NumberFormat(lang).format(n)
  } catch {
    return n.toLocaleString('en-US')
  }
}

function StateBadge({ desk, t }: { desk: VisitorDesk; t: ReturnType<typeof getServerT> }) {
  const label =
    desk.state === 'deep'
      ? t('desk.state.deep')
      : desk.state === 'pinned'
        ? t('desk.state.pinned')
        : t('desk.state.discovery')
  const tone =
    desk.state === 'deep'
      ? 'bg-sv-blue/10 text-sv-blue-deep dark:text-sv-blue-light'
      : 'bg-sv-ink/[0.06] text-sv-ink/60'
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${tone}`}>
      <Globe2 className="h-3.5 w-3.5" aria-hidden /> {label}
    </span>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] font-bold text-sv-ink/45">{label}</dt>
      <dd className="truncate text-[15px] font-extrabold text-sv-ink">{value}</dd>
    </div>
  )
}

/** The visitor's country, resolved server-side from the edge geo header. */
function VisitorPanel({ desk, lang }: { desk: VisitorDesk; lang: Lang }) {
  const t = getServerT(lang)
  const href = (p: string) => localizedHref(p, lang)
  const cost = desk.cost

  return (
    <section
      aria-labelledby="world-desk"
      className="border-t border-sv-ink/[0.06] bg-sv-surface"
    >
      <div className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
        <StateBadge desk={desk} t={t} />
        <h2 id="world-desk" className="sv-h2 mt-3 text-sv-ink">
          {desk.name}
        </h2>
        <p className="mt-2 text-[13px] font-black uppercase tracking-wider text-sv-ink/40">
          {t('desk.kicker')}
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {/* Facts + actions */}
          <div className="rounded-card border border-sv-ink/[0.07] bg-sv-surface p-6 shadow-card">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
              <Fact label={t('desk.currency')} value={desk.currency} />
              {desk.capital ? <Fact label={t('desk.capital')} value={desk.capital} /> : null}
              {desk.population ? (
                <Fact label={t('desk.population')} value={fmtNum(desk.population, lang)} />
              ) : null}
            </dl>
            {desk.note ? (
              <p className="mt-5 text-[13px] font-semibold leading-relaxed text-sv-ink/60">
                {desk.note}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-2">
              {desk.hubPath ? (
                <a
                  href={`${COM_ORIGIN}${desk.hubPath}`}
                  className="inline-flex items-center gap-2 rounded-full bg-sv-blue px-5 py-2.5 text-[14px] font-extrabold text-white transition hover:bg-sv-blue-deep"
                >
                  <Building2 className="h-4 w-4" aria-hidden />
                  {t('desk.hubCta', { country: desk.name })}
                </a>
              ) : null}
              <a
                href={href(desk.searchHref)}
                className="inline-flex items-center gap-2 rounded-full border border-sv-edge bg-sv-surface px-5 py-2.5 text-[14px] font-extrabold text-sv-ink transition hover:border-sv-blue/40 hover:text-sv-blue"
              >
                <Search className="h-4 w-4" aria-hidden />
                {t('desk.searchCta', { country: desk.name })}
              </a>
              <a
                href={href(desk.mapHref)}
                className="inline-flex items-center gap-2 rounded-full border border-sv-edge bg-sv-surface px-5 py-2.5 text-[14px] font-extrabold text-sv-ink transition hover:border-sv-blue/40 hover:text-sv-blue"
              >
                <MapPin className="h-4 w-4" aria-hidden />
                {t('desk.mapCta')}
              </a>
            </div>
          </div>

          {/* Purchase costs — statute only, never an estimate dressed as fact */}
          <div className="rounded-card border border-sv-ink/[0.07] bg-sv-cloud p-6 shadow-card">
            <h3 className="flex items-center gap-2 text-[13px] font-black uppercase tracking-wider text-sv-ink/45">
              <Scale className="h-3.5 w-3.5" aria-hidden /> {t('desk.cost')}
            </h3>
            {cost ? (
              <>
                <p className="mt-3 text-[30px] font-black tracking-tight text-sv-ink md:text-[36px]">
                  {t('desk.costTotal', { pct: cost.totalPct })}
                </p>
                <p className="mt-1 text-[14px] font-extrabold text-sv-ink/70">{cost.cashLabel}</p>
                <p
                  title={cost.chipTitle}
                  className="mt-4 text-[13px] font-extrabold text-sv-ink/80"
                >
                  {cost.taxLabel} · {cost.chip}
                </p>
                <p className="mt-1 text-[13px] font-semibold text-sv-ink/55">{cost.closer}</p>
                <p className="mt-3 text-[12px] font-semibold leading-relaxed text-sv-ink/50">
                  {cost.note}
                </p>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-sv-ink/40">
                  {t('desk.costAsOf', { year: cost.asOf })}
                </p>
              </>
            ) : (
              <p className="mt-3 text-[13px] font-semibold leading-relaxed text-sv-ink/60">
                {t('desk.noCost')}
              </p>
            )}
          </div>

          {/* Rent rules where verified, otherwise the honest not-launched line */}
          <div className="rounded-card border border-sv-ink/[0.07] bg-sv-surface p-6 shadow-card">
            <h3 className="flex items-center gap-2 text-[13px] font-black uppercase tracking-wider text-sv-ink/45">
              <KeyRound className="h-3.5 w-3.5" aria-hidden /> {t('desk.rent')}
            </h3>
            {cost ? (
              <>
                <p className="mt-3 text-[15px] font-extrabold text-sv-ink">{cost.rentTitle}</p>
                <ul className="mt-3 space-y-2">
                  {cost.rentRules.map((r) => (
                    <li
                      key={r}
                      className="flex gap-2 text-[13px] font-semibold leading-relaxed text-sv-ink/65"
                    >
                      <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sv-blue" />
                      {r}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[12px] font-semibold leading-relaxed text-sv-ink/50">
                  {cost.rentNote}
                </p>
              </>
            ) : (
              <p className="mt-3 text-[13px] font-semibold leading-relaxed text-sv-ink/60">
                {t('desk.notLaunched', { country: desk.name })}
              </p>
            )}
          </div>
        </div>

        {desk.cities.length > 0 ? (
          <div className="mt-8">
            <h3 className="text-[13px] font-black uppercase tracking-wider text-sv-ink/45">
              {t('desk.cities')}
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {desk.cities.map((c) => (
                <li key={c.slug}>
                  <a
                    href={c.href ? `${COM_ORIGIN}${c.href}` : href(c.searchHref)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-sv-edge bg-sv-surface px-4 py-2 text-[13px] font-extrabold text-sv-ink transition hover:border-sv-blue/40 hover:text-sv-blue"
                  >
                    <MapPin className="h-3.5 w-3.5 text-sv-blue" aria-hidden />
                    {c.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}

/** Launched markets by region — currency + statutory purchase tax per row. */
function WorldIndex({ lang }: { lang: Lang }) {
  const t = getServerT(lang)
  const href = (p: string) => localizedHref(p, lang)
  const regions = deskWorldIndex(lang)
  return (
    <section aria-labelledby="world-markets" className="border-t border-sv-ink/[0.06] bg-sv-cloud">
      <div className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
        <h2 id="world-markets" className="sv-h2 text-sv-ink">
          {t('desk.world')}
        </h2>
        <p className="mt-2 max-w-2xl text-[15px] font-semibold text-sv-ink/65">
          {t('desk.worldSub')}
        </p>
        <div className="mt-8 space-y-10">
          {regions.map((r) => (
            <div key={r.region}>
              <h3 className="text-[13px] font-black uppercase tracking-wider text-sv-ink/45">
                {r.region}
              </h3>
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {r.countries.map((c) => (
                  <li key={c.id}>
                    <a
                      href={`${COM_ORIGIN}${c.path}`}
                      className="group flex h-full flex-col rounded-module border border-sv-ink/[0.07] bg-sv-surface px-4 py-3 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-sv-blue/30 hover:shadow-card-hover"
                    >
                      <span className="truncate text-[14px] font-extrabold text-sv-ink group-hover:text-sv-blue">
                        {c.name}
                      </span>
                      <span className="mt-0.5 truncate text-[12px] font-bold text-sv-ink/45">
                        {c.currency}
                        {c.chip ? (
                          <>
                            {' · '}
                            <span title={c.chipTitle ?? undefined}>{c.chip}</span>
                          </>
                        ) : null}
                        {' · '}
                        {t('desk.citiesN', { n: c.cities })}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <a
          href={href('/countries')}
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-sv-edge bg-sv-surface px-5 py-2.5 text-[14px] font-extrabold text-sv-ink transition hover:border-sv-blue/40 hover:text-sv-blue"
        >
          <Globe2 className="h-4 w-4" aria-hidden />
          {t('desk.worldAll', { n: globalOsStats().isoCountries })}
        </a>
      </div>
    </section>
  )
}

/**
 * `cc` is the edge geo header (x-vercel-ip-country / cf-ipcountry). Unknown or
 * unresolvable → the world index alone; we never guess a market.
 */
export default function WorldDesk({ cc, lang }: { cc: string | null; lang: Lang }) {
  const desk = visitorDesk(cc, lang)
  return (
    <>
      {desk ? <VisitorPanel desk={desk} lang={lang} /> : null}
      <WorldIndex lang={lang} />
    </>
  )
}
