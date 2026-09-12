'use client'

/**
 * SIVRCE — Airbnb-style locale nudge ("Browsing from Germany? Switch to Deutsch?").
 * Suggests, never forces: IP country (via /api/geo) wins for the location half,
 * browser language for the settings half. One show per session, dismissed
 * suggestions never return. Names come from Intl.DisplayNames (native, 0 bytes).
 */

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Globe, X } from 'lucide-react'
import { useI18n, type Lang } from '@/lib/i18n/context'
import { bestLangFromHeader, suggestLangForCountry, LANG_LOCALE_TAG } from '@/lib/i18n/accept-language'

const STRINGS: Record<Lang, { langWord: string; switch: string; dismiss: string }> = {
  ka: { langWord: 'ენა', switch: 'შეცვლა', dismiss: 'დახურვა' },
  en: { langWord: 'Language', switch: 'Switch', dismiss: 'Dismiss' },
  ru: { langWord: 'Язык', switch: 'Сменить', dismiss: 'Закрыть' },
  he: { langWord: 'שפה', switch: 'החלפה', dismiss: 'סגירה' },
  ar: { langWord: 'اللغة', switch: 'تبديل', dismiss: 'إغلاق' },
  tr: { langWord: 'Dil', switch: 'Değiştir', dismiss: 'Kapat' },
  uk: { langWord: 'Мова', switch: 'Змінити', dismiss: 'Закрити' },
  hy: { langWord: 'Լեզու', switch: 'Փոխել', dismiss: 'Փակել' },
  az: { langWord: 'Dil', switch: 'Dəyiş', dismiss: 'Bağla' },
  de: { langWord: 'Sprache', switch: 'Wechseln', dismiss: 'Schließen' },
}

const SESSION_KEY = 'sv-locale-suggest'
const OFF_KEY = 'sv-locale-suggest-off'

function dismissed(target: Lang): boolean {
  try {
    return (JSON.parse(localStorage.getItem(OFF_KEY) ?? '[]') as string[]).includes(target)
  } catch {
    return false
  }
}

function markOff(target: Lang) {
  try {
    const cur = new Set<string>(JSON.parse(localStorage.getItem(OFF_KEY) ?? '[]') as string[])
    cur.add(target)
    localStorage.setItem(OFF_KEY, JSON.stringify([...cur]))
  } catch {
    /* private mode */
  }
}

function displayName(tag: string, type: 'region' | 'language', code: string): string | null {
  try {
    return new Intl.DisplayNames([tag], { type }).of(code) ?? null
  } catch {
    return null
  }
}

interface Suggestion {
  target: Lang
  country: string | null
}

export default function LocaleSuggest() {
  const { lang, setLang } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const [sug, setSug] = useState<Suggestion | null>(null)

  useEffect(() => {
    let live = true
    if (sessionStorage.getItem(SESSION_KEY)) return
    sessionStorage.setItem(SESSION_KEY, '1')
    const nav = bestLangFromHeader((navigator.languages ?? []).join(','))
    ;(async () => {
      let target = nav
      let cc: string | null = null
      try {
        const res = await fetch('/api/geo')
        if (res.ok) {
          const data = (await res.json()) as { country?: string | null; cc?: string }
          cc = data.country ?? data.cc ?? null
          target = suggestLangForCountry(cc) ?? target
        }
      } catch {
        /* offline — browser language only */
      }
      if (live && target && target !== lang && !dismissed(target)) {
        setSug({ target, country: cc })
      }
    })()
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per session by design
  }, [])

  if (!sug) return null
  const s = STRINGS[lang] ?? STRINGS.en
  const country = sug.country ? displayName(LANG_LOCALE_TAG[lang], 'region', sug.country) : null
  const language = displayName(LANG_LOCALE_TAG[sug.target], 'language', sug.target) ?? sug.target

  const switchTo = () => {
    markOff(sug.target)
    setSug(null)
    setLang(sug.target)
    const rest = pathname.replace(/^\/(en|ru|he|ar|tr|uk|hy|az|de)(?=\/|$)/, '') || '/'
    router.push(sug.target === 'ka' ? rest : `/${sug.target}${rest === '/' ? '' : rest}`)
  }

  const off = () => {
    markOff(sug.target)
    setSug(null)
  }

  return (
    <div
      role="dialog"
      aria-label={`${s.langWord}: ${language}`}
      className="glass-light fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-[90] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-module p-3 ps-4 shadow-card"
    >
      <Globe className="h-5 w-5 shrink-0 text-sv-blue" aria-hidden />
      <p className="min-w-0 flex-1 truncate text-[14px] font-bold text-sv-ink">
        {country ? `${country} · ` : ''}{s.langWord}: {language}
      </p>
      <button
        type="button"
        onClick={switchTo}
        className="shrink-0 rounded-full bg-sv-orange px-4 py-2 text-[13px] font-extrabold text-sv-ink transition-shadow duration-200 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
      >
        {s.switch}
      </button>
      <button
        type="button"
        onClick={off}
        aria-label={s.dismiss}
        className="shrink-0 rounded-full p-2 text-sv-ink/60 transition-colors hover:bg-sv-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}
