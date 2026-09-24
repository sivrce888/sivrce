'use client'

import { useEffect, useState } from 'react'

/**
 * Push notification opt-in/out for the settings page.
 * Labels come from the server (getServerT) so all 10 locales stay in the dicts.
 */

type Status = 'loading' | 'unsupported' | 'denied' | 'off' | 'on'

export interface PushToggleLabels {
  enable: string
  disable: string
  denied: string
  unsupported: string
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

async function postJSON(url: string, payload: unknown): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.ok
  } catch {
    return false
  }
}

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

/** Browser can do Web Push and the server has a VAPID key. */
export function pushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    Boolean(VAPID_KEY)
  )
}

/**
 * Ask permission, subscribe, register with the server. Returns the
 * resulting status — 'on' only when the server stored the subscription.
 * Must run inside a user gesture (iOS requires it for the permission prompt).
 */
export async function subscribePush(): Promise<'on' | 'off' | 'denied'> {
  if (!VAPID_KEY) return 'off'
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'off'
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_KEY) as BufferSource,
  })
  if (!(await postJSON('/api/push/subscribe', sub.toJSON()))) throw new Error('subscribe api failed')
  return 'on'
}

export function PushToggle({ labels }: { labels: PushToggleLabels }) {
  const [status, setStatus] = useState<Status>('loading')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let cancelled = false
    const detect = async (): Promise<Status> => {
      if (!pushSupported()) return 'unsupported'
      if (Notification.permission === 'denied') return 'denied'
      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        return sub ? 'on' : 'off'
      } catch {
        return 'off'
      }
    }
    void detect().then((s) => {
      if (!cancelled) setStatus(s)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function subscribe() {
    setBusy(true)
    try {
      setStatus(await subscribePush())
    } catch (err) {
      console.error('[push] subscribe failed', err)
    } finally {
      setBusy(false)
    }
  }

  async function unsubscribe() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      const endpoint = sub?.endpoint
      if (sub) await sub.unsubscribe().catch(() => {})
      // Server row must go even if the browser-side unsubscribe hiccups.
      if (endpoint) await postJSON('/api/push/unsubscribe', { endpoint })
      setStatus('off')
    } catch (err) {
      console.error('[push] unsubscribe failed', err)
    } finally {
      setBusy(false)
    }
  }

  if (status === 'unsupported') {
    return <p className="mt-4 text-[12.5px] font-medium text-sv-ink/60">{labels.unsupported}</p>
  }
  if (status === 'denied') {
    return <p className="mt-4 text-[12.5px] font-medium text-sv-ink/60">{labels.denied}</p>
  }

  const isOn = status === 'on'
  return (
    <button
      type="button"
      disabled={busy || status === 'loading'}
      onClick={isOn ? unsubscribe : subscribe}
      className={`mt-4 rounded-full px-5 py-2.5 text-[13px] font-bold transition disabled:opacity-60 ${
        isOn
          ? 'border border-sv-ink/12 text-sv-ink/70 hover:border-sv-blue hover:text-sv-blue'
          : 'bg-sv-blue text-white hover:bg-sv-blue-deep'
      }`}
    >
      {isOn ? labels.disable : labels.enable}
    </button>
  )
}
