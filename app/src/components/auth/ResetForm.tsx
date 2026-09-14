"use client"

import { useActionState } from "react"

import {
  resetPassword,
  type AuthActionState,
} from "@/app/auth/actions"
import { AuthInput } from "@/components/auth/AuthInput"
import type { AuthStrings } from "@/components/auth/i18n"

export function ResetForm({ email, token, s }: { email: string; token: string; s: AuthStrings }) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    resetPassword,
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
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="token" value={token} />
        <AuthInput
          label={s.newPassword}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder={s.minChars}
        />
        <AuthInput
          label={s.confirmLabel}
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center rounded-full bg-sv-orange px-6 py-3.5 text-[14.5px] font-extrabold text-sv-ink shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          {pending ? s.saving : s.changePassword}
        </button>
      </form>
    </div>
  )
}
