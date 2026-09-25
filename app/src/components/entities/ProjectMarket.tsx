import Link from 'next/link'
import type { NearbyProject } from '@/lib/directory-live'
import type { Project } from '@/data/professionals'
import { finishLabel, hasPriceFrom, priceFromLabel, type DirLoc } from '@/lib/directory-seo-lite'
import type { MarketPosition, PriceCurrency } from '@/lib/project-insights'
import type { ProjectPageCopy } from '@/lib/project-page-copy'

const SYMBOL: Record<PriceCurrency, string> = { USD: '$', GEL: '₾', EUR: '€' }
const money = (n: number, c: PriceCurrency) => `${SYMBOL[c]}${n.toLocaleString('en-US')}`

interface Props {
  project: Project
  position: MarketPosition | null
  /** Localized district/city name the percentile was computed over. */
  scopeName: string
  nearby: NearbyProject[]
  devNames: Map<string, string>
  t: ProjectPageCopy
  loc: DirLoc | 'de'
}

/**
 * "Is this price fair, and what else is around?" — percentile among priced
 * peers plus a crawlable comparison table. Server-only; zero client JS.
 */
export function ProjectMarket({ project, position, scopeName, nearby, devNames, t, loc }: Props) {
  if (!position && nearby.length === 0) return null
  const rows: (Project & { distanceKm?: number })[] = [project, ...nearby]
  return (
    <section id="market" className="mx-auto max-w-[1440px] scroll-mt-[7.5rem] px-5 py-12 md:px-10">
      <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">{t.marketTitle}</h2>
      <div className={`mt-6 grid gap-6 ${position && nearby.length > 0 ? 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]' : ''}`}>
        {position && (
          <div className="self-start rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
            <p className="inline-flex rounded-full bg-sv-blue/[0.08] px-3 py-1 text-[13px] font-extrabold text-sv-blue-deep">
              {t.marketChip(position.deltaPct, scopeName)}
            </p>
            <p className="mt-4 text-[15px] font-semibold leading-relaxed text-sv-ink/75">
              {t.marketBody(priceFromLabel(project.priceFromM2, loc), money(position.median, position.currency), position.peers, scopeName)}
            </p>
            <div className="mt-8" aria-hidden>
              <div className="relative h-2 rounded-full bg-gradient-to-r from-sv-blue/25 via-sv-ink/10 to-sv-orange/30">
                <span className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-sv-ink/30" style={{ left: '50%' }} />
                <span
                  className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-sv-surface bg-sv-blue shadow-card"
                  style={{ left: `${position.pct}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[12px] font-bold text-sv-ink/60">
                <span>
                  {t.lower} · {money(position.min, position.currency)}
                </span>
                <span>
                  {money(position.max, position.currency)} · {t.higher}
                </span>
              </div>
            </div>
            <p className="mt-5 text-[12px] font-semibold text-sv-ink/60">{t.marketNote}</p>
          </div>
        )}
        {nearby.length > 0 && (
          <div className="overflow-x-auto rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card">
            <table className="w-full min-w-[560px] text-left text-[14px]">
              <caption className="px-5 pt-5 text-left text-[15px] font-black text-sv-ink">
                {t.compareTitle}
                <span className="mt-0.5 block text-[12px] font-semibold text-sv-ink/60">{t.compareCaption}</span>
              </caption>
              <thead>
                <tr className="border-b border-sv-ink/[0.06] text-[12px] font-bold uppercase tracking-wide text-sv-ink/60">
                  <th scope="col" className="px-5 py-3">{t.colProject}</th>
                  <th scope="col" className="px-3 py-3">{t.colPrice}</th>
                  <th scope="col" className="px-3 py-3">{t.colHandover}</th>
                  <th scope="col" className="px-3 py-3">{t.colBuilt}</th>
                  <th scope="col" className="px-5 py-3 text-right">{t.colDistance}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => {
                  const self = i === 0
                  const dev = p.developerSlug ? devNames.get(p.developerSlug) : undefined
                  return (
                    <tr key={p.slug} className={self ? 'bg-sv-blue/[0.05]' : 'border-t border-sv-ink/[0.05]'}>
                      <th scope="row" className="px-5 py-3 font-black text-sv-ink">
                        {self ? (
                          <span>{p.name}</span>
                        ) : (
                          <Link href={`/projects/${p.slug}`} className="text-sv-ink hover:text-sv-blue-deep hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue">
                            {p.name}
                          </Link>
                        )}
                        <span className="block text-[12px] font-semibold text-sv-ink/60">
                          {self ? t.thisProject : dev ?? '—'}
                        </span>
                      </th>
                      <td className="px-3 py-3 font-black text-sv-ink">
                        {hasPriceFrom(p.priceFromM2) ? p.priceFromM2 : '—'}
                      </td>
                      <td className="px-3 py-3 font-bold text-sv-ink/75">{finishLabel(loc, p.finish) || '—'}</td>
                      <td className="px-3 py-3 font-bold text-sv-ink/75">{p.done}%</td>
                      <td className="px-5 py-3 text-right font-bold text-sv-ink/75">
                        {p.distanceKm === undefined ? '—' : t.distance(p.distanceKm)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
