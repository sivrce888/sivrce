'use client'

import { useEffect, useRef, useState } from 'react'

import { isNative } from '@/lib/native'
import { useI18n } from '@/lib/i18n/context'

/**
 * PWA install prompt. Chromium gives us `beforeinstallprompt`; iOS Safari
 * has no API, so it gets a one-line Share-sheet hint instead. Hidden in the
 * Capacitor shell (the app is already installed) and for 30 days after a
 * dismissal. Appears from the second visit, 10s after load, so it never
 * greets a newcomer or touches LCP/INP.
 */

interface InstallEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'sivrce:install-dismissed'
const RESHOW_MS = 30 * 24 * 60 * 60 * 1000
const SHOW_AFTER_MS = 10_000
const VISITS_KEY = 'sivrce:visits'

export function InstallPrompt() {
  const { t } = useI18n()
  const [evt, setEvt] = useState<InstallEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isNative()) return
    if (Date.now() - Number(localStorage.getItem(DISMISS_KEY) ?? 0) < RESHOW_MS) return
    // Earned, not ambushed: first-time visitors never see the ask — only a
    // returning visitor (second session+) has shown the intent it serves.
    let visits = Number(localStorage.getItem(VISITS_KEY) ?? 0)
    if (!sessionStorage.getItem(VISITS_KEY)) {
      sessionStorage.setItem(VISITS_KEY, '1')
      localStorage.setItem(VISITS_KEY, String(++visits))
    }
    if (visits < 2) return

    const iosStandalone =
      matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    if (iosStandalone) return

    const ua = navigator.userAgent
    const isApple = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document)
    const safariIOS = isApple && !/Chrom|CriOS|EdgiOS|FxiOS|OPT\//.test(ua)

    // Safari iOS never fires beforeinstallprompt, so it is decided here — but
    // on the same delay timer as every other path instead of synchronously in
    // the effect body, which used to cascade an extra render pair on load.
    if (safariIOS) {
      const id = setTimeout(() => {
        setIos(true)
        setShow(true)
      }, SHOW_AFTER_MS)
      return () => clearTimeout(id)
    }

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvt(e as InstallEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  useEffect(() => {
    if (!evt) return
    const id = setTimeout(() => setShow(true), SHOW_AFTER_MS)
    return () => clearTimeout(id)
  }, [evt])

  // Publishes the banner's height so the chat launcher (same bottom corner on
  // phones) lifts above it instead of covering the dismiss button.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const root = document.documentElement.style
    root.setProperty('--sv-install', `${el.offsetHeight}px`)
    return () => {
      root.removeProperty('--sv-install')
    }
  }, [show, ios, evt])

  if (!show || (!evt && !ios)) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShow(false)
  }

  const install = async () => {
    if (!evt) return
    await evt.prompt()
    const { outcome } = await evt.userChoice
    if (outcome === 'accepted') localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setEvt(null)
    setShow(false)
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={t('app.install.title')}
      className="fixed inset-x-3 bottom-[calc(var(--sv-dock,0px)+0.75rem)] z-[44] mx-auto flex max-w-md items-center gap-3 rounded-tile border border-white/10 bg-sv-navy p-3.5 shadow-card sm:inset-x-auto sm:start-5"
    >
      {/* The exact icon the OS installs (navy tile + spark) — a preview, not decoration. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- 1.4 KB static icon, no optimizer round-trip */}
      <img
        src="/icons/icon-96.webp"
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-control ring-1 ring-white/15"
        decoding="async"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold leading-snug text-white">{t('app.install.title')}</p>
        {ios ? (
          <p className="mt-0.5 text-[12px] font-medium leading-snug text-white/60">
            {t('app.install.ios')}
          </p>
        ) : null}
      </div>
      {evt ? (
        <button
          type="button"
          onClick={install}
          className="shrink-0 rounded-full bg-sv-orange px-4 py-2 text-[13px] font-extrabold text-sv-ink transition-colors hover:bg-sv-orange-light active:scale-[0.97]"
        >
          {t('app.install.action')}
        </button>
      ) : null}
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('app.install.later')}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
      >
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
