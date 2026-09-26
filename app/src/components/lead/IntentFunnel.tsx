'use client'

/**
 * Demand funnel — "I want to buy / rent / stay / sell" in a few taps.
 * Chip-guided (typing only name+phone), posts to /api/inquiries as a general
 * lead so Sivrce owns the demand even with no listing in context. Rendered
 * inside the chat widget (view "intent"); guests included.
 */

import { useId, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, Send } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useI18n } from '@/lib/i18n/context'
import { formatPhone, PHONE_RE, PHONE_RE_DE } from '@/lib/inquiries/phone'
import { usePostHog } from '@/lib/posthog'
import { cn } from '@/lib/utils'
import { leadStrings } from './i18n'
import { demandMessage, funnelStrings, type DemandIntent } from './i18n'

type Status = 'idle' | 'sending' | 'success'

/** Inquiry.deal vocabulary for a demand lead; sell is supply-side. */
const DEAL_OF: Record<DemandIntent, string> = {
  buy: 'buy',
  rent: 'rent',
  daily: 'daily',
  sell: 'sell',
}
/** targetId bucket on the general lead row. */
const BUCKET_OF: Record<DemandIntent, string> = {
  buy: 'demand-buy',
  rent: 'demand-rent',
  daily: 'demand-daily',
  sell: 'demand-sell',
}

const chipBase =
  'min-h-[40px] rounded-full border px-4 text-[13.5px] font-extrabold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue active:scale-[0.98]'
const chipOff =
  'border-sv-ink/[0.08] bg-sv-surface text-sv-ink hover:border-sv-blue/40 hover:text-sv-blue'
const chipOn = 'border-sv-blue bg-sv-blue text-white'

function Chips({
  label,
  options,
  value,
  onPick,
}: {
  label: string
  options: readonly string[]
  value: string | null
  onPick: (v: string | null) => void
}) {
  return (
    <div role="group" aria-label={label}>
      <p className="mb-2 text-[13px] font-extrabold text-sv-ink/70">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={value === o}
            onClick={() => onPick(value === o ? null : o)}
            className={cn(chipBase, value === o ? chipOn : chipOff)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

export function IntentFunnel() {
  const { lang } = useI18n()
  const { capture } = usePostHog()
  const s = funnelStrings(lang)
  const l = leadStrings(lang)
  const { data: session } = useSession()
  const uid = useId()

  const [intent, setIntent] = useState<DemandIntent | null>(null)
  const [budget, setBudget] = useState<string | null>(null)
  const [rooms, setRooms] = useState<string | null>(null)
  const [type, setType] = useState<string | null>(null)
  const [when, setWhen] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [nameDirty, setNameDirty] = useState(false)
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('') // honeypot — humans never see it
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Signed-in visitors start one tap closer to done — shown until they type.
  const shownName = nameDirty ? name : session?.user?.name || name

  const nameBad = shownName.trim().length < 2
  const phoneBad = !PHONE_RE.test(phone) && !PHONE_RE_DE.test(phone)
  const showErr = (field: string, bad: boolean) => (touched[field] || submitAttempted) && bad

  const showBudget =
    intent === 'buy' ? s.budgetBuy : intent === 'rent' ? s.budgetRent : intent === 'daily' ? s.budgetDaily : null

  function pickIntent(next: DemandIntent) {
    setIntent((prev) => (prev === next ? prev : next))
    // Budget bands differ per intent — a stale pick would lie in the lead.
    setBudget(null)
    if (next !== 'buy' && next !== 'rent') setRooms(null)
    if (next !== 'sell') setType(null)
  }

  async function submit() {
    if (!intent || nameBad || phoneBad) {
      setSubmitAttempted(true)
      return
    }
    setSubmitError(null)
    setStatus('sending')
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'general',
          targetId: BUCKET_OF[intent],
          deal: DEAL_OF[intent],
          name: shownName.trim(),
          phone,
          message: demandMessage(s, intent, { budget, rooms, type, when }),
          website,
        }),
      })
      if (!res.ok) {
        setSubmitError(res.status === 429 ? l.rateLimited : l.errorGeneric)
        setStatus('idle')
        return
      }
      setStatus('success')
      capture('lead_submitted', { target_type: 'demand', target_id: BUCKET_OF[intent] })
    } catch {
      setSubmitError(l.errorGeneric)
      setStatus('idle')
    }
  }

  function reset() {
    setIntent(null)
    setBudget(null)
    setRooms(null)
    setType(null)
    setWhen(null)
    setName('')
    setPhone('')
    setWebsite('')
    setTouched({})
    setSubmitAttempted(false)
    setSubmitError(null)
    setStatus('idle')
  }

  const input =
    'w-full rounded-control border border-sv-ink/[0.08] bg-sv-surface px-4 py-3 text-[15px] font-semibold text-sv-ink placeholder:text-sv-ink/35 outline-none transition-all focus:border-sv-blue focus:ring-4 focus:ring-sv-blue/10'
  const errClass = 'border-sv-orange ring-4 ring-sv-orange/10'

  if (status === 'success') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 pb-6 text-center" aria-live="polite">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-sv-blue/10 text-sv-blue-deep">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </span>
        <h3 className="text-[15px] font-black text-sv-ink">{l.successTitle}</h3>
        <p className="text-[13px] font-medium leading-relaxed text-sv-ink/60">{s.successNote}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-2 flex min-h-[44px] items-center gap-2 rounded-full border border-sv-ink/[0.08] bg-sv-surface px-5 text-[14px] font-extrabold text-sv-ink transition-all hover:border-sv-blue/40 hover:text-sv-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          {l.newMessage}
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
      <p className="text-[13px] font-semibold text-sv-ink/60">{s.subtitle}</p>

      {submitError ? (
        <div
          role="alert"
          className="mt-3 flex items-center justify-between gap-3 rounded-module border border-sv-orange/25 bg-cat-houses-chip px-4 py-3"
        >
          <p className="flex items-center gap-2 text-[13px] font-bold text-sv-ink">
            <AlertCircle className="h-4 w-4 shrink-0 text-sv-orange" aria-hidden />
            {l.errorTitle} — {submitError}
          </p>
          <button
            type="button"
            onClick={() => void submit()}
            className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full bg-sv-orange px-4 text-[13px] font-extrabold text-sv-ink transition-all hover:shadow-glow-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-orange active:scale-[0.98]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            {l.retry}
          </button>
        </div>
      ) : null}

      <div role="group" aria-label={s.title} className="mt-3 grid grid-cols-2 gap-2">
        {(Object.keys(s.intents) as DemandIntent[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={intent === key}
            onClick={() => pickIntent(key)}
            className={cn(
              chipBase,
              'min-h-[48px] text-[14.5px]',
              intent === key ? chipOn : chipOff,
            )}
          >
            {s.intents[key]}
          </button>
        ))}
      </div>

      {intent ? (
        <div className="mt-5 space-y-5">
          {showBudget ? (
            <Chips label={s.budgetQ} options={showBudget} value={budget} onPick={setBudget} />
          ) : null}
          {intent === 'buy' || intent === 'rent' ? (
            <Chips label={s.roomsQ} options={s.roomsChips} value={rooms} onPick={setRooms} />
          ) : null}
          {intent === 'sell' ? (
            <Chips label={s.typeQ} options={s.typeChips} value={type} onPick={setType} />
          ) : null}
          <Chips label={s.whenQ} options={s.whenChips} value={when} onPick={setWhen} />

          <div role="group" aria-label={s.contactQ} className="space-y-3 pt-1">
            <p className="text-[13px] font-extrabold text-sv-ink/70">{s.contactQ}</p>
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
              <label htmlFor={`${uid}-name`} className="sr-only">
                {l.nameLabel}
              </label>
              <input
                id={`${uid}-name`}
                name="name"
                type="text"
                autoComplete="name"
                maxLength={80}
                placeholder={l.namePh}
                value={shownName}
                disabled={status === 'sending'}
                onChange={(e) => {
                  setName(e.target.value)
                  setNameDirty(true)
                }}
                onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                aria-invalid={showErr('name', nameBad) || undefined}
                className={cn(input, showErr('name', nameBad) && errClass)}
              />
              {showErr('name', nameBad) ? (
                <p role="alert" className="mt-1.5 text-[12px] font-bold text-sv-orange">
                  {l.nameErr}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor={`${uid}-phone`} className="sr-only">
                {l.phoneLabel}
              </label>
              <input
                id={`${uid}-phone`}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={l.phonePh}
                value={phone}
                disabled={status === 'sending'}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                aria-invalid={showErr('phone', phoneBad) || undefined}
                className={cn(input, showErr('phone', phoneBad) && errClass)}
              />
              {showErr('phone', phoneBad) ? (
                <p role="alert" className="mt-1.5 text-[12px] font-bold text-sv-orange">
                  {l.phoneErr}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={status === 'sending'}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-sv-orange px-6 text-[15px] font-extrabold text-sv-ink shadow-glow-orange transition-all hover:shadow-glow-orange-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-orange active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              {status === 'sending' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
              {status === 'sending' ? l.sending : l.submit}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
