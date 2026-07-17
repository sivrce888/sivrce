'use client'

/**
 * Mobile-only sticky lead bar: tel: call button + message button.
 * Drop-in self-contained: if a LeadForm exists on the page (#lead-form) the
 * message button scrolls to and focuses it; otherwise it opens a bottom sheet
 * with its own LeadForm.
 */

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Phone, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { telHref } from '@/lib/inquiries/phone'
import { cn } from '@/lib/utils'
import { LEAD_FORM_ID, LeadForm, type LeadFormProps } from './LeadForm'
import { leadStrings } from './i18n'

export interface StickyLeadBarProps {
  targetType: LeadFormProps['targetType']
  targetId: string
  /** Contact phone (`+995 …`) for the call button. */
  phone: string
  recipientName?: string
  className?: string
}

export function StickyLeadBar({ targetType, targetId, phone, recipientName, className }: StickyLeadBarProps) {
  const { lang } = useI18n()
  const s = leadStrings(lang)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    // Focus the first real field of the sheet form (skip the honeypot).
    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('input:not([tabindex="-1"])')?.focus()
    }, 60)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(timer)
      // Button remounts when the sheet closes; look it up fresh after paint.
      requestAnimationFrame(() => document.getElementById('sticky-lead-message')?.focus())
    }
  }, [open])

  function onMessage() {
    const form = document.getElementById(LEAD_FORM_ID)
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'center' })
      window.setTimeout(() => {
        form.querySelector<HTMLElement>('input:not([tabindex="-1"])')?.focus({ preventScroll: true })
      }, 500)
    } else {
      setOpen(true)
    }
  }

  return (
    <>
      {!open && (
        <div
          role="group"
          aria-label={s.barLabel}
          className={cn('fixed inset-x-0 bottom-0 z-40 px-4 md:hidden', className)}
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex gap-2.5 rounded-full border border-sv-ink/[0.06] bg-sv-surface/95 p-2 shadow-card-hover backdrop-blur">
            <a
              href={telHref(phone)}
              aria-label={s.call}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border border-sv-ink/[0.08] text-[15px] font-extrabold text-sv-ink transition-all hover:border-sv-blue/40 hover:text-sv-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue active:scale-[0.98]"
            >
              <Phone className="h-4.5 w-4.5" aria-hidden />
              {s.call}
            </a>
            <button
              id="sticky-lead-message"
              type="button"
              onClick={onMessage}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-sv-orange text-[15px] font-extrabold text-white shadow-glow-orange transition-all hover:shadow-glow-orange-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-orange active:scale-[0.98]"
            >
              <MessageCircle className="h-4.5 w-4.5" aria-hidden />
              {s.messageAction}
            </button>
          </div>
        </div>
      )}

      {open && (
        <>
          <button
            type="button"
            aria-label={s.close}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-sv-navy/40 md:hidden"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-label={s.dialogLabel}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-card bg-sv-surface p-4 shadow-panel-dark md:hidden"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="mx-auto h-1 w-10 rounded-full bg-sv-ink/15" aria-hidden />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={s.close}
                className="grid min-h-[44px] min-w-[44px] place-items-center rounded-full text-sv-ink/50 transition-colors hover:bg-sv-cloud hover:text-sv-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <LeadForm targetType={targetType} targetId={targetId} {...(recipientName ? { recipientName } : {})} />
          </div>
        </>
      )}
    </>
  )
}
