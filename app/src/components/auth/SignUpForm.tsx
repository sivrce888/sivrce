"use client"

import { useActionState } from "react"

import {
  registerWithEmail,
  type AuthActionState,
} from "@/app/auth/actions"
import { AuthInput } from "@/components/auth/AuthInput"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { PasskeyButton } from "@/components/auth/PasskeyButton"
import { PhoneAuthForm } from "@/components/auth/PhoneAuthForm"

export function SignUpForm({
  googleEnabled,
  callbackUrl = "/",
}: {
  googleEnabled: boolean
  callbackUrl?: string
}) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    registerWithEmail,
    undefined,
  )

  return (
    <div className="space-y-5">
      <PhoneAuthForm callbackUrl={callbackUrl} submitLabel="გაგრძელება">
        <div className="relative py-1 text-center">
          <span className="absolute inset-x-0 top-1/2 h-px bg-sv-ink/8" />
          <span className="relative bg-sv-surface px-3 text-[12px] font-bold uppercase tracking-wide text-sv-ink/35">
            ან
          </span>
        </div>
        <PasskeyButton callbackUrl={callbackUrl} />
        {googleEnabled ? (
          <GoogleSignInButton redirectTo={callbackUrl} label="Google-ით რეგისტრაცია" />
        ) : null}

        <details className="group">
          <summary className="cursor-pointer list-none text-center text-[12.5px] font-bold text-sv-ink/40 transition hover:text-sv-ink/65 [&::-webkit-details-marker]:hidden">
            ელფოსტით რეგისტრაცია
          </summary>
          <div className="mt-4 space-y-3.5">
            {state?.error ? (
              <p role="alert" className="rounded-module bg-sv-orange-deep/10 px-3.5 py-2.5 text-center text-[12.5px] font-bold text-sv-orange-deep">
                {state.error}
              </p>
            ) : null}
            <form action={action} className="space-y-3.5">
              <AuthInput
                label="სახელი"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="შენი სახელი"
              />
              <AuthInput
                label="ელფოსტა"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@email.com"
              />
              <AuthInput
                label="პაროლი"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="მინ. 8 სიმბოლო"
              />
              <AuthInput
                label="გაიმეორე პაროლი"
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
                className="flex w-full items-center justify-center rounded-full bg-sv-orange px-6 py-3.5 text-[14.5px] font-extrabold text-white shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                {pending ? "იტვირთება…" : "ანგარიშის შექმნა"}
              </button>
            </form>
          </div>
        </details>
      </PhoneAuthForm>

      <p className="text-[12px] font-medium leading-relaxed text-sv-ink/45">
        ანგარიში იწყება როგორც მყიდველი. განცხადების დამატებისას ავტომატურად გახდები
        გამყიდველი. აგენტი / სააგენტო / დეველოპერი — პარამეტრებში.
      </p>
    </div>
  )
}
