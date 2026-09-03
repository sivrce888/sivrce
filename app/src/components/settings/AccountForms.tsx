"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { KeyRound, LogOut, Trash2, User } from "lucide-react"

import { signOutToHome } from "@/app/auth/actions"
import {
  changePassword,
  deleteAccount,
  updateProfile,
  type AccountActionState,
} from "@/app/[lang]/settings/actions"
import { AuthInput } from "@/components/auth/AuthInput"
import { DELETE_CONFIRM } from "@/lib/account-profile"

function Flash({ state }: { state: AccountActionState }) {
  if (!state?.error && !state?.ok) return null
  return (
    <p
      role={state.error ? "alert" : "status"}
      className={`mt-4 rounded-module px-3.5 py-2.5 text-center text-[12.5px] font-bold ${
        state.error
          ? "bg-sv-orange-deep/10 text-sv-orange-deep"
          : "bg-sv-blue/10 text-sv-blue-deep"
      }`}
    >
      {state.error ?? state.ok}
    </p>
  )
}

export function AccountForms({
  name,
  email,
  phone,
  hasPassword,
  isPhoneAccount,
}: {
  name: string
  email: string
  phone: string
  hasPassword: boolean
  isPhoneAccount: boolean
}) {
  const router = useRouter()
  const [profile, saveProfile, savingProfile] = useActionState<AccountActionState, FormData>(
    updateProfile,
    undefined,
  )
  const [pw, savePw, savingPw] = useActionState<AccountActionState, FormData>(
    changePassword,
    undefined,
  )
  const [gone, remove, removing] = useActionState<AccountActionState, FormData>(
    deleteAccount,
    undefined,
  )

  useEffect(() => {
    if (profile?.ok || pw?.ok) router.refresh()
  }, [profile, pw, router])

  return (
    <>
      <section
        id="profile"
        className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-blue/10 text-sv-blue">
            <User size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-extrabold text-sv-ink">პირადი მონაცემები</h2>
            <p className="mt-1 text-[13px] font-medium text-sv-ink/55">
              სახელი და ტელეფონი — ასე დაგიკავშირდებიან.
            </p>
          </div>
        </div>

        <form action={saveProfile} className="mt-5 grid gap-4">
          <AuthInput
            label="სახელი და გვარი"
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={160}
            defaultValue={name}
          />
          <AuthInput
            label="მობილური"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            required={isPhoneAccount}
            defaultValue={phone}
            placeholder="+995 555 12 34 56"
          />
          {!isPhoneAccount ? (
            <p className="text-[12.5px] font-semibold text-sv-ink/45">
              ელფოსტა · {email}
            </p>
          ) : null}
          <Flash state={profile} />
          <button
            type="submit"
            disabled={savingProfile}
            className="mt-1 inline-flex w-fit rounded-full bg-sv-orange px-6 py-2.5 text-[13px] font-bold text-white shadow-glow-orange transition hover:opacity-95 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
          >
            {savingProfile ? "ინახება…" : "შენახვა"}
          </button>
        </form>
      </section>

      <section
        id="password"
        className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-blue/10 text-sv-blue">
            <KeyRound size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-extrabold text-sv-ink">
              {hasPassword ? "პაროლის შეცვლა" : "პაროლის დაყენება"}
            </h2>
            <p className="mt-1 text-[13px] font-medium text-sv-ink/55">
              {hasPassword
                ? "მინიმუმ 8 სიმბოლო. ახლანდელი პაროლი სავალდებულოა."
                : "დაამატე პაროლი ელფოსტით შესვლისთვის."}
            </p>
          </div>
        </div>

        <form action={savePw} className="mt-5 grid gap-4">
          {hasPassword ? (
            <AuthInput
              label="ახლანდელი პაროლი"
              name="current"
              type="password"
              autoComplete="current-password"
              required
            />
          ) : null}
          <AuthInput
            label="ახალი პაროლი"
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
          />
          <Flash state={pw} />
          <button
            type="submit"
            disabled={savingPw}
            className="mt-1 inline-flex w-fit rounded-full bg-sv-blue px-6 py-2.5 text-[13px] font-bold text-white transition hover:bg-sv-blue-deep disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
          >
            {savingPw ? "ინახება…" : hasPassword ? "პაროლის შეცვლა" : "პაროლის დაყენება"}
          </button>
        </form>
      </section>

      <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-blue/10 text-sv-blue">
            <LogOut size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-extrabold text-sv-ink">სესია</h2>
            <p className="mt-1 text-[13px] font-medium text-sv-ink/55">
              გამოხვიდე ამ მოწყობილობიდან. ფავორიტები ამ ბრაუზერში რჩება.
            </p>
            <form action={signOutToHome} className="mt-4">
              <button
                type="submit"
                className="rounded-full border border-sv-ink/12 px-5 py-2.5 text-[13px] font-bold text-sv-ink/70 transition hover:border-sv-blue hover:text-sv-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
              >
                გასვლა
              </button>
            </form>
          </div>
        </div>
      </section>

      <section
        id="delete"
        className="rounded-card border border-sv-orange-deep/15 bg-sv-surface p-6 shadow-card"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-orange-deep/10 text-sv-orange-deep">
            <Trash2 size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-extrabold text-sv-ink">ანგარიშის წაშლა</h2>
            <p className="mt-1 text-[13px] font-medium text-sv-ink/55">
              განცხადებები მოიხსნება. ეს მოქმედება შეუქცევადია.
            </p>
          </div>
        </div>

        <form action={remove} className="mt-5 grid gap-4">
          <AuthInput
            label={`ჩაწერე „${DELETE_CONFIRM}"`}
            name="confirm"
            autoComplete="off"
            required
            placeholder={DELETE_CONFIRM}
          />
          {hasPassword ? (
            <AuthInput
              label="პაროლი"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          ) : null}
          <Flash state={gone} />
          <button
            type="submit"
            disabled={removing}
            className="inline-flex w-fit rounded-full border border-sv-orange-deep/30 px-5 py-2.5 text-[13px] font-bold text-sv-orange-deep transition hover:bg-sv-orange-deep/8 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
          >
            {removing ? "იშლება…" : "ანგარიშის წაშლა"}
          </button>
        </form>
      </section>
    </>
  )
}
