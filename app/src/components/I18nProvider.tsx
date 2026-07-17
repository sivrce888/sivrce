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

/** Locales with their own server-rendered route today. */
const ROUTED: Partial<Record<Lang, string>> = { ka: '/', en: '/en', ru: '/ru' }

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

  // Persist + sync <html lang> only on explicit user action
  const setLang = useCallback(
    (next: Lang) => {
      persistLang(next)
      emitLangChange()
      // On a URL-pinned page, switching language means switching route;
      // unrouted locales fall back to '/', where the stored pick applies.
      if (initialLang) window.location.assign(ROUTED[next] ?? '/')
    },
    [initialLang],
  )

  // A URL-pinned locale also becomes the stored preference.
  useEffect(() => {
    if (initialLang) persistLang(initialLang)
  }, [initialLang])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr'
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
