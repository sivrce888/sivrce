'use client'

/**
 * EnergyRating — EU Energy Performance Certificate (EPC) badge.
 * Shows A+ through G rating with standard EU color coding.
 * ponytail: pure CSS, zero dependencies, works server-side.
 */

export type EnergyClass = 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

const ENERGY_COLORS: Record<EnergyClass, string> = {
  'A+': '#007a33',
  A: '#3aa44a',
  B: '#8cc63f',
  C: '#ffd700',
  D: '#f58220',
  E: '#e8421e',
  F: '#c01414',
  G: '#8b0000',
}

const ENERGY_LABELS: Record<EnergyClass, { en: string; de: string; ka: string }> = {
  'A+': { en: 'A+ — Exceptional', de: 'A+ — Ausgezeichnet', ka: 'A+ — განსაკუთრებული' },
  A: { en: 'A — Very efficient', de: 'A — Sehr effizient', ka: 'A — ძალიან ეფექტური' },
  B: { en: 'B — Efficient', de: 'B — Effizient', ka: 'B — ეფექტური' },
  C: { en: 'C — Average', de: 'C — Durchschnittlich', ka: 'C — საშუალო' },
  D: { en: 'D — Below average', de: 'D — Unterdurchschnittlich', ka: 'D — საშუალოზე დაბალი' },
  E: { en: 'E — Inefficient', de: 'E — Ineffizient', ka: 'E — არაეფექტური' },
  F: { en: 'F — Very inefficient', de: 'F — Sehr ineffizient', ka: 'F — ძალიან არაეფექტური' },
  G: { en: 'G — Worst', de: 'G — Am schlechtesten', ka: 'G — ყველაზე ცუდი' },
}

interface EnergyRatingProps {
  rating: EnergyClass
  /** Optional kWh/m²/year value */
  consumption?: number
  lang?: 'en' | 'de' | 'ka'
  className?: string
}

export function EnergyRating({ rating, consumption, lang = 'en', className = '' }: EnergyRatingProps) {
  const color = ENERGY_COLORS[rating]
  const label = ENERGY_LABELS[rating][lang]

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="flex" role="img" aria-label={`Energy rating ${rating}`}>
        {(Object.keys(ENERGY_COLORS) as EnergyClass[]).map((cls) => (
          <div
            key={cls}
            className="relative flex items-center justify-center text-[10px] font-black text-white transition-all"
            style={{
              width: cls.length > 1 ? 28 : 20,
              height: 20,
              backgroundColor: ENERGY_COLORS[cls],
              opacity: cls === rating ? 1 : 0.25,
              transform: cls === rating ? 'scaleY(1.3)' : 'scaleY(1)',
              borderRadius: cls === rating ? 3 : 0,
              zIndex: cls === rating ? 1 : 0,
            }}
          >
            {cls}
          </div>
        ))}
      </div>
      <div className="flex flex-col">
        <span className="text-[12px] font-black" style={{ color }}>
          {rating}
        </span>
        {consumption != null && (
          <span className="text-[10px] font-bold text-sv-ink/40">{consumption} kWh/m²/yr</span>
        )}
      </div>
    </div>
  )
}

/** Compact single-badge variant for cards. */
export function EnergyBadge({ rating, className = '' }: { rating: EnergyClass; className?: string }) {
  const color = ENERGY_COLORS[rating]
  return (
    <span
      className={`inline-flex h-5 items-center justify-center rounded-sm px-1.5 text-[10px] font-black text-white ${className}`}
      style={{ backgroundColor: color }}
      title={`EPC Rating: ${rating}`}
    >
      {rating}
    </span>
  )
}
