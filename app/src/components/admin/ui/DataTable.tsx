import type { ReactNode } from "react"

export const th =
  "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-sv-ink/45 whitespace-nowrap"
export const td = "px-4 py-3.5 text-[13.5px] text-sv-ink/80 align-middle"

/** Card-wrapped, horizontally scrollable table. */
export function DataTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white shadow-[var(--shadow-card)]">
      <table className="w-full min-w-[720px] border-collapse">{children}</table>
    </div>
  )
}

export function THeadRow({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-sv-ink/8 bg-sv-cloud/60">{children}</tr>
    </thead>
  )
}

export function TRow({
  children,
  href,
}: {
  children: ReactNode
  href?: string
}) {
  // Rows are plain <tr>; when href is given the row gets a hover affordance —
  // wrap the primary cell content in a Link inside the row (keeps a11y sane).
  return (
    <tr
      className={`border-b border-sv-ink/5 last:border-0 ${href ? "transition-colors hover:bg-sv-cloud/50" : ""}`}
    >
      {children}
    </tr>
  )
}
