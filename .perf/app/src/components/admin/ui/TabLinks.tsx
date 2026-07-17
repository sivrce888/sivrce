import Link from "next/link"

/** Underline-style tab row for section sub-navigation (server-rendered links). */
export function TabLinks({
  items,
}: {
  items: readonly { href: string; label: string; active: boolean; count?: number }[]
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-1 border-b border-sv-ink/8">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={`-mb-px flex items-center gap-1.5 border-b-2 px-3.5 pt-1 pb-2.5 text-[13.5px] font-bold whitespace-nowrap transition-colors ${
            t.active
              ? "border-sv-blue text-sv-ink"
              : "border-transparent text-sv-ink/45 hover:text-sv-ink/75"
          }`}
        >
          {t.label}
          {typeof t.count === "number" ? (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] leading-none font-extrabold ${
                t.active ? "bg-sv-blue/10 text-sv-blue" : "bg-sv-ink/6 text-sv-ink/45"
              }`}
            >
              {t.count}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  )
}
