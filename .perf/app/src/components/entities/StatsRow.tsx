/** Pure presentational stats row — values pre-localized by the caller. */
export interface StatItem {
  label: string
  value: string
}

export function StatsRow({ items, className = '' }: { items: StatItem[]; className?: string }) {
  return (
    <dl className={`flex flex-wrap gap-x-8 gap-y-4 ${className}`}>
      {items.map((s) => (
        <div key={s.label}>
          <dd className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            {s.value}
          </dd>
          <dt className="mt-0.5 text-[12px] font-bold uppercase tracking-wide text-sv-ink/50">
            {s.label}
          </dt>
        </div>
      ))}
    </dl>
  )
}
