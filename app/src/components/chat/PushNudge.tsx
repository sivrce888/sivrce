'use client'

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'

import { pushSupported, subscribePush } from '@/components/push/PushToggle'
import { useI18n } from '@/lib/i18n/context'

const DISMISS_KEY = 'sivrce:push-nudge-dismissed'
const RESHOW_MS = 30 * 24 * 60 * 60 * 1000

/**
 * "Get notified when they reply" — asked right after the user's own message,
 * the one moment the permission prompt has an obvious reason. The server
 * already pushes every chat message (api/chat/[roomId]); this is only the
 * opt-in. Silent when push is unsupported (iOS outside the installed app),
 * already decided (granted/denied), or dismissed in the last 30 days.
 */
export default function PushNudge() {
  const { t } = useI18n()
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0)
    // Deferred a tick: reads browser-only state, keeps the first paint stable.
    const id = setTimeout(() => {
      setShow(
        pushSupported() && Notification.permission === 'default' && Date.now() - dismissedAt > RESHOW_MS,
      )
    }, 0)
    return () => clearTimeout(id)
  }, [])

  if (!show) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShow(false)
  }

  const enable = async () => {
    setBusy(true)
    try {
      await subscribePush()
    } catch (err) {
      console.error('[push] subscribe failed', err)
    } finally {
      // Whatever the answer, the browser now remembers it — never ask twice.
      setBusy(false)
      setShow(false)
    }
  }

  return (
    <div className="flex items-center gap-2.5 border-t border-sv-ink/[0.08] bg-sv-blue/[0.04] px-3 py-2">
      <Bell className="h-4 w-4 shrink-0 text-sv-blue" aria-hidden />
      <p className="min-w-0 flex-1 text-[12.5px] font-semibold leading-snug text-sv-ink/70">
        {t('chat.pushNudge')}
      </p>
      <button
        type="button"
        onClick={enable}
        disabled={busy}
        className="min-h-9 shrink-0 rounded-full bg-sv-blue px-3.5 text-[12.5px] font-bold text-white transition-colors hover:bg-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 disabled:opacity-60 touch-manipulation"
      >
        {t('chat.pushOn')}
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('chat.pushLater')}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sv-ink/45 transition-colors hover:bg-sv-ink/[0.06] hover:text-sv-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue touch-manipulation"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}
