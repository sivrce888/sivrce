'use client'

import { useId, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'

const MIN_BODY = 10

export function ReplyForm({
  slug,
  parentId,
  onCancel,
  className,
  compact,
}: {
  slug: string
  parentId?: string | null
  onCancel?: () => void
  className?: string
  compact?: boolean
}) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const baseId = useId()
  const [body, setBody] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const sessionName = session?.user?.name ?? ''
  const [prefilledFor, setPrefilledFor] = useState('')
  if (sessionName && prefilledFor !== sessionName) {
    setPrefilledFor(sessionName)
    setAuthorName((prev) => (prev ? prev : sessionName))
  }

  if (status === 'unauthenticated') {
    return (
      <p
        className={cn(
          'rounded-control border border-sv-ink/[0.06] bg-sv-cloud px-4 py-3 text-[13px] font-semibold text-sv-ink/55',
          className,
        )}
      >
        პასუხის დასაწერად{' '}
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`}
          className="font-extrabold text-sv-blue hover:underline"
        >
          შეხვიდეთ ანგარიშში
        </Link>
        .
      </p>
    )
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (body.trim().length < MIN_BODY) {
      setError(`მინიმუმ ${MIN_BODY} სიმბოლო`)
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/forum/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          body: body.trim(),
          ...(parentId ? { parentId } : {}),
          ...(authorName.trim() ? { authorName: authorName.trim() } : {}),
        }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        setError(
          data?.error === 'rate_limited'
            ? 'ძალიან ბევრი მოთხოვნა — ცოტა ხანში სცადეთ'
            : data?.error === 'nest_too_deep'
              ? 'მხოლოდ ერთი დონის პასუხია შესაძლებელი'
              : data?.error === 'thread_not_found' || data?.error === 'parent_not_found'
                ? 'თემა ვერ მოიძებნა'
                : 'ვერ გაიგზავნა — სცადეთ თავიდან',
        )
        return
      }
      setBody('')
      onCancel?.()
      router.refresh()
    } catch {
      setError('ვერ გაიგზავნა — სცადეთ თავიდან')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'mt-1.5 h-11 w-full rounded-control border border-sv-ink/10 bg-sv-surface px-4 text-[15px] font-medium text-sv-ink placeholder:text-sv-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue'

  return (
    <form
      onSubmit={submit}
      noValidate
      className={cn(
        compact
          ? 'mt-3 rounded-control border border-sv-ink/[0.06] bg-sv-cloud/60 p-4'
          : 'mt-6 rounded-module border border-sv-ink/[0.06] bg-sv-surface p-5',
        className,
      )}
    >
      <h3 className="text-[15px] font-black text-sv-ink">
        {parentId ? 'პასუხი კომენტარზე' : 'თქვენი პასუხი'}
      </h3>
      {!compact && (
        <div className="mt-3">
          <label htmlFor={`${baseId}-name`} className="text-[13px] font-bold text-sv-ink/70">
            სახელი
          </label>
          <input
            id={`${baseId}-name`}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={80}
            autoComplete="name"
            className={inputCls}
          />
        </div>
      )}
      <div className={compact ? 'mt-2' : 'mt-3'}>
        <label htmlFor={`${baseId}-body`} className="text-[13px] font-bold text-sv-ink/70">
          პასუხი
        </label>
        <textarea
          id={`${baseId}-body`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={compact ? 3 : 4}
          maxLength={4000}
          placeholder="გააზიარეთ გამოცდილება ან რჩევა…"
          className={cn(inputCls, 'h-auto resize-y py-3 leading-relaxed')}
          required
        />
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-control bg-red-50 px-4 py-3 text-[13px] font-bold text-red-600">
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex min-h-[44px] items-center justify-center rounded-full bg-sv-orange px-5 text-[14px] font-extrabold text-white shadow-glow-orange transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {submitting ? 'იგზავნება…' : 'გაგზავნა'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-full px-4 text-[13px] font-bold text-sv-ink/55 hover:text-sv-ink"
          >
            გაუქმება
          </button>
        )}
      </div>
    </form>
  )
}
