/**
 * Shared projects grid + pager for the /projects hub and its page/[pg] segments.
 * Private component file (not a route). Keeps card markup in one place so the
 * hub, paginated pages and future sub-hubs render identical cards.
 */
import Link from 'next/link'
import Image from 'next/image'
import { Building2, CalendarCheck, CheckCircle2, ChevronLeft, ChevronRight, MapPin, Star } from 'lucide-react'
import { getDeveloper, isDelivered, type Project } from '@/data/professionals'
import { MICRO, finishLabel, pickLoc, unitsLabel, type DirLoc } from '@/lib/directory-seo'

/** Cards per hub page — 18 rows × 2 cols desktop. Caps ISR payload weight. */
export const PER_PAGE = 36

export function ProjectsGrid({ projects, loc }: { projects: Project[]; loc: DirLoc }) {
  const micro = MICRO[loc]
  if (projects.length === 0) {
    return (
      <div className="mt-6 rounded-card border border-dashed border-sv-ink/15 px-6 py-12 text-center text-[14px] font-semibold text-sv-ink/65">
        პროექტები ჯერ არ არის ხელმისაწვდომი — სცადე მოგვიანებით
      </div>
    )
  }
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      {projects.map((p) => {
        const dev = getDeveloper(p.developerSlug)
        const delivered = isDelivered(p)
        return (
          <Link
            key={p.slug}
            href={`/projects/${p.slug}`}
            aria-label={p.name}
            className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue rounded-card"
          >
            <article className="overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-card-hover">
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={p.img}
                  alt={p.name}
                  fill
                  sizes="(max-width:1024px) 100vw, 690px"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-sv-navy/75 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                  <div>
                    <h2 className="text-[22px] font-black text-white [text-shadow:0_2px_10px_rgba(5,11,38,0.55)]">
                      {p.name}
                    </h2>
                    {dev && (
                      <p className="text-[13px] font-bold text-white/80">{pickLoc(dev.name, loc)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 rounded-control bg-white/95 px-3 py-1.5 text-[14px] font-black text-sv-ink">
                    <Star className="h-3.5 w-3.5 fill-sv-orange text-sv-orange" aria-hidden />
                    {p.rating}
                  </div>
                </div>
                {delivered ? (
                  <div className="absolute left-5 top-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[12px] font-extrabold text-sv-ink backdrop-blur">
                    <CheckCircle2 className="h-3.5 w-3.5 text-sv-success" aria-hidden />
                    {finishLabel(loc, p.finish)}
                  </div>
                ) : (
                  <div className="absolute left-5 top-4 rounded-full bg-sv-navy/55 px-3.5 py-1.5 text-[12px] font-extrabold text-white backdrop-blur">
                    {micro.builtPct(p.done)}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-5">
                <span className="flex items-center gap-1.5 text-[13px] font-bold text-sv-ink/70">
                  <MapPin className="h-4 w-4 text-sv-ink/35" aria-hidden /> {p.location}
                </span>
                <span className="flex items-center gap-1.5 text-[13px] font-bold text-sv-ink/70">
                  <CalendarCheck className="h-4 w-4 text-sv-ink/35" aria-hidden /> {micro.handover}{' '}
                  {finishLabel(loc, p.finish)}
                </span>
                <span className="flex items-center gap-1.5 text-[13px] font-bold text-sv-ink/70">
                  <Building2 className="h-4 w-4 text-sv-ink/35" aria-hidden /> {unitsLabel(p.flats, loc)}
                </span>
                <span className="ml-auto text-[16px] font-black text-sv-blue">
                  {p.priceFromM2}
                  <span className="text-[12px] font-bold text-sv-ink/60"> {micro.perM2From}</span>
                </span>
              </div>
              {!delivered && (
                <div className="mx-5 mb-5 h-1.5 overflow-hidden rounded-full bg-sv-ink/[0.07]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sv-blue to-sv-violet"
                    style={{ width: `${p.done}%` }}
                  />
                </div>
              )}
            </article>
          </Link>
        )
      })}
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
  loc: DirLoc
  basePath?: string
}) {
  const micro = MICRO[loc]
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
