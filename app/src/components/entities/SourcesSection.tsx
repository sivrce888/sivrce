import { ArrowUpRight } from 'lucide-react'
import type { PublicFactRow } from '@/lib/intel/public-facts'

/**
 * Public provenance block: every fact with its source, last-checked date and
 * confidence. Pure presentational — the page fetches rows via
 * getEntityProfile() + toPublicFacts(). Renders nothing when we know nothing.
 */

const TONE: Record<PublicFactRow['verification'], string> = {
  verified: 'text-sv-success',
  high_confidence: 'text-sv-success',
  likely: 'text-sv-ink/60',
  unverified: 'text-sv-ink/60',
  outdated: 'text-sv-orange',
  conflicting: 'text-sv-orange',
}

export function SourcesSection({
  title,
  note,
  rows,
  altLabel,
  className = '',
  id,
}: {
  title: string
  note: string
  rows: PublicFactRow[]
  /** "Also reported:" — caller localizes. */
  altLabel: string
  className?: string
  id?: string
}) {
  if (rows.length === 0) return null
  return (
    <section id={id} className={className} aria-label={title}>
      <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">{title}</h2>
      <p className="mt-2 max-w-[70ch] text-[14px] font-medium leading-relaxed text-sv-ink/60">{note}</p>
      <ul className="mt-5 grid gap-3">
        {rows.map((r) => (
          <li
            key={r.fact}
            className="rounded-module border border-sv-ink/[0.06] bg-sv-surface px-5 py-4 shadow-card"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <p className="text-[12px] font-bold uppercase tracking-wide text-sv-ink/60">{r.label}</p>
              <p className={`text-[12px] font-bold ${TONE[r.verification]}`}>
                {r.verificationLabel} · {r.confidence}/100
              </p>
            </div>
            <p className="mt-1 text-[16px] font-extrabold text-sv-ink">{r.value}</p>
            {r.alternatives.length > 0 && (
              <p className="mt-1 text-[13px] font-medium text-sv-ink/60">
                {altLabel} {r.alternatives.join(' · ')}
              </p>
            )}
            <p className="mt-2 text-[13px] font-bold text-sv-ink/60">
              {r.sourceUrl ? (
                <a
                  href={r.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex min-h-11 items-center gap-1 text-sv-blue transition-colors hover:text-sv-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
                >
                  {r.sourceName}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </a>
              ) : (
                r.sourceName
              )}
              {r.sourceName && ' · '}
              <time dateTime={r.checkedAt}>{r.checkedAt}</time>
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
