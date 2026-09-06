export interface AnchorItem {
  id: string
  label: string
}

/**
 * Sticky in-page chip nav under the fixed navbar. Pure anchor links —
 * zero client JS; sections own their scroll-mt offset.
 */
export function AnchorNav({ items, label }: { items: AnchorItem[]; label: string }) {
  const shown = items.filter((i) => i.label)
  if (shown.length < 2) return null
  return (
    <nav
      aria-label={label}
      className="sticky top-[clamp(3.75rem,3.4rem+1vw,4.25rem)] z-30 border-b border-sv-ink/[0.06] bg-sv-cloud/85 backdrop-blur"
    >
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <ul className="flex items-center gap-2 overflow-x-auto py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {shown.map((i) => (
            <li key={i.id} className="shrink-0">
              <a
                href={`#${i.id}`}
                className="inline-flex min-h-8 items-center rounded-full border border-sv-ink/[0.08] bg-sv-surface px-3.5 py-1 text-[13px] font-bold text-sv-ink/65 transition-colors duration-200 hover:border-sv-blue/40 hover:text-sv-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
              >
                {i.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
