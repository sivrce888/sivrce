'use client'

import { useId, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FORUM_CATEGORIES } from '@/data/forum'
import { cn } from '@/lib/utils'

const MIN_TITLE = 8
const MIN_BODY = 20

export function NewThreadForm({ className }: { className?: string }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const baseId = useId()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<string>(FORUM_CATEGORIES[0])
  const [district, setDistrict] = useState('თბილისი')
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
      <div className={cn('rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card', className)}>
        <p className="text-[14px] font-semibold text-sv-ink/60">თემის გასახსნელად შედით ანგარიშში.</p>
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`}
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full bg-sv-orange px-5 text-[14px] font-extrabold text-white shadow-glow-orange"
        >
          შესვლა
        </Link>
      </div>
    )
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (title.trim().length < MIN_TITLE) {
      setError(`სათაური მინ. ${MIN_TITLE} სიმბოლო`)
      return
    }
    if (body.trim().length < MIN_BODY) {
      setError(`ტექსტი მინ. ${MIN_BODY} სიმბოლო`)
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          category,
          district: district.trim() || 'თბილისი',
          ...(authorName.trim() ? { authorName: authorName.trim() } : {}),
        }),
      })
      const data = (await res.json().catch(() => null)) as { slug?: string; error?: string } | null
      if (!res.ok) {
        setError(
          data?.error === 'rate_limited'
            ? 'ძალიან ბევრი მოთხოვნა — ცოტა ხანში სცადეთ'
            : data?.error === 'author_name_required'
              ? 'სახელი სავალდებულოა'
              : 'ვერ გაიგზავნა — სცადეთ თავიდან',
        )
        return
      }
      if (data?.slug) {
        router.push(`/forum/${data.slug}`)
        router.refresh()
        return
      }
      setError('ვერ გაიგზავნა — სცადეთ თავიდან')
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
      className={cn('rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card md:p-6', className)}
    >
      <h2 className="text-[18px] font-black tracking-[-0.01em] text-sv-ink">ახალი თემა</h2>
      <p className="mt-1 text-[13px] font-semibold text-sv-ink/50">კითხვა ან გამოცდილება — უძრავი ქონების თემაზე.</p>

      <div className="mt-4">
        <label htmlFor={`${baseId}-title`} className="text-[13px] font-bold text-sv-ink/70">
          სათაური
        </label>
        <input
          id={`${baseId}-title`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="მაგ. რა ღირს რემონტი ვაკეში 2026-ში?"
          className={inputCls}
          required
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${baseId}-cat`} className="text-[13px] font-bold text-sv-ink/70">
            კატეგორია
          </label>
          <select
            id={`${baseId}-cat`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputCls}
          >
            {FORUM_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${baseId}-district`} className="text-[13px] font-bold text-sv-ink/70">
            უბანი / ქალაქი
          </label>
          <input
            id={`${baseId}-district`}
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            maxLength={80}
            placeholder="თბილისი"
            className={inputCls}
          />
        </div>
      </div>

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

      <div className="mt-3">
        <label htmlFor={`${baseId}-body`} className="text-[13px] font-bold text-sv-ink/70">
          ტექსტი
        </label>
        <textarea
          id={`${baseId}-body`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          maxLength={8000}
          placeholder="დაწერეთ კონტექსტი, ბიუჯეტი, უბანი — რაც სხვებს დაეხმარება პასუხში."
          className={cn(inputCls, 'h-auto resize-y py-3 leading-relaxed')}
          required
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-control bg-red-50 px-4 py-3 text-[13px] font-bold text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-full bg-sv-orange px-6 text-[15px] font-extrabold text-white shadow-glow-orange transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'იგზავნება…' : 'თემის გახსნა'}
      </button>
    </form>
  )
}
