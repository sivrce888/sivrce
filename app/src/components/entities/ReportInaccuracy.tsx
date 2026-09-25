'use client'

import { useActionState } from 'react'
import { Flag } from 'lucide-react'
import { reportInaccuracy, type ReportState } from '@/lib/inaccuracy-report'
import type { ProjectPageCopy, ReportField } from '@/lib/project-page-copy'

interface Props {
  kind: 'project' | 'developer'
  slug: string
  /** Strings come pre-localized from the server page — no copy table in the bundle. */
  t: ProjectPageCopy['report']
  className?: string
}

const FIELD_CLASS =
  'mt-1 w-full rounded-control border border-sv-ink/[0.12] bg-sv-surface px-3 py-2.5 text-[14px] font-semibold text-sv-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue'

export function ReportInaccuracy({ kind, slug, t, className = '' }: Props) {
  const [state, action, pending] = useActionState<ReportState, FormData>(reportInaccuracy, 'idle')
  return (
    <details id="report" className={`group scroll-mt-[7.5rem] ${className}`}>
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-[13px] font-bold text-sv-ink/60 transition-colors hover:text-sv-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue [&::-webkit-details-marker]:hidden">
        <Flag className="h-4 w-4" aria-hidden />
        {t.summary}
      </summary>
      {state === 'ok' ? (
        <p role="status" className="mt-3 max-w-xl rounded-module bg-sv-blue/[0.06] px-4 py-3 text-[14px] font-bold text-sv-blue-deep">
          {t.thanks}
        </p>
      ) : (
        <form action={action} className="mt-3 grid max-w-xl gap-3 rounded-module border border-sv-ink/[0.06] bg-sv-surface p-4 shadow-card">
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="slug" value={slug} />
          {/* honeypot — off-screen, skipped by keyboard and screen readers */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-px w-px opacity-0" />
          <label className="text-[13px] font-bold text-sv-ink/70">
            {t.field}
            <select name="field" required defaultValue="price" className={FIELD_CLASS}>
              {(Object.keys(t.fields) as ReportField[]).map((f) => (
                <option key={f} value={f}>
                  {t.fields[f]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[13px] font-bold text-sv-ink/70">
            {t.details}
            <textarea name="details" required minLength={5} maxLength={1000} rows={3} className={FIELD_CLASS} />
          </label>
          <label className="text-[13px] font-bold text-sv-ink/70">
            {t.email}
            <input type="email" name="email" maxLength={240} autoComplete="email" className={FIELD_CLASS} />
          </label>
          {(state === 'error' || state === 'limited') && (
            <p role="alert" className="rounded-module border border-sv-orange/25 bg-cat-houses-chip px-4 py-3 text-[13px] font-bold text-sv-ink">
              {state === 'limited' ? t.limited : t.error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-sv-ink px-5 text-[14px] font-extrabold text-white transition-opacity disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
          >
            {t.submit}
          </button>
        </form>
      )}
    </details>
  )
}
