'use client'

/**
 * SIVRCE — i18n provider
 * Lightweight React context, no dependencies. Georgian by default,
 * persisted to localStorage('sivrce:lang'), keeps <html lang> in sync.
 *
 * SSR-safe: the language comes from useSyncExternalStore — the server
 * snapshot is always 'ka' (matching SSR + hydration), and the stored
 * language is picked up immediately after hydration. No localStorage
 * access during render, no hydration mismatch.
 *
 * Usage:
 *   import { useI18n } from '@/lib/i18n/context'
 *   const { lang, setLang, t } = useI18n()
 */

import { useCallback, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'
import {
  I18nContext,
  LANGS,
  RTL_LANGS,
  emitLangChange,
  getServerLang,
  persistLang,
  readStoredLang,
  subscribeLang,
  translate,
  type I18nContextValue,
  type Lang,
} from '@/lib/i18n/context'

export type { DictKey, Lang } from '@/lib/i18n/context'

export default function I18nProvider({
  children,
  initialLang,
}: {
  children: ReactNode
  /** Pin the locale (URL-driven pages like /en, /ru) — wins over stored preference. */
  initialLang?: Lang
}) {
  const storeLang = useSyncExternalStore(subscribeLang, readStoredLang, getServerLang)
  // ponytail: pinned locale ignores the store, so SSR and first client render
  // always agree (no hydration flash for Googlebot, which has no localStorage).
  // Upgrade path: full app/[lang] migration where the root layout owns this.
  const lang = initialLang ?? storeLang

  // Persist + sync <html lang> only on explicit user action.
  // Route navigation on switch is owned by LangSwitcher, not here.
  const setLang = useCallback((next: Lang) => {
    persistLang(next)
    emitLangChange()
  }, [])

  // A URL-pinned locale also becomes the stored preference.
  useEffect(() => {
    if (initialLang) persistLang(initialLang)
  }, [initialLang])

  // Locale prefix in the URL (/en/search) wins over stored preference —
  // a shared link must render in the language it was shared in. Effect-based
  // (not render-time) so SSR and hydration stay byte-identical.
  useEffect(() => {
    const seg = window.location.pathname.split('/')[1] as Lang
    if (LANGS.includes(seg) && seg !== 'ka' && seg !== lang) setLang(seg)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once on mount; prefix is stable per load
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr'
    // Locale URLs are middleware rewrites — point canonical at the visible prefixed URL.
    const seg = window.location.pathname.split('/')[1] as Lang
    if (LANGS.includes(seg) && seg !== 'ka') {
      document
        .querySelector<HTMLLinkElement>('link[rel="canonical"]')
        ?.setAttribute('href', window.location.href.split(/[?#]/)[0])
    }
  }, [lang])

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang, setLang],
  )

  return (
    <I18nContext.Provider value={value}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </I18nContext.Provider>
  )
}
