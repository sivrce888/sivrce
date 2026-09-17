'use client'

import { useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle2, MessageCircle, Send } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { useChat } from '@/components/chat/ChatProvider'
import { contactStrings } from './i18n'

/**
 * Contact form → POST /api/contact. Signed-in senders also get a support chat
 * thread back (roomId), so the answer arrives where they already look instead
 * of only in an inbox.
 */
export default function ContactForm() {
  const { lang } = useI18n()
  const s = contactStrings(lang)
  const { openChat, setActiveRoom } = useChat()

  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [roomId, setRoomId] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (state === 'sending') return
    const data = new FormData(e.currentTarget)
    setState('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          message: data.get('message'),
          company: data.get('company'), // honeypot
        }),
      })
      if (!res.ok) {
        setState('error')
        return
      }
      const json = (await res.json()) as { roomId?: string | null }
      setRoomId(json.roomId ?? null)
      setState('sent')
    } catch {
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <div className="rounded-card bg-sv-surface p-8 text-center shadow-card ring-1 ring-sv-ink/5">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-module bg-sv-blue/10">
          <CheckCircle2 className="h-7 w-7 text-sv-blue" />
        </div>
        <h2 className="mt-5 text-balance text-xl font-black tracking-[-0.02em] text-sv-ink">
          {s.successTitle}
        </h2>
        <p className="mt-2 text-[15px] font-medium text-sv-ink/60">{s.successBody}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {roomId && (
            <button
              type="button"
              onClick={() => {
                setActiveRoom(roomId)
                openChat()
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-sv-blue px-5 text-sm font-bold text-white transition hover:bg-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {s.openChat}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setRoomId(null)
              setState('idle')
            }}
            className="min-h-11 rounded-full bg-sv-orange px-6 text-sm font-bold text-sv-ink shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-orange focus-visible:ring-offset-2"
          >
            {s.newMessage}
          </button>
        </div>
      </div>
    )
  }

  const inputCls =
    'w-full rounded-control bg-sv-cloud px-4 py-3 text-[15px] font-medium text-sv-ink ring-1 ring-sv-ink/5 outline-none transition placeholder:text-sv-ink/35 focus:ring-2 focus:ring-sv-blue/40'

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-card bg-sv-surface p-6 shadow-card ring-1 ring-sv-ink/5 md:p-8"
    >
      <div className="grid gap-5">
        <div>
          <label htmlFor="contact-name" className="mb-2 block text-sm font-bold text-sv-ink">
            {s.nameLabel}
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            placeholder={s.namePh}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-2 block text-sm font-bold text-sv-ink">
            {s.emailLabel}
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={240}
            autoComplete="email"
            placeholder={s.emailPh}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="mb-2 block text-sm font-bold text-sv-ink">
            {s.messageLabel}
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            minLength={10}
            maxLength={2000}
            rows={5}
            placeholder={s.messagePh}
            className={`${inputCls} resize-none`}
          />
        </div>
        {/* Honeypot — off-screen, never announced, never focusable. */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute -left-[9999px] h-px w-px opacity-0"
        />
        {state === 'error' && (
          <p
            role="alert"
            className="flex items-center gap-2 text-[13.5px] font-semibold text-sv-orange-deep"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            {s.error}
          </p>
        )}
        <button
          type="submit"
          disabled={state === 'sending'}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-sv-orange px-6 py-3.5 text-sm font-bold text-sv-ink shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-orange focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <Send className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
          {state === 'sending' ? s.sending : s.submit}
        </button>
      </div>
    </form>
  )
}
