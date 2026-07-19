import { ChevronRight } from 'lucide-react'
import type { FaqItem } from '@/lib/directory-seo'

/**
 * Visible FAQ block — SeoLanding's details/summary pattern extracted so every
 * directory page renders the same Q&A it ships in FAQPage JSON-LD.
 */
export function FaqSection({
  title,
  items,
  className = '',
}: {
  title: string
  items: FaqItem[]
  className?: string
}) {
  return (
    <section className={className} aria-label={title}>
      <h2 className="mb-5 text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
        {title}
      </h2>
      <div className="grid gap-3">
        {items.map((f) => (
          <details
            key={f.q}
            className="group rounded-module border border-sv-ink/[0.06] bg-sv-surface px-5 py-4 shadow-card open:shadow-card-hover"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-extrabold text-sv-ink [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronRight
                className="h-4 w-4 shrink-0 text-sv-blue transition-transform duration-300 group-open:rotate-90"
                aria-hidden
              />
            </summary>
            <p className="mt-3 text-[14px] font-medium leading-relaxed text-sv-ink/60">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
