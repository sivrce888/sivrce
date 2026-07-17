import Link from "next/link"

interface EmptyStateProps {
  title: string
  body?: string
  actionHref?: string
  actionLabel?: string
}

/** Friendly zero-data state with optional CTA. Server component. */
export default function EmptyState({ title, body, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-sv-ink/15 bg-white/60 px-6 py-14 text-center">
      <p className="text-[16px] font-extrabold text-sv-ink/80">{title}</p>
      {body ? (
        <p className="mx-auto mt-2 max-w-md text-[13px] font-medium text-sv-ink/50">{body}</p>
      ) : null}
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-block rounded-full bg-sv-blue px-6 py-2.5 text-[13px] font-bold text-white transition hover:bg-sv-blue-deep"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}
