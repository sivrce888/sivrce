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

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
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
  type I18nContextValue,
  type DictKey,
  type Lang,
} from '@/lib/i18n/context'
import { translateRaw } from '@/lib/i18n/core'
import { ka as kaDict } from '@/lib/i18n/ka'
import { CMS_BLOCKS, type CmsBlockKey } from '@/lib/cms-blocks'

export type { DictKey, Lang } from '@/lib/i18n/context'

/** On-demand dictionaries for the stored-preference flip (unprefixed auth tree).
 *  [lang] pages never hit this — the layout passes `dict` via RSC props. */
const LOAD_DICT: Record<Exclude<Lang, 'ka'>, () => Promise<Record<DictKey, string>>> = {
  en: () => import('@/lib/i18n/en').then((m) => m.en),
  ru: () => import('@/lib/i18n/ru').then((m) => m.ru),
  he: () => import('@/lib/i18n/he').then((m) => m.he),
  ar: () => import('@/lib/i18n/ar').then((m) => m.ar),
  tr: () => import('@/lib/i18n/tr').then((m) => m.tr),
  uk: () => import('@/lib/i18n/uk').then((m) => m.uk),
  hy: () => import('@/lib/i18n/hy').then((m) => m.hy),
  az: () => import('@/lib/i18n/az').then((m) => m.az),
}

export default function I18nProvider({
  children,
  initialLang,
  dict,
  overrides,
  blocks,
}: {
  children: ReactNode
  /** Pin the locale (URL-driven pages like /en, /ru) — wins over stored preference. */
  initialLang?: Lang
  /**
   * Dictionary for the pinned locale, fetched server-side by the [lang]
   * layout. Omitted for ka (the static fallback chunk) — keeps all nine
   * dictionaries out of the shared client bundle.
   */
  dict?: Record<DictKey, string>
  /**
   * CMS text overrides for the active locale (SystemConfig `cms.<lang>.*`),
   * keyed by dict key or `block.<blockKey>`. Server-fetched by the [lang]
   * layout; empty object renders the site exactly as coded.
   */
  overrides?: Record<string, string>
  /**
   * Resolved marketing blocks for the active locale (override → coded
   * default → ka), server-fetched via getBlocksForLang. Keeps the 8-lang
   * block dicts server-side.
   */
  blocks?: Record<CmsBlockKey, string>
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

  // Stored-preference flip without a `dict` prop (unprefixed auth tree):
  // fetch just that locale's dictionary; ka renders until it lands.
  const [loaded, setLoaded] = useState<{ lang: Lang; dict: Record<DictKey, string> } | null>(null)
  useEffect(() => {
    if (dict || lang === 'ka') return
    let live = true
    LOAD_DICT[lang]()
      .then((d) => {
        if (live) setLoaded({ lang, dict: d })
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [lang, dict])

  const active = dict ?? (loaded?.lang === lang ? loaded.dict : kaDict)

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
      t: (key, vars) =>
        overrides?.[key] != null
          ? translateRaw(overrides[key]!, vars)
          : translateRaw(active[key] ?? kaDict[key] ?? String(key), vars),
      b: (key, vars) =>
        translateRaw(
          blocks?.[key] ?? overrides?.[`block.${key}`] ?? CMS_BLOCKS[key],
          vars,
        ),
    }),
    [lang, setLang, active, overrides, blocks],
  )

  return (
    <I18nContext.Provider value={value}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </I18nContext.Provider>
  )
}
