"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { startRegistration } from "@simplewebauthn/browser"
import { Fingerprint, Plus, Trash2 } from "lucide-react"

import { deletePasskey } from "@/app/auth/actions"

export type PasskeyRow = {
  credentialID: string
  credentialDeviceType: string
  credentialBackedUp: boolean
}

function labelFor(k: PasskeyRow): string {
  if (k.credentialBackedUp || k.credentialDeviceType === "multiDevice") {
    return "სინქრონიზებული Passkey"
  }
  return "ამ მოწყობილობის Passkey"
}

export function PasskeysCard({ keys }: { keys: PasskeyRow[] }) {
  const router = useRouter()
  const [list, setList] = useState(keys)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function add() {
    setError(null)
    setPending(true)
    try {
      const res = await fetch("/api/auth/passkey?op=register", { cache: "no-store" })
      if (!res.ok) {
        setError("ვერ დაიწყო — სცადე თავიდან")
        return
      }
      const optionsJSON = await res.json()
      const att = await startRegistration({ optionsJSON })
      const saved = await fetch("/api/auth/passkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(att),
      })
      if (!saved.ok) {
        const body = (await saved.json().catch(() => null)) as { error?: string } | null
        setError(body?.error ?? "Passkey ვერ დაემატა")
        return
      }
      router.refresh()
    } catch (err) {
      const name = err instanceof Error ? err.name : ""
      if (name !== "NotAllowedError" && name !== "AbortError") {
        setError("Passkey ვერ დაემატა")
      }
    } finally {
      setPending(false)
    }
  }

  async function remove(id: string) {
    if (!window.confirm("წავშალოთ ეს Passkey?")) return
    setList((prev) => prev.filter((k) => k.credentialID !== id))
    await deletePasskey(id)
    router.refresh()
  }

  return (
    <section
      id="passkeys"
      className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-blue/10 text-sv-blue">
          <Fingerprint size={18} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-extrabold text-sv-ink">Passkey</h2>
          <p className="mt-1 text-[13px] font-medium text-sv-ink/55">
            Face ID, Touch ID ან Windows Hello — შესვლა პაროლის გარეშე.
          </p>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-module bg-sv-orange-deep/10 px-3.5 py-2.5 text-center text-[12.5px] font-bold text-sv-orange-deep"
        >
          {error}
        </p>
      ) : null}

      {list.length > 0 ? (
        <ul className="mt-4 divide-y divide-sv-ink/6">
          {list.map((k) => (
            <li key={k.credentialID} className="flex items-center gap-3 py-3">
              <Fingerprint className="h-4 w-4 shrink-0 text-sv-blue" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-extrabold text-sv-ink">{labelFor(k)}</p>
                <p className="font-mono text-[11.5px] font-medium tracking-wide text-sv-ink/40">
                  ••••{k.credentialID.slice(-4)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void remove(k.credentialID)}
                className="grid h-9 w-9 place-items-center rounded-full text-sv-ink/35 transition hover:bg-sv-cloud hover:text-sv-orange-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
                aria-label="Passkey-ის წაშლა"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[13px] font-medium text-sv-ink/50">
          ჯერ არცერთი არ გაქვს. დაამატე ერთხელ — შემდეგ შესვლა ერთი შეხებით.
        </p>
      )}

      <button
        type="button"
        onClick={() => void add()}
        disabled={pending}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-sv-blue px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-sv-blue-deep disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {pending ? "იტვირთება…" : "Passkey-ის დამატება"}
      </button>
    </section>
  )
}
