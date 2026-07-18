"use client"

import { useActionState } from "react"

import {
  requestPasswordReset,
  type AuthActionState,
} from "@/app/auth/actions"
import { AuthInput } from "@/components/auth/AuthInput"

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    requestPasswordReset,
    undefined,
  )

  return (
    <div className="space-y-5">
      {state?.error ? (
        <p className="rounded-module bg-sv-orange-deep/10 px-3.5 py-2.5 text-center text-[12.5px] font-bold text-sv-orange-deep">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-module bg-sv-blue/10 px-3.5 py-2.5 text-center text-[12.5px] font-bold text-sv-blue-deep">
          {state.ok}
        </p>
      ) : null}

      <form action={action} className="space-y-3.5">
        <AuthInput
          label="ელფოსტა"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@email.com"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center rounded-full bg-sv-blue px-6 py-3.5 text-[14.5px] font-extrabold text-white shadow-glow-blue-sm transition hover:-translate-y-0.5 hover:bg-sv-blue-deep disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          {pending ? "იგზავნება…" : "ბმულის გაგზავნა"}
        </button>
      </form>
    </div>
  )
}
