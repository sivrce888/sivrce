import type { LucideIcon } from "lucide-react"
import LocalizedLink from "@/components/LocalizedLink"

interface EmptyStateProps {
  title: string
  body?: string
  actionHref?: string
  actionLabel?: string
  icon?: LucideIcon
}

/** Zero-data / recovery. Same rhythm as search empty + errors. */
export default function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
  icon: Icon,
}: EmptyStateProps) {
  return (
    <div className="sv-empty">
      {Icon ? (
        <span className="grid h-16 w-16 place-items-center rounded-module bg-sv-blue/10 text-sv-blue">
          <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
        </span>
      ) : null}
      <p className={`text-[16px] font-extrabold text-sv-ink ${Icon ? "mt-5" : ""}`}>{title}</p>
      {body ? (
        <p className="sv-lead mx-auto mt-2 max-w-md text-sv-ink/60">{body}</p>
      ) : null}
      {actionHref && actionLabel ? (
        <LocalizedLink href={actionHref} className="sv-cta-blue mt-6">
          {actionLabel}
        </LocalizedLink>
      ) : null}
    </div>
  )
}
