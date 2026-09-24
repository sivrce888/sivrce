import { useEffect, useState } from 'react'

import type { Lang } from '@/lib/i18n/core'

/**
 * Chat message translation. Deciding whether to offer it is free (Unicode
 * script of the text vs. the reader's locale). Translating goes on-device
 * first — Chrome's built-in Translator API: zero cost, the text never leaves
 * the phone — and falls back to /api/chat/translate (Gemini, membership-
 * checked, cached) on Safari/Firefox or when the language pack is missing.
 */

type Script = 'Georgian' | 'Latin' | 'Cyrillic' | 'Hebrew' | 'Arabic' | 'Armenian'

const LANG_SCRIPT: Record<Lang, Script> = {
  ka: 'Georgian',
  en: 'Latin',
  de: 'Latin',
  tr: 'Latin',
  az: 'Latin',
  ru: 'Cyrillic',
  uk: 'Cyrillic',
  he: 'Hebrew',
  ar: 'Arabic',
  hy: 'Armenian',
}

const SCRIPT_RE: Record<Script, RegExp> = {
  Georgian: /\p{Script=Georgian}/gu,
  Latin: /\p{Script=Latin}/gu,
  Cyrillic: /\p{Script=Cyrillic}/gu,
  Hebrew: /\p{Script=Hebrew}/gu,
  Arabic: /\p{Script=Arabic}/gu,
  Armenian: /\p{Script=Armenian}/gu,
}

/** Below this many letters ("ok", "👍", a price) translation is noise. */
const MIN_LETTERS = 4

export function dominantScript(text: string): Script | null {
  let best: Script | null = null
  let bestCount = 0
  for (const s of Object.keys(SCRIPT_RE) as Script[]) {
    const count = text.match(SCRIPT_RE[s])?.length ?? 0
    if (count > bestCount) {
      best = s
      bestCount = count
    }
  }
  return bestCount >= MIN_LETTERS ? best : null
}

/**
 * 'yes' — different script than the reader's locale, certainly foreign.
 * 'maybe' — same script shared by several locales (en/de/tr/az, ru/uk):
 *   only a language detector can tell.
 * 'no' — reader's own script and no other locale shares it, or too short.
 *
 * ponytail: without a detector (Safari/Firefox) 'maybe' never offers, so en↔de
 * or ru↔uk go untranslated there; add a server detect call if that shows up.
 */
export function translateHint(text: string, lang: Lang): 'yes' | 'maybe' | 'no' {
  const script = dominantScript(text)
  if (!script) return 'no'
  if (script !== LANG_SCRIPT[lang]) return 'yes'
  const shared = (Object.values(LANG_SCRIPT) as Script[]).filter((s) => s === script).length > 1
  return shared ? 'maybe' : 'no'
}

// Chrome 138+ built-in AI (not yet in lib.dom). Minimal surface we use.
type Availability = 'unavailable' | 'downloadable' | 'downloading' | 'available'
interface BuiltInAi {
  LanguageDetector?: {
    availability(): Promise<Availability>
    create(): Promise<{
      detect(text: string): Promise<{ detectedLanguage: string; confidence: number }[]>
      destroy?(): void
    }>
  }
  Translator?: {
    availability(o: { sourceLanguage: string; targetLanguage: string }): Promise<Availability>
    create(o: { sourceLanguage: string; targetLanguage: string }): Promise<{
      translate(text: string): Promise<string>
      destroy?(): void
    }>
  }
}
const ai = (): BuiltInAi => globalThis as unknown as BuiltInAi

/** BCP-47 base of the detected language, or null when unsure / not ready. */
async function detectOnDevice(text: string): Promise<string | null> {
  const LD = ai().LanguageDetector
  // ponytail: 'available' only — never trigger a silent model download.
  if (!LD || (await LD.availability()) !== 'available') return null
  const det = await LD.create()
  try {
    const [top] = await det.detect(text)
    return top && top.detectedLanguage !== 'und' && top.confidence >= 0.6
      ? top.detectedLanguage.split('-')[0]
      : null
  } finally {
    det.destroy?.()
  }
}

async function translateOnDevice(text: string, lang: Lang): Promise<string | null> {
  const TR = ai().Translator
  if (!TR) return null
  const src = await detectOnDevice(text)
  if (!src || src === lang) return null
  const pair = { sourceLanguage: src, targetLanguage: lang }
  // ponytail: 'available' only — a missing pack goes to the server, which is
  // faster than a mid-conversation multi-MB download.
  if ((await TR.availability(pair)) !== 'available') return null
  const tr = await TR.create(pair)
  try {
    return (await tr.translate(text)) || null
  } finally {
    tr.destroy?.()
  }
}

async function translateOnServer(messageId: string, lang: Lang): Promise<string | null> {
  const res = await fetch('/api/chat/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId, targetLang: lang }),
  })
  if (!res.ok) return null
  const data = (await res.json()) as { translated?: string }
  return data.translated ?? null
}

/** On-device when the browser can, server otherwise; null = nobody could. */
export async function translateMessage(id: string, text: string, lang: Lang): Promise<string | null> {
  return (await translateOnDevice(text, lang).catch(() => null)) ?? (await translateOnServer(id, lang))
}

/** Survives bubble remounts (room switch, list virtualization) per session. */
const cache = new Map<string, string>()

export function useMessageTranslation(id: string, text: string, lang: Lang, enabled: boolean) {
  const key = `${id}:${lang}`
  const hint = enabled ? translateHint(text, lang) : 'no'
  const [detected, setDetected] = useState<boolean | null>(null)
  const [translated, setTranslated] = useState<string | null>(() => cache.get(key) ?? null)
  const [shown, setShown] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (hint !== 'maybe') return
    let live = true
    detectOnDevice(text)
      .then((src) => live && setDetected(src !== null && src !== lang))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [hint, text, lang])

  const offer = hint === 'yes' || (hint === 'maybe' && detected === true)

  const toggle = async () => {
    if (shown) return setShown(false)
    if (translated) return setShown(true)
    setBusy(true)
    setFailed(false)
    try {
      const out = await translateMessage(id, text, lang)
      if (!out) throw new Error('translation_unavailable')
      cache.set(key, out)
      setTranslated(out)
      setShown(true)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return { offer, shown, busy, failed, text: shown && translated ? translated : text, toggle }
}
