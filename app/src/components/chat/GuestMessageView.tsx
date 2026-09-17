"use client"

import { useState, type FormEvent } from "react"
import { AlertCircle, CheckCircle2, Send } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { contactStrings } from "@/components/contact/i18n"
import { useAutoGrow } from "./useAutoGrow"

/**
 * Guest "leave a message" — the panel's answer to a visitor who has no
 * account. Live chat needs an identity (rooms are per-user), but bouncing a
 * question to a sign-in wall loses it; this posts the same /api/contact the
 * contact page uses, and the reply comes by email.
 */
export default function GuestMessageView() {
  const { lang } = useI18n()
  const s = contactStrings(lang)
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [message, setMessage] = useState("")
  const boxRef = useAutoGrow(message, 140)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (state === "sending") return
    const data = new FormData(e.currentTarget)
    setState("sending")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          company: data.get("company"), // honeypot
        }),
      })
      setState(res.ok ? "sent" : "error")
    } catch {
      setState("error")
    }
  }

  if (state === "sent") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-sv-blue/10 text-sv-blue-deep">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </span>
        <h3 className="text-[15px] font-black text-sv-ink">{s.successTitle}</h3>
        <p className="text-[13px] font-medium leading-relaxed text-sv-ink/60">{s.successBody}</p>
      </div>
    )
  }

  const inputCls =
    "w-full rounded-control border border-sv-ink/10 bg-sv-ink/[0.03] px-3.5 py-2.5 text-[14px] font-medium text-sv-ink outline-none transition-colors placeholder:text-sv-ink/35 focus:border-sv-blue/40 touch-manipulation"

  return (
    <form
      onSubmit={onSubmit}
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
    >
      <label className="block">
        <span className="mb-1.5 block text-[12px] font-bold text-sv-ink/70">{s.nameLabel}</span>
        <input
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
          placeholder={s.namePh}
          className={inputCls}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[12px] font-bold text-sv-ink/70">{s.emailLabel}</span>
        <input
          name="email"
          type="email"
          required
          maxLength={240}
          autoComplete="email"
          inputMode="email"
          placeholder={s.emailPh}
          className={inputCls}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[12px] font-bold text-sv-ink/70">{s.messageLabel}</span>
        <textarea
          ref={boxRef}
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={s.messagePh}
          className={`${inputCls} max-h-36 resize-none [field-sizing:content]`}
        />
      </label>
      {/* Honeypot — off-screen, never announced, never focusable. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />
      {state === "error" && (
        <p role="alert" className="flex items-center gap-2 text-[12.5px] font-semibold text-sv-orange-deep">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {s.error}
        </p>
      )}
      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-sv-blue px-4 text-[14px] font-bold text-white transition hover:bg-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 disabled:opacity-60 touch-manipulation"
      >
        <Send className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        {state === "sending" ? s.sending : s.submit}
      </button>
    </form>
  )
}
