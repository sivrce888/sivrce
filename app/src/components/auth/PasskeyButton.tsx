"use client"

import { useEffect, useRef, useState } from "react"
import {
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
  startAuthentication,
} from "@simplewebauthn/browser"
import { Fingerprint } from "lucide-react"

import { signInWithPasskey } from "@/app/auth/actions"

function cancelled(err: unknown): boolean {
  const name = err instanceof Error ? err.name : ""
  return name === "NotAllowedError" || name === "AbortError"
}

export function PasskeyButton({ callbackUrl }: { callbackUrl: string }) {
  const [ready, setReady] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autofill = useRef(false)

  useEffect(() => {
    setReady(browserSupportsWebAuthn())
  }, [])

  useEffect(() => {
    if (!ready || autofill.current) return
    autofill.current = true
    void (async () => {
      if (!(await browserSupportsWebAuthnAutofill())) return
      try {
        const res = await fetch("/api/auth/passkey?op=login", { cache: "no-store" })
        if (!res.ok) return
        const optionsJSON = await res.json()
        const cred = await startAuthentication({
          optionsJSON,
          useBrowserAutofill: true,
          verifyBrowserAutofillInput: false,
        })
        await signInWithPasskey(callbackUrl, JSON.stringify(cred))
      } catch {
        // User dismissed the OS prompt or no passkey yet.
      }
    })()
  }, [ready, callbackUrl])

  async function onClick() {
    setError(null)
    setPending(true)
    try {
      const res = await fetch("/api/auth/passkey?op=login", { cache: "no-store" })
      if (res.status === 429) {
        setError("ზედმეტად ბევრი მცდელობა — სცადე ცოტა ხანში")
        return
      }
      if (!res.ok) {
        setError("Passkey დროებით მიუწვდომელია")
        return
      }
      const optionsJSON = await res.json()
      const cred = await startAuthentication({ optionsJSON })
      const result = await signInWithPasskey(callbackUrl, JSON.stringify(cred))
      if (result?.error) setError(result.error)
    } catch (err) {
      if (!cancelled(err)) setError("Passkey ვერ დადასტურდა — სცადე თავიდან")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-2">
      {error ? (
        <p
          role="alert"
          className="rounded-module bg-sv-orange-deep/10 px-3.5 py-2.5 text-center text-[12.5px] font-bold text-sv-orange-deep"
        >
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={pending || !ready}
        className="flex w-full items-center justify-center gap-2.5 rounded-full bg-sv-navy px-6 py-3.5 text-[14.5px] font-extrabold text-white shadow-glow-navy transition hover:-translate-y-0.5 hover:bg-sv-navy-soft disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98]"
      >
        <Fingerprint className="h-[18px] w-[18px]" aria-hidden />
        {pending ? "იტვირთება…" : "Face ID / Passkey"}
      </button>
      <input
        type="text"
        name="username"
        autoComplete="username webauthn"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
      <p className="text-center text-[12px] font-medium text-sv-ink/40">
        Face ID, Touch ID ან Windows Hello
      </p>
    </div>
  )
}
