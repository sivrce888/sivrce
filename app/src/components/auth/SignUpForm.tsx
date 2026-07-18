"use client"

import { useActionState } from "react"

import {
  registerWithEmail,
  type AuthActionState,
} from "@/app/auth/actions"
import { AuthInput } from "@/components/auth/AuthInput"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"

export function SignUpForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    registerWithEmail,
    undefined,
  )

  return (
    <div className="space-y-5">
      {state?.error ? (
        <p className="rounded-module bg-sv-orange-deep/10 px-3.5 py-2.5 text-center text-[12.5px] font-bold text-sv-orange-deep">
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
          className="mt-1 flex w-full items-center justify-center rounded-full bg-sv-orange px-6 py-3.5 text-[14.5px] font-extrabold text-white shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          {pending ? "იტვირთება…" : "ანგარიშის შექმნა"}
        </button>
      </form>

      {googleEnabled ? (
        <>
          <div className="relative py-1 text-center">
            <span className="absolute inset-x-0 top-1/2 h-px bg-sv-ink/8" />
            <span className="relative bg-sv-surface px-3 text-[12px] font-bold uppercase tracking-wide text-sv-ink/35">
              ან
            </span>
          </div>
          <GoogleSignInButton redirectTo="/auth/onboarding" label="Google-ით რეგისტრაცია" />
        </>
      ) : null}

      <ul className="space-y-1.5 text-[12px] font-medium text-sv-ink/45">
        <li>როლს ირჩევ რეგისტრაციის შემდეგ — მყიდველი, გამყიდველი, აგენტი…</li>
        <li>პაროლი ინახება დაშიფრულად · Google ერთი დაწკაპუნებით</li>
      </ul>
    </div>
  )
}
