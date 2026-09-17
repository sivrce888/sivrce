"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Download, KeyRound, LogOut, Trash2, User } from "lucide-react"

import { signOutToHome } from "@/app/auth/actions"
import {
  changePassword,
  deleteAccount,
  updateProfile,
  type AccountActionState,
} from "@/app/[lang]/settings/actions"
import { AuthInput } from "@/components/auth/AuthInput"
import { DELETE_CONFIRM } from "@/lib/account-profile"
import { useI18n } from "@/lib/i18n/context"

const L = {
  ka: {
    personalTitle: "პირადი მონაცემები",
    personalDesc: "სახელი და ტელეფონი — ასე დაგიკავშირდებიან.",
    fullName: "სახელი და გვარი",
    mobile: "მობილური",
    emailLine: (email: string) => `ელფოსტა · ${email}`,
    saving: "ინახება…",
    save: "შენახვა",
    pwChange: "პაროლის შეცვლა",
    pwSet: "პაროლის დაყენება",
    pwChangeDesc: "მინიმუმ 8 სიმბოლო. ახლანდელი პაროლი სავალდებულოა.",
    pwSetDesc: "დაამატე პაროლი ელფოსტით შესვლისთვის.",
    currentPw: "ახლანდელი პაროლი",
    newPw: "ახალი პაროლი",
    minChars: "მინ. 8 სიმბოლო",
    repeatPw: "გაიმეორე პაროლი",
    session: "სესია",
    sessionDesc: "გამოხვიდე ამ მოწყობილობიდან. ფავორიტები ამ ბრაუზერში რჩება.",
    signOut: "გასვლა",
    myData: "ჩემი მონაცემები",
    exportDesc:
      "ჩამოტვირთე ყველაფერი, რაც sivrce-ს შენზე აქვს — პროფილი, განცხადებები, ფავორიტები, ძიებები, ჯავშნები, შეტყობინებები (JSON). პაროლები და სხვა ადამიანების მონაცემები არ შედის.",
    download: "ჩამოტვირთვა",
    deleteTitle: "ანგარიშის წაშლა",
    deleteDesc: "განცხადებები მოიხსნება. ეს მოქმედება შეუქცევადია.",
    confirmLabel: (word: string) => `ჩაწერე „${word}"`,
    password: "პაროლი",
    deleting: "იშლება…",
  },
  en: {
    personalTitle: "Personal details",
    personalDesc: "Your name and phone — this is how people reach you.",
    fullName: "Full name",
    mobile: "Mobile",
    emailLine: (email: string) => `Email · ${email}`,
    saving: "Saving…",
    save: "Save",
    pwChange: "Change password",
    pwSet: "Set password",
    pwChangeDesc: "At least 8 characters. Your current password is required.",
    pwSetDesc: "Add a password to sign in with email.",
    currentPw: "Current password",
    newPw: "New password",
    minChars: "Min. 8 characters",
    repeatPw: "Repeat password",
    session: "Session",
    sessionDesc: "Sign out of this device. Favorites stay in this browser.",
    signOut: "Sign out",
    myData: "My data",
    exportDesc:
      "Download everything Sivrce holds about you — profile, listings, favorites, searches, bookings, notifications (JSON). Passwords and other people’s data are not included.",
    download: "Download",
    deleteTitle: "Delete account",
    deleteDesc: "Your listings will be removed. This action cannot be undone.",
    confirmLabel: (word: string) => `Type "${word}"`,
    password: "Password",
    deleting: "Deleting…",
  },
  de: {
    personalTitle: "Persönliche Daten",
    personalDesc: "Name und Telefonnummer – so werden Sie kontaktiert.",
    fullName: "Vor- und Nachname",
    mobile: "Mobilnummer",
    emailLine: (email: string) => `E-Mail · ${email}`,
    saving: "Speichern…",
    save: "Speichern",
    pwChange: "Passwort ändern",
    pwSet: "Passwort festlegen",
    pwChangeDesc: "Mindestens 8 Zeichen. Das aktuelle Passwort ist erforderlich.",
    pwSetDesc: "Fügen Sie ein Passwort hinzu, um sich per E-Mail anzumelden.",
    currentPw: "Aktuelles Passwort",
    newPw: "Neues Passwort",
    minChars: "Min. 8 Zeichen",
    repeatPw: "Passwort wiederholen",
    session: "Sitzung",
    sessionDesc:
      "Melden Sie sich auf diesem Gerät ab. Favoriten bleiben in diesem Browser gespeichert.",
    signOut: "Abmelden",
    myData: "Meine Daten",
    exportDesc:
      "Laden Sie alles herunter, was Sivrce über Sie speichert – Profil, Inserate, Favoriten, Suchanfragen, Buchungen, Benachrichtigungen (JSON). Passwörter und Daten anderer Personen sind nicht enthalten.",
    download: "Herunterladen",
    deleteTitle: "Konto löschen",
    deleteDesc: "Ihre Inserate werden entfernt. Diese Aktion kann nicht rückgängig gemacht werden.",
    confirmLabel: (word: string) => `„${word}" eingeben`,
    password: "Passwort",
    deleting: "Wird gelöscht…",
  },
} as const

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
  const { update } = useSession()
  const { lang } = useI18n()
  const loc = lang === "en" ? "en" : lang === "de" ? "de" : "ka"
  const t = L[loc]
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
    if (profile?.ok) void update()
    if (profile?.ok || pw?.ok) router.refresh()
  }, [profile, pw, router, update])

  return (
    <>
      <section
        id="profile"
        className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-blue/10 text-sv-blue-deep">
            <User size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-extrabold text-sv-ink">{t.personalTitle}</h2>
            <p className="mt-1 text-[13px] font-medium text-sv-ink/60">{t.personalDesc}</p>
          </div>
        </div>

        <form action={saveProfile} className="mt-5 grid gap-4">
          <AuthInput
            label={t.fullName}
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={160}
            defaultValue={name}
          />
          <AuthInput
            label={t.mobile}
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            required={isPhoneAccount}
            defaultValue={phone}
            placeholder="+995 555 12 34 56"
          />
          {!isPhoneAccount ? (
            <p className="text-[12.5px] font-semibold text-sv-ink/60">{t.emailLine(email)}</p>
          ) : null}
          <Flash state={profile} />
          <button
            type="submit"
            disabled={savingProfile}
            className="mt-1 inline-flex w-fit rounded-full bg-sv-orange px-6 py-2.5 text-[13px] font-bold text-sv-ink shadow-glow-orange transition hover:opacity-95 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
          >
            {savingProfile ? t.saving : t.save}
          </button>
        </form>
      </section>

      <section
        id="password"
        className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-blue/10 text-sv-blue-deep">
            <KeyRound size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-extrabold text-sv-ink">
              {hasPassword ? t.pwChange : t.pwSet}
            </h2>
            <p className="mt-1 text-[13px] font-medium text-sv-ink/60">
              {hasPassword ? t.pwChangeDesc : t.pwSetDesc}
            </p>
          </div>
        </div>

        <form action={savePw} className="mt-5 grid gap-4">
          {hasPassword ? (
            <AuthInput
              label={t.currentPw}
              name="current"
              type="password"
              autoComplete="current-password"
              required
            />
          ) : null}
          <AuthInput
            label={t.newPw}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder={t.minChars}
          />
          <AuthInput
            label={t.repeatPw}
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
            {savingPw ? t.saving : hasPassword ? t.pwChange : t.pwSet}
          </button>
        </form>
      </section>

      <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-blue/10 text-sv-blue-deep">
            <LogOut size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-extrabold text-sv-ink">{t.session}</h2>
            <p className="mt-1 text-[13px] font-medium text-sv-ink/60">{t.sessionDesc}</p>
            <form action={signOutToHome} className="mt-4">
              <button
                type="submit"
                className="rounded-full border border-sv-ink/12 px-5 py-2.5 text-[13px] font-bold text-sv-ink/70 transition hover:border-sv-blue hover:text-sv-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
              >
                {t.signOut}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-blue/10 text-sv-blue-deep">
            <Download size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-extrabold text-sv-ink">{t.myData}</h2>
            <p className="mt-1 text-[13px] font-medium text-sv-ink/60">{t.exportDesc}</p>
            {/* GDPR Art. 15/20: the export must be one click, not a support ticket. */}
            <a
              href="/api/account/export"
              download
              className="mt-4 inline-block rounded-full border border-sv-ink/12 px-5 py-2.5 text-[13px] font-bold text-sv-ink/70 transition hover:border-sv-blue hover:text-sv-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
            >
              {t.download}
            </a>
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
            <h2 className="text-[15px] font-extrabold text-sv-ink">{t.deleteTitle}</h2>
            <p className="mt-1 text-[13px] font-medium text-sv-ink/60">{t.deleteDesc}</p>
          </div>
        </div>

        <form action={remove} className="mt-5 grid gap-4">
          <AuthInput
            label={t.confirmLabel(DELETE_CONFIRM)}
            name="confirm"
            autoComplete="off"
            required
            placeholder={DELETE_CONFIRM}
          />
          {hasPassword ? (
            <AuthInput
              label={t.password}
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
            {removing ? t.deleting : t.deleteTitle}
          </button>
        </form>
      </section>
    </>
  )
}
