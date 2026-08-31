'use client'

/**
 * Click-to-reveal phone — BotID-gated. Full number never in SSR props.
 * Visual: brand pills only; labels truncate so 2/3-col grids never overflow.
 */
import { useState } from 'react'
import { Loader2, Phone, ShieldCheck, MessageCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { telHref, waHref } from '@/lib/inquiries/phone'

type Props = {
  listingId: string
  /** Already-masked preview from SSR (e.g. `555 *** ***`). */
  maskedHint?: string
  /** call = orange CTA (sidebar/mobile); button = full-width primary; inline = module. */
  variant?: 'button' | 'call' | 'inline'
  className?: string
}

const ease = 'duration-300 ease-[cubic-bezier(0.21,0.65,0.2,1)]'

export default function RevealPhone({
  listingId,
  maskedHint = '*** *** ***',
  variant = 'button',
  className = '',
}: Props) {
  const { t } = useI18n()
  const [phone, setPhone] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function reveal() {
    if (phone || loading) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/listings/${encodeURIComponent(listingId)}/phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      if (!res.ok) {
        setError(true)
        return
      }
      const data = (await res.json()) as { ok?: boolean; phone?: string }
      if (!data.ok || !data.phone) {
        setError(true)
        return
      }
      setPhone(data.phone)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const shell =
    variant === 'call'
      ? `flex h-12 min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-full bg-sv-orange px-3 text-[13px] font-extrabold text-white shadow-glow-orange transition-all ${ease} hover:-translate-y-0.5 hover:shadow-glow-orange-lg active:scale-[0.98]`
      : variant === 'inline'
        ? `flex h-11 w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-sv-blue to-sv-blue-deep px-4 text-[13.5px] font-extrabold text-white shadow-glow-blue-sm transition-all ${ease} hover:opacity-95 active:scale-[0.99]`
        : `flex h-12 w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-full bg-sv-orange px-4 text-[14px] font-extrabold text-white shadow-glow-orange transition-all ${ease} hover:-translate-y-0.5 hover:shadow-glow-orange-lg active:scale-[0.98]`

  if (phone) {
    if (variant === 'call') {
      return (
        <a
          href={telHref(phone)}
          className={`${shell} ${className}`}
          aria-label={t('detail.call')}
        >
          <Phone className="h-4 w-4 shrink-0" />
          <span className="truncate tabular-nums tracking-wide">{phone}</span>
        </a>
      )
    }
    return (
      <div className={`grid grid-cols-2 gap-2 ${className}`}>
        <a href={telHref(phone)} className={shell} aria-label={t('detail.call')}>
          <Phone className="h-4 w-4 shrink-0" />
          <span className="truncate tabular-nums tracking-wide">{phone}</span>
        </a>
        <a
          href={waHref(phone)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 min-w-0 items-center justify-center gap-2 overflow-hidden rounded-full border border-sv-blue/25 bg-sv-blue/[0.06] px-3 text-[13px] font-extrabold text-sv-blue transition-all duration-300 ease-[cubic-bezier(0.21,0.65,0.2,1)] hover:bg-sv-blue/10"
          aria-label={t('detail.whatsapp')}
        >
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('detail.whatsapp')}</span>
        </a>
      </div>
    )
  }

  // Unrevealed: short copy so half/third columns never break the card frame
  const label = loading
    ? t('detail.showPhoneLoading')
    : error
      ? t('detail.showPhoneDenied')
      : variant === 'call'
        ? t('detail.showPhone')
        : `${maskedHint}  ${t('detail.showPhone')}`

  return (
    <button
      type="button"
      onClick={reveal}
      disabled={loading}
      aria-label={t('detail.showPhone')}
      className={`${shell} disabled:opacity-70 ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : variant === 'inline' ? (
        <ShieldCheck className="h-4 w-4 shrink-0" />
      ) : (
        <Phone className="h-4 w-4 shrink-0" />
      )}
      <span className="min-w-0 truncate">{label}</span>
    </button>
  )
}
