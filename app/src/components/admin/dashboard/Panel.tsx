import Link from "next/link"
import type { ReactNode } from "react"

/** Card shell for dashboard sections, with an optional "View all" link. */
export function Panel({
  title,
  hint,
  href,
  children,
  className,
}: {
  title: string
  hint?: string
  href?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)] ${className ?? ""}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[14px] font-extrabold tracking-tight text-sv-ink">
            {title}
          </h2>
          {hint ? (
            <p className="mt-0.5 text-[11.5px] font-semibold text-sv-ink/60">{hint}</p>
          ) : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="text-[12px] font-bold text-sv-blue hover:underline"
          >
            View all
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
}
