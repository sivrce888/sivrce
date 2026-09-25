/**
 * Shared projects grid + pager for the /projects hub and its page/[pg] segments.
 * Private component file (not a route). Keeps card markup in one place so the
 * hub, paginated pages and future sub-hubs render identical cards.
 */
import Link from 'next/link'
import Image from 'next/image'
import { Building2, CalendarCheck, CheckCircle2, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { MICRO, MICRO_DE, finishLabel, hasPriceFrom, priceFromLabel, unitsLabel, type DirLoc } from '@/lib/directory-seo-lite'
import { marketChip } from '@/lib/market-chip'
import type { ProjectCard } from './card'

/** Cards per hub page — 12 rows × 3 cols desktop. Caps ISR payload weight. */
export const PER_PAGE = 36

export function ProjectsGrid({ projects, loc }: { projects: ProjectCard[]; loc: DirLoc | 'de' }) {
  const micro = loc === 'de' ? MICRO_DE : MICRO[loc]
  if (projects.length === 0) {
    return (
      <div className="mt-6 rounded-card border border-dashed border-sv-ink/15 px-6 py-12 text-center text-[14px] font-semibold text-sv-ink/65">
        {micro.emptyProjects}
      </div>
    )
  }
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((p, i) => (
        <Link
          key={p.slug}
          href={`/projects/${p.slug}`}
          // no aria-label: visible text (name+dev+status) IS the accessible name
          className="group block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
        >
          <article className="flex h-full flex-col overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-card-hover">
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={p.img}
                alt={p.name}
                fill
                sizes="(max-width:640px) 100vw, (max-width:1280px) 50vw, 460px"
                priority={i < 3}
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
              {p.delivered ? (
                <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-sv-surface/95 px-3 py-1 text-[12px] font-extrabold text-sv-ink shadow-card">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sv-blue" aria-hidden />
                  {finishLabel(loc, p.finish) || micro.builtPct(100)}
                </span>
              ) : (
                <span className="absolute left-4 top-4 rounded-full bg-sv-navy/60 px-3 py-1 text-[12px] font-extrabold text-white backdrop-blur">
                  {micro.builtPct(p.done)}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h2 className="text-[18px] font-black leading-snug text-sv-ink">{p.name}</h2>
              {p.devName && <p className="text-[13px] font-bold text-sv-ink/60">{p.devName}</p>}
              <p className="mt-2 flex items-start gap-1.5 text-[13px] font-semibold text-sv-ink/65">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sv-ink/35" aria-hidden />
                <span className="line-clamp-1" title={p.location}>{p.location}</span>
              </p>
              <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                <div className="min-w-0">
                  <p className="text-[20px] font-black tracking-[-0.01em] text-sv-ink">
                    {priceFromLabel(p.priceFromM2, loc) || '—'}
                    {hasPriceFrom(p.priceFromM2) && (
                      <span className="text-[12px] font-bold text-sv-ink/60"> {micro.perM2From}</span>
                    )}
                  </p>
                  {p.vs !== undefined && p.vsIn && (
                    <p className="mt-1 inline-flex rounded-full bg-sv-blue/[0.08] px-2.5 py-0.5 text-[12px] font-extrabold text-sv-blue-deep">
                      {marketChip(loc, p.vs, p.vsIn)}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right text-[12px] font-bold leading-relaxed text-sv-ink/60">
                  {!p.delivered && (
                    <span className="flex items-center justify-end gap-1">
                      <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
                      {finishLabel(loc, p.finish)}
                    </span>
                  )}
                  <span className="flex items-center justify-end gap-1">
                    <Building2 className="h-3.5 w-3.5" aria-hidden />
                    {unitsLabel(p.flats, loc)}
                  </span>
                </div>
              </div>
              {!p.delivered && (
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sv-ink/[0.07]" aria-hidden>
                  <div className="h-full rounded-full bg-gradient-to-r from-sv-blue to-sv-violet" style={{ width: `${p.done}%` }} />
                </div>
              )}
            </div>
          </article>
        </Link>
      ))}
    </div>
  )
}

/** Apple-minimal pager: ‹ 2 / 28 › — page 1 links to the canonical basePath. */
export function Pager({
  page,
  totalPages,
  loc,
  basePath = '/projects',
}: {
  page: number
  totalPages: number
  loc: DirLoc | 'de'
  basePath?: string
}) {
  const micro = loc === 'de' ? MICRO_DE : MICRO[loc]
  const href = (n: number) => (n <= 1 ? basePath : `${basePath}/page/${n}`)
  const cls = 'flex h-11 w-11 items-center justify-center rounded-control border border-sv-ink/10 bg-sv-surface text-sv-ink shadow-card transition-colors hover:border-sv-ink/25'
  return (
    <nav className="mt-10 flex items-center justify-center gap-4" aria-label={micro.page(page)}>
      {page > 1 ? (
        <Link href={href(page - 1)} className={cls} aria-label={micro.prev} rel="prev">
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Link>
      ) : (
        <span className={`${cls} opacity-30`} aria-hidden>
          <ChevronLeft className="h-5 w-5" />
        </span>
      )}
      <span className="text-[14px] font-black tabular-nums text-sv-ink/70">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={href(page + 1)} className={cls} aria-label={micro.next} rel="next">
          <ChevronRight className="h-5 w-5" aria-hidden />
        </Link>
      ) : (
        <span className={`${cls} opacity-30`} aria-hidden>
          <ChevronRight className="h-5 w-5" />
        </span>
      )}
    </nav>
  )
}
