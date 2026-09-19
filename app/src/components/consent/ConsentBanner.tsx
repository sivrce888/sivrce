'use client'

import Link from 'next/link'
import { setConsent, useConsent } from '@/lib/consent'
import { useI18n, localizedHref } from '@/lib/i18n/context'
import { useConsentStrings } from './i18n'

/**
 * Consent prompt — shown only while the visitor is undecided.
 *
 * No dark patterns: Allow and Decline are the same size, same row, same
 * weight; there is no pre-selection and no "reject" buried behind a settings
 * screen. Fixed-position, mounted after hydration → zero CLS, zero SSR weight.
 */
export default function ConsentBanner() {
  const consent = useConsent()
  const { lang } = useI18n()
  const t = useConsentStrings()

  if (consent !== null) return null

  return (
    <div
      role="dialog"
      aria-label={t('title')}
      className="sv-hero-in fixed bottom-[calc(1rem+var(--sv-dock))] left-1/2 z-[95] w-[min(34rem,calc(100vw-1.5rem))] -translate-x-1/2 motion-reduce:animate-none"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="rounded-card border border-sv-ink/8 bg-sv-surface/95 p-4 shadow-card backdrop-blur-xl dark:border-white/10 dark:bg-sv-navy/95">
        <p className="text-[15px] font-bold text-sv-ink dark:text-white">{t('title')}</p>
        <p className="mt-1 text-[13px] leading-snug text-sv-ink/65 dark:text-white/65">{t('body')}</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setConsent('granted')}
            className="flex-1 rounded-control bg-sv-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
          >
            {t('accept')}
          </button>
          <button
            type="button"
            onClick={() => setConsent('denied')}
            className="flex-1 rounded-control border border-sv-ink/12 px-4 py-2 text-[13px] font-semibold text-sv-ink transition-colors hover:bg-sv-cloud focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
          >
            {t('decline')}
          </button>
          <Link
            href={localizedHref(lang === 'de' ? '/legal/datenschutz' : '/privacy', lang)}
            className="shrink-0 rounded-sm px-1 text-[12px] font-semibold text-sv-ink/60 underline-offset-2 transition-colors hover:text-sv-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue dark:text-white/50 dark:hover:text-sv-blue-light"
          >
            {t('more')}
          </Link>
        </div>
      </div>
    </div>
  )
}
