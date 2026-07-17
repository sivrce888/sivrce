import Link from "next/link"
import type { ReactNode } from "react"

/** Card shell for dashboard sections, with an optional "View all" link. */
export function Panel({
  title,
  href,
  children,
  className,
}: {
  title: string
  href?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)] ${className ?? ""}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[14px] font-extrabold tracking-tight text-sv-ink">
          {title}
        </h2>
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
