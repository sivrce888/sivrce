"use client"

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react"
import { Phone } from "lucide-react"

import {
  requestPhoneCode,
  signInWithPhone,
  type AuthActionState,
} from "@/app/auth/actions"
import { formatPhone, OTP_LEN, normalizePhone } from "@/lib/auth-phone"

const COOLDOWN_S = 60

export function PhoneAuthForm({
  callbackUrl,
  submitLabel = "შესვლა",
  children,
}: {
  callbackUrl: string
  submitLabel?: string
  children?: ReactNode
}) {
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const codeRef = useRef<HTMLInputElement>(null)
  const verifyFormRef = useRef<HTMLFormElement>(null)
  const autoSubmitAt = useRef(0)

  const [sendState, sendAction, sending] = useActionState<AuthActionState, FormData>(
    requestPhoneCode,
    undefined,
  )
  const [authState, authAction, authing] = useActionState<AuthActionState, FormData>(
    signInWithPhone,
    undefined,
  )

  useEffect(() => {
    if (!sendState?.ok || !sendState.phone) return
    setSentTo(sendState.phone)
    setCode("")
    setCooldown(COOLDOWN_S)
  }, [sendState?.sentAt, sendState?.ok, sendState?.phone])

  useEffect(() => {
    if (!sentTo) return
    codeRef.current?.focus()
  }, [sentTo])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setTimeout(() => setCooldown((n) => n - 1), 1000)
    return () => window.clearTimeout(t)
  }, [cooldown])

  useEffect(() => {
    if (code.length !== OTP_LEN || authing || !verifyFormRef.current) return
    if (autoSubmitAt.current === code.length) return
    autoSubmitAt.current = code.length
    verifyFormRef.current.requestSubmit()
  }, [code, authing])

  useEffect(() => {
    if (!sentTo || !("OTPCredential" in window)) return
    const ac = new AbortController()
    void navigator.credentials
      .get({ otp: { transport: ["sms"] }, signal: ac.signal } as never)
      .then((cred) => {
        const next = (cred as { code?: string } | null)?.code?.replace(/\D/g, "") ?? ""
        if (next.length >= 4) setCode(next.slice(0, OTP_LEN))
      })
      .catch(() => {})
    return () => ac.abort()
  }, [sentTo])

  const ready = Boolean(normalizePhone(phone))
  const error = sentTo ? authState?.error ?? sendState?.error : sendState?.error

  if (sentTo) {
    return (
      <div className="space-y-5">
        {error ? (
          <p role="alert" className="rounded-module bg-sv-orange-deep/10 px-3.5 py-2.5 text-center text-[12.5px] font-bold text-sv-orange-deep">
            {error}
          </p>
        ) : (
          <p className="text-center text-[13px] font-medium leading-relaxed text-sv-ink/55">
            კოდი გაიგზავნა{" "}
            <span className="font-extrabold tabular-nums text-sv-ink">{sentTo}</span>
          </p>
        )}

        <form ref={verifyFormRef} action={authAction} className="space-y-3.5">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <input type="hidden" name="phone" value={sentTo} />
          <label className="block">
            <span className="mb-1.5 block text-center text-[12.5px] font-bold tracking-tight text-sv-ink/55">
              SMS კოდი
            </span>
            <input
              ref={codeRef}
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              pattern={`\\d{${OTP_LEN}}`}
              maxLength={OTP_LEN}
              enterKeyHint="done"
              aria-label="SMS კოდი"
              value={code}
              onChange={(e) => {
                autoSubmitAt.current = 0
                setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LEN))
              }}
              className="w-full rounded-control border border-sv-ink/10 bg-sv-cloud/80 px-4 py-3.5 text-center font-[family-name:var(--font-manrope)] text-[28px] font-black tabular-nums tracking-[0.35em] text-sv-ink outline-none transition placeholder:tracking-normal placeholder:text-sv-ink/25 focus:border-sv-blue focus:bg-sv-surface focus:ring-2 focus:ring-sv-blue/20"
              placeholder={"·".repeat(OTP_LEN)}
            />
          </label>
          <button
            type="submit"
            disabled={authing || code.length < 4}
            className="flex w-full items-center justify-center rounded-full bg-sv-blue px-6 py-3.5 text-[14.5px] font-extrabold text-white shadow-glow-blue-sm transition hover:-translate-y-0.5 hover:bg-sv-blue-deep hover:shadow-glow-blue disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            {authing ? "იტვირთება…" : submitLabel}
          </button>
        </form>

        <div className="flex items-center justify-between gap-3 text-[12.5px] font-bold">
          <button
            type="button"
            onClick={() => {
              setSentTo(null)
              setCode("")
              setCooldown(0)
            }}
            className="text-sv-ink/45 transition hover:text-sv-ink/70"
          >
            სხვა ნომერი
          </button>
          <form action={sendAction}>
            <input type="hidden" name="phone" value={sentTo} />
            <button
              type="submit"
              disabled={sending || cooldown > 0}
              className="text-sv-blue disabled:text-sv-ink/35"
            >
              {cooldown > 0 ? `ახალი კოდი ${cooldown} წმ` : sending ? "იგზავნება…" : "ახალი კოდი"}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {error ? (
        <p role="alert" className="rounded-module bg-sv-orange-deep/10 px-3.5 py-2.5 text-center text-[12.5px] font-bold text-sv-orange-deep">
          {error}
        </p>
      ) : null}

      <form action={sendAction} className="space-y-3.5">
        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-bold tracking-tight text-sv-ink/55">
            მობილურის ნომერი
          </span>
          <span className="relative flex items-center rounded-control border border-sv-ink/10 bg-sv-cloud/80 transition focus-within:border-sv-blue focus-within:bg-sv-surface focus-within:ring-2 focus-within:ring-sv-blue/20">
            <Phone className="ml-3.5 h-4 w-4 shrink-0 text-sv-ink/35" aria-hidden />
            <span className="ml-2.5 shrink-0 text-[13.5px] font-extrabold tabular-nums text-sv-ink/50">
              +995
            </span>
            <span className="mx-2.5 h-5 w-px bg-sv-ink/10" aria-hidden />
            <input type="hidden" name="phone" value={phone} />
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              autoFocus
              enterKeyHint="send"
              aria-label="მობილურის ნომერი"
              value={phone.replace(/^\+995\s?/, "")}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="555 12 34 56"
              className="min-w-0 flex-1 bg-transparent py-3.5 pr-4 text-[15px] font-semibold tabular-nums tracking-wide text-sv-ink outline-none placeholder:font-medium placeholder:tracking-normal placeholder:text-sv-ink/35"
            />
          </span>
        </label>
        <button
          type="submit"
          disabled={sending || !ready}
          className="flex w-full items-center justify-center rounded-full bg-sv-blue px-6 py-3.5 text-[14.5px] font-extrabold text-white shadow-glow-blue-sm transition hover:-translate-y-0.5 hover:bg-sv-blue-deep hover:shadow-glow-blue disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          {sending ? "იგზავნება…" : "კოდის მიღება"}
        </button>
        <p className="text-center text-[12px] font-medium leading-relaxed text-sv-ink/40">
          ერთი ნომერი — შესვლა და რეგისტრაცია. პაროლი არ გჭირდება.
        </p>
      </form>
      {children}
    </div>
  )
}
