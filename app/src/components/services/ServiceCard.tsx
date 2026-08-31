import LocalizedLink from '@/components/LocalizedLink'
import { BadgeCheck, MapPin, Star } from 'lucide-react'
import { formatGel, pickLocText, serviceCategory, type ServicePublic } from '@/lib/services'

export function ServiceCard({ p, lang }: { p: ServicePublic; lang: string }) {
  const cat = serviceCategory(p.category)
  const brand = cat?.brand
  const name = pickLocText(p.name, lang)
  const price =
    p.priceRangeMin != null
      ? `${formatGel(p.priceRangeMin)}${p.priceRangeMax != null ? ` – ${formatGel(p.priceRangeMax)}` : '+'}`
      : null

  return (
    <LocalizedLink
      href={`/services/${p.category}/${p.slug}`}
      aria-label={name}
      className="group block rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 truncate text-[17px] font-black text-sv-ink">
            {name}
            {p.verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-sv-success" aria-label="ვერიფიცირებული" />
            )}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-[13px] font-bold text-sv-ink/55">
            <MapPin className="h-3.5 w-3.5 text-sv-ink/35" aria-hidden />
            {p.city}
            {p.district ? ` · ${p.district}` : ''}
            {cat ? ` · ${pickLocText(cat.name, lang)}` : ''}
          </p>
        </div>
        {p.reviewCount > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-[14px] font-black text-sv-ink">
            <Star className="h-3.5 w-3.5 fill-sv-orange text-sv-orange" aria-hidden />
            {p.rating.toFixed(1)}
          </span>
        )}
      </div>
      <p className="mt-3 line-clamp-2 text-[13px] font-medium leading-relaxed text-sv-ink/60">
        {pickLocText(p.description, lang)}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-sv-ink/[0.06] pt-4">
        <span className="text-[13px] font-bold text-sv-ink/55">
          {p.yearsActive > 0 ? `${p.yearsActive} წელი` : 'ახალი'}
        </span>
        {price && (
          <span className="text-[13px] font-extrabold" style={{ color: brand?.hue }}>
            {price}
          </span>
        )}
      </div>
    </LocalizedLink>
  )
}
