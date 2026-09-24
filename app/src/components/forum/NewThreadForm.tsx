'use client'

import { useId, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FORUM_CATEGORIES } from '@/data/forum'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { panelLang } from '@/lib/i18n/core'

const MIN_TITLE = 8
const MIN_BODY = 20

const L = {
  ka: {
    signinPrompt: 'თემის გასახსნელად შედი ანგარიშში.',
    errTitleMin: (n: number) => `სათაური მინ. ${n} სიმბოლო`,
    errBodyMin: (n: number) => `ტექსტი მინ. ${n} სიმბოლო`,
    errRateLimited: 'ძალიან ბევრი მოთხოვნა — ცოტა ხანში სცადეთ',
    errNameRequired: 'სახელი სავალდებულოა',
    errSend: 'ვერ გაიგზავნა — სცადეთ თავიდან',
    heading: 'ახალი თემა',
    subheading: 'კითხვა ან გამოცდილება — უძრავი ქონების თემაზე.',
    titleLabel: 'სათაური',
    titlePh: 'მაგ. რა ღირს რემონტი ვაკეში 2026-ში?',
    catLabel: 'კატეგორია',
    districtLabel: 'უბანი / ქალაქი',
    districtPh: 'თბილისი',
    nameLabel: 'სახელი',
    bodyLabel: 'ტექსტი',
    bodyPh: 'დაწერეთ კონტექსტი, ბიუჯეტი, უბანი — რაც სხვებს დაეხმარება პასუხში.',
    sending: 'იგზავნება…',
    submit: 'თემის გახსნა',
  },
  en: {
    signinPrompt: 'Sign in to start a thread.',
    errTitleMin: (n: number) => `Title min. ${n} characters`,
    errBodyMin: (n: number) => `Text min. ${n} characters`,
    errRateLimited: 'Too many requests — try again soon',
    errNameRequired: 'Name is required',
    errSend: 'Couldn’t send — try again',
    heading: 'New thread',
    subheading: 'A question or an experience — about real estate.',
    titleLabel: 'Title',
    titlePh: 'e.g. What does a renovation in Vake cost in 2026?',
    catLabel: 'Category',
    districtLabel: 'District / City',
    districtPh: 'Tbilisi',
    nameLabel: 'Name',
    bodyLabel: 'Text',
    bodyPh: 'Add context, budget, district — whatever helps others answer.',
    sending: 'Sending…',
    submit: 'Start thread',
  },
  de: {
    signinPrompt: 'Melden Sie sich an, um ein Thema zu starten.',
    errTitleMin: (n: number) => `Titel min. ${n} Zeichen`,
    errBodyMin: (n: number) => `Text min. ${n} Zeichen`,
    errRateLimited: 'Zu viele Anfragen — bitte später erneut versuchen',
    errNameRequired: 'Name ist erforderlich',
    errSend: 'Senden fehlgeschlagen — bitte erneut versuchen',
    heading: 'Neues Thema',
    subheading: 'Eine Frage oder Erfahrung — rund um Immobilien.',
    titleLabel: 'Titel',
    titlePh: 'z. B. Was kostet eine Renovierung in Vake 2026?',
    catLabel: 'Kategorie',
    districtLabel: 'Viertel / Stadt',
    districtPh: 'Tbilisi',
    nameLabel: 'Name',
    bodyLabel: 'Text',
    bodyPh: 'Nennen Sie Kontext, Budget und Viertel — alles, was anderen bei der Antwort hilft.',
    sending: 'Wird gesendet…',
    submit: 'Thema starten',
  },
} as const

export function NewThreadForm({ className }: { className?: string }) {
  const { lang, t } = useI18n()
  const T = L[panelLang(lang)]
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
        <p className="text-[14px] font-semibold text-sv-ink/60">{T.signinPrompt}</p>
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`}
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full bg-sv-orange px-5 text-[14px] font-extrabold text-sv-ink shadow-glow-orange"
        >
          {t('nav.login')}
        </Link>
      </div>
    )
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (title.trim().length < MIN_TITLE) {
      setError(T.errTitleMin(MIN_TITLE))
      return
    }
    if (body.trim().length < MIN_BODY) {
      setError(T.errBodyMin(MIN_BODY))
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
            ? T.errRateLimited
            : data?.error === 'author_name_required'
              ? T.errNameRequired
              : T.errSend,
        )
        return
      }
      if (data?.slug) {
        router.push(`/forum/${data.slug}`)
        router.refresh()
        return
      }
      setError(T.errSend)
    } catch {
      setError(T.errSend)
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'mt-1.5 h-11 w-full rounded-control border border-sv-ink/10 bg-sv-surface px-4 text-[15px] font-medium text-sv-ink placeholder:text-sv-ink/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue'

  return (
    <form
      onSubmit={submit}
      noValidate
      className={cn('rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card md:p-6', className)}
    >
      <h2 className="text-[18px] font-black tracking-[-0.01em] text-sv-ink">{T.heading}</h2>
      <p className="mt-1 text-[13px] font-semibold text-sv-ink/60">{T.subheading}</p>

      <div className="mt-4">
        <label htmlFor={`${baseId}-title`} className="text-[13px] font-bold text-sv-ink/70">
          {T.titleLabel}
        </label>
        <input
          id={`${baseId}-title`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder={T.titlePh}
          className={inputCls}
          required
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${baseId}-cat`} className="text-[13px] font-bold text-sv-ink/70">
            {T.catLabel}
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
            {T.districtLabel}
          </label>
          <input
            id={`${baseId}-district`}
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            maxLength={80}
            placeholder={T.districtPh}
            className={inputCls}
          />
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor={`${baseId}-name`} className="text-[13px] font-bold text-sv-ink/70">
          {T.nameLabel}
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
          {T.bodyLabel}
        </label>
        <textarea
          id={`${baseId}-body`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          maxLength={8000}
          placeholder={T.bodyPh}
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
        className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-full bg-sv-orange px-6 text-[15px] font-extrabold text-sv-ink shadow-glow-orange transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? T.sending : T.submit}
      </button>
    </form>
  )
}
