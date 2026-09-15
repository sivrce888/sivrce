'use client'

/**
 * SIVRCE — analytics consent gate (DSGVO Art. 6(1)(a) + TDDDG §25 + ePrivacy).
 *
 * No tracker (GTM, GA4, PostHog) may load before an explicit opt-in, and
 * withdrawal must cost exactly one click — same weight as granting, no
 * pre-ticked state, no "legitimate interest" side door. Undecided === denied.
 *
 * State lives in localStorage: nothing is written to the cookie jar until the
 * visitor says yes, so a bare visit leaves zero identifiers behind.
 */

import { useSyncExternalStore } from 'react'

export type Consent = 'granted' | 'denied'

export const CONSENT_KEY = 'sivrce.consent.v1'
export const CONSENT_EVENT = 'sivrce:consent'

/** Storage value → state. Anything unrecognised means "never asked". */
export function parseConsent(raw: string | null | undefined): Consent | null {
  return raw === 'granted' || raw === 'denied' ? raw : null
}

// undefined = not read from storage yet (keeps getSnapshot referentially stable)
let cache: Consent | null | undefined

function read(): Consent | null {
  try {
    return parseConsent(localStorage.getItem(CONSENT_KEY))
  } catch {
    return null // storage blocked (Safari private, lockdown, embedded webview)
  }
}

function snapshot(): Consent | null {
  if (cache === undefined) cache = read()
  return cache
}

function subscribe(onChange: () => void): () => void {
  const sync = () => {
    cache = read()
    onChange()
  }
  window.addEventListener(CONSENT_EVENT, sync)
  window.addEventListener('storage', sync) // decision made in another tab
  return () => {
    window.removeEventListener(CONSENT_EVENT, sync)
    window.removeEventListener('storage', sync)
  }
}

/** Cookie/localStorage keys the trackers own — purged the moment consent drops. */
export const TRACKING_PREFIXES = ['_ga', '_gid', '_gcl', 'ph_', '__ph'] as const

export function isTrackingKey(name: string): boolean {
  return TRACKING_PREFIXES.some((p) => name.startsWith(p))
}

/** Best-effort erase of tracker state. Host-only cookies; scripts already
 *  running are killed by the reload the caller does after withdrawal. */
function purgeTrackingStorage(): void {
  try {
    for (const raw of document.cookie.split(';')) {
      const name = raw.split('=')[0]?.trim()
      if (!name || !isTrackingKey(name)) continue
      for (const domain of ['', `; domain=${location.hostname}`, `; domain=.${location.hostname}`]) {
        document.cookie = `${name}=; path=/; max-age=0${domain}`
      }
    }
  } catch {}
  try {
    for (const key of Object.keys(localStorage)) {
      if (isTrackingKey(key)) localStorage.removeItem(key)
    }
  } catch {}
}

/** `null` reopens the prompt (footer "cookies" link = withdrawal in one click). */
export function setConsent(value: Consent | null): void {
  const previous = snapshot()
  try {
    if (value) localStorage.setItem(CONSENT_KEY, value)
    else localStorage.removeItem(CONSENT_KEY)
  } catch {}
  cache = value
  try {
    window.dispatchEvent(new Event(CONSENT_EVENT))
  } catch {}
  if (value !== 'granted' && previous === 'granted') {
    purgeTrackingStorage()
    // A tag already evaluated cannot be unloaded from the page — the reload is
    // the only honest way to make withdrawal take effect immediately.
    try {
      location.reload()
    } catch {}
  }
}

/**
 * `'pending'` until hydration (localStorage is unreadable on the server, so the
 * prompt must never be server-rendered — otherwise it flashes on every page
 * load for visitors who already decided, and ships in every HTML payload).
 * Then `null` while undecided, or the stored decision.
 */
export function useConsent(): Consent | null | 'pending' {
  return useSyncExternalStore(subscribe, snapshot, () => 'pending' as const)
}
