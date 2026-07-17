'use client'

/**
 * CONTRACT — consumed by listing, project, developer and agent pages.
 * Do NOT change the exported signature — internals only.
 */

import { useId, useRef, useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, Send } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { formatPhone, PHONE_RE } from '@/lib/inquiries/phone'
import { cn } from '@/lib/utils'
import { leadStrings } from './i18n'

export interface LeadFormProps {
  targetType: 'listing' | 'project' | 'developer' | 'agent'
  targetId: string
  /** Displayed as the form heading context, e.g. agent or developer name. */
  recipientName?: string
  className?: string
}

/** Stable anchor so StickyLeadBar can scroll to / focus the on-page form. */
export const LEAD_FORM_ID = 'lead-form'

type Status = 'idle' | 'sending' | 'success'

export function LeadForm({ targetType, targetId, recipientName, className }: LeadFormProps) {
  const { lang } = useI18n()
  const s = leadStrings(lang)
  const uid = useId()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // honeypot — humans never see it
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  const nameBad = name.trim().length < 2
  const phoneBad = !PHONE_RE.test(phone)
  const messageBad = message.trim().length < 10 || message.length > 1000
  const showErr = (field: string, bad: boolean) => (touched[field] || submitAttempted) && bad

  const input =
    'w-full rounded-control border border-sv-ink/[0.08] bg-sv-surface px-4 py-3.5 text-[15px] font-semibold text-sv-ink placeholder:text-sv-ink/35 outline-none transition-all focus:border-sv-blue focus:ring-4 focus:ring-sv-blue/10'
  const label = 'mb-2 block text-[13px] font-extrabold text-sv-ink/70'
  const errClass = 'border-sv-orange ring-4 ring-sv-orange/10'

  const touch = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }))

  async function submit(e?: FormEvent) {
    e?.preventDefault()
    setSubmitAttempted(true)
    setSubmitError(null)
    if (nameBad || phoneBad || messageBad) {
      const first = nameBad ? nameRef : phoneBad ? phoneRef : messageRef
      first.current?.focus()
      return
    }
    setStatus('sending')
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, name: name.trim(), phone, message: message.trim(), website }),
      })
      if (!res.ok) {
        setSubmitError(res.status === 429 ? s.rateLimited : s.errorGeneric)
        setStatus('idle')
        return
      }
      setStatus('success')
      // Move focus to the confirmation so AT users don't lose context.
      requestAnimationFrame(() => successRef.current?.focus())
    } catch {
      setSubmitError(s.errorGeneric)
      setStatus('idle')
    }
  }

  function reset() {
    setName('')
    setPhone('')
    setMessage('')
    setWebsite('')
    setTouched({})
    setSubmitAttempted(false)
    setSubmitError(null)
    setStatus('idle')
  }

  return (
    <div
      id={LEAD_FORM_ID}
      className={cn(
        'scroll-mt-24 rounded-card border border-sv-ink/[0.06] bg-gradient-to-b from-sv-cloud to-sv-surface p-6 shadow-card md:p-7',
        className,
      )}
    >
      {status === 'success' ? (
        <div ref={successRef} tabIndex={-1} className="outline-none" aria-live="polite">
          <span className="grid h-12 w-12 place-items-center rounded-module bg-cat-cottages-chip text-cat-cottages">
            <CheckCircle2 className="h-6 w-6" aria-hidden />
          </span>
          <h3 className="mt-4 text-[20px] font-extrabold text-sv-ink">{s.successTitle}</h3>
          <p className="mt-2 text-[14px] font-semibold leading-relaxed text-sv-ink/60">{s.successBody(recipientName)}</p>
          <p className="mt-1 text-[14px] font-semibold leading-relaxed text-sv-ink/60">{s.successNote}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 flex min-h-[44px] items-center gap-2 rounded-full border border-sv-ink/[0.08] bg-sv-surface px-5 text-[14px] font-extrabold text-sv-ink transition-all hover:border-sv-blue/40 hover:text-sv-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            {s.newMessage}
          </button>
        </div>
      ) : (
        <>
          <h3 className="text-[20px] font-extrabold text-sv-ink">{s.formTitle}</h3>
          <p className="mt-1 text-[13px] font-semibold text-sv-ink/55">
            {recipientName ? s.formSubtitleTo(recipientName) : s.formSubtitle}
          </p>

          {submitError ? (
            <div
              role="alert"
              className="mt-4 flex items-center justify-between gap-3 rounded-module border border-sv-orange/25 bg-cat-houses-chip px-4 py-3"
            >
              <p className="flex items-center gap-2 text-[13px] font-bold text-sv-ink">
                <AlertCircle className="h-4 w-4 shrink-0 text-sv-orange" aria-hidden />
                {s.errorTitle} — {submitError}
              </p>
              <button
                type="button"
                onClick={() => void submit()}
                className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full bg-sv-orange px-4 text-[13px] font-extrabold text-white transition-all hover:shadow-glow-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-orange active:scale-[0.98]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                {s.retry}
              </button>
            </div>
          ) : null}

          <form onSubmit={(e) => void submit(e)} noValidate className="mt-5 space-y-4">
            {/* Honeypot — off-screen, skipped by AT and keyboard; bots fill it. */}
            <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
              <label htmlFor={`${uid}-website`}>Website</label>
              <input
                id={`${uid}-website`}
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor={`${uid}-name`} className={label}>
                {s.nameLabel}
              </label>
              <input
                ref={nameRef}
                id={`${uid}-name`}
                name="name"
                type="text"
                autoComplete="name"
                maxLength={80}
                placeholder={s.namePh}
                value={name}
                disabled={status === 'sending'}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => touch('name')}
                aria-invalid={showErr('name', nameBad) || undefined}
                aria-describedby={showErr('name', nameBad) ? `${uid}-name-err` : undefined}
                className={cn(input, showErr('name', nameBad) && errClass)}
              />
              {showErr('name', nameBad) ? (
                <p id={`${uid}-name-err`} role="alert" className="mt-1.5 text-[12px] font-bold text-sv-orange">
                  {s.nameErr}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor={`${uid}-phone`} className={label}>
                {s.phoneLabel}
              </label>
              <input
                ref={phoneRef}
                id={`${uid}-phone`}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={s.phonePh}
                value={phone}
                disabled={status === 'sending'}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                onBlur={() => touch('phone')}
                aria-invalid={showErr('phone', phoneBad) || undefined}
                aria-describedby={showErr('phone', phoneBad) ? `${uid}-phone-err` : undefined}
                className={cn(input, showErr('phone', phoneBad) && errClass)}
              />
              {showErr('phone', phoneBad) ? (
                <p id={`${uid}-phone-err`} role="alert" className="mt-1.5 text-[12px] font-bold text-sv-orange">
                  {s.phoneErr}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor={`${uid}-message`} className={label}>
                {s.messageLabel}
              </label>
              <textarea
                ref={messageRef}
                id={`${uid}-message`}
                name="message"
                rows={4}
                maxLength={1000}
                placeholder={s.messagePh}
                value={message}
                disabled={status === 'sending'}
                onChange={(e) => setMessage(e.target.value)}
                onBlur={() => touch('message')}
                aria-invalid={showErr('message', messageBad) || undefined}
                aria-describedby={`${uid}-message-count${showErr('message', messageBad) ? ` ${uid}-message-err` : ''}`}
                className={cn(input, 'resize-none', showErr('message', messageBad) && errClass)}
              />
              <div className="mt-1.5 flex items-center justify-between gap-3">
                {showErr('message', messageBad) ? (
                  <p id={`${uid}-message-err`} role="alert" className="text-[12px] font-bold text-sv-orange">
                    {s.messageErr}
                  </p>
                ) : (
                  <span />
                )}
                <span id={`${uid}-message-count`} className="text-[11px] font-bold text-sv-ink/35">
                  {message.length}/1000
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-sv-orange px-6 text-[15px] font-extrabold text-white shadow-glow-orange transition-all hover:shadow-glow-orange-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-orange active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              {status === 'sending' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
              {status === 'sending' ? s.sending : s.submit}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
