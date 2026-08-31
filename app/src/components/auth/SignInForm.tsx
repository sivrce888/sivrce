"use client"

import { useActionState } from "react"
import Link from "next/link"

import {
  signInWithEmail,
  type AuthActionState,
} from "@/app/auth/actions"
import { AuthInput } from "@/components/auth/AuthInput"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { PasskeyButton } from "@/components/auth/PasskeyButton"
import { PhoneAuthForm } from "@/components/auth/PhoneAuthForm"

export function SignInForm({
  callbackUrl,
  googleEnabled,
}: {
  callbackUrl: string
  googleEnabled: boolean
}) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    signInWithEmail,
    undefined,
  )

  return (
    <div className="space-y-5">
      <PasskeyButton callbackUrl={callbackUrl} />
      <div className="relative py-1 text-center">
        <span className="absolute inset-x-0 top-1/2 h-px bg-sv-ink/8" />
        <span className="relative bg-sv-surface px-3 text-[12px] font-bold uppercase tracking-wide text-sv-ink/35">
          ან
        </span>
      </div>
      <PhoneAuthForm callbackUrl={callbackUrl} submitLabel="შესვლა">
        {googleEnabled ? (
          <>
            <div className="relative py-1 text-center">
              <span className="absolute inset-x-0 top-1/2 h-px bg-sv-ink/8" />
              <span className="relative bg-sv-surface px-3 text-[12px] font-bold uppercase tracking-wide text-sv-ink/35">
                ან
              </span>
            </div>
            <GoogleSignInButton redirectTo={callbackUrl} label="Google-ით შესვლა" />
          </>
        ) : null}

        <details className="group">
          <summary className="cursor-pointer list-none text-center text-[12.5px] font-bold text-sv-ink/40 transition hover:text-sv-ink/65 [&::-webkit-details-marker]:hidden">
            ელფოსტით შესვლა
          </summary>
          <div className="mt-4 space-y-3.5">
            {state?.error ? (
              <p role="alert" className="rounded-module bg-sv-orange-deep/10 px-3.5 py-2.5 text-center text-[12.5px] font-bold text-sv-orange-deep">
                {state.error}
              </p>
            ) : null}
            <form action={action} className="space-y-3.5">
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              <AuthInput
                label="ელფოსტა"
                name="email"
                type="email"
                autoComplete="username webauthn"
                required
                placeholder="you@email.com"
              />
              <AuthInput
                label="პაროლი"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
              />
              <div className="flex justify-end">
                <Link
                  href="/auth/forgot"
                  className="text-[12.5px] font-bold text-sv-blue hover:underline"
                >
                  პაროლის აღდგენა
                </Link>
              </div>
              <button
                type="submit"
                disabled={pending}
                className="flex w-full items-center justify-center rounded-full border border-sv-ink/10 bg-sv-cloud px-6 py-3.5 text-[14.5px] font-extrabold text-sv-ink transition hover:-translate-y-0.5 hover:border-sv-ink/20 hover:bg-sv-surface hover:shadow-soft disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                {pending ? "იტვირთება…" : "შესვლა ელფოსტით"}
              </button>
            </form>
          </div>
        </details>
      </PhoneAuthForm>
    </div>
  )
}
