'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { createServiceListing } from '@/app/[lang]/add-service/actions'
import { formatPhone } from '@/lib/inquiries/phone'
import LocalizedLink from '@/components/LocalizedLink'
import { SERVICE_CATEGORIES, SERVICE_CITIES, pickLocText } from '@/lib/services'
import { useI18n } from '@/lib/i18n/context'

const input =
  'w-full rounded-control border border-sv-ink/[0.08] bg-sv-cloud px-4 py-3.5 text-[15px] font-semibold text-sv-ink placeholder:text-sv-ink/35 outline-none transition-all focus:border-sv-blue focus:ring-4 focus:ring-sv-blue/10'
const label = 'mb-2 block text-[13px] font-extrabold text-sv-ink/70'

export function AddServiceForm() {
  const { lang } = useI18n()
  const [state, action, pending] = useActionState(createServiceListing, { error: null })

  return (
    <form action={action} className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-8">
      {state.error && (
        <p role="alert" className="mb-5 rounded-control bg-sv-orange/10 px-4 py-3 text-[14px] font-bold text-sv-orange">
          {state.error}
        </p>
      )}
      <div className="grid gap-5">
        <div>
          <label htmlFor="sv-name" className={label}>
            კომპანიის სახელი
          </label>
          <input id="sv-name" name="name" required maxLength={160} className={input} placeholder="მაგ. Atelier Frame" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="sv-cat" className={label}>
              კატეგორია
            </label>
            <select id="sv-cat" name="category" required className={input}>
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {pickLocText(c.name, lang)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sv-city" className={label}>
              ქალაქი
            </label>
            <select id="sv-city" name="city" required className={input}>
              {SERVICE_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="sv-phone" className={label}>
            ტელეფონი
          </label>
          <input
            id="sv-phone"
            name="phone"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="+995 555 12 34 56"
            className={input}
            onChange={(e) => {
              e.currentTarget.value = formatPhone(e.currentTarget.value)
            }}
          />
        </div>
        <div>
          <label htmlFor="sv-desc" className={label}>
            აღწერა
          </label>
          <textarea
            id="sv-desc"
            name="description"
            required
            minLength={40}
            maxLength={2000}
            rows={5}
            placeholder="რას აკეთებთ, რომელი უბნები, რა პაკეტები."
            className={`${input} resize-none`}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="sv-min" className={label}>
              ფასი დან (₾)
            </label>
            <input id="sv-min" name="priceMin" type="number" min={0} max={999999} className={input} />
          </div>
          <div>
            <label htmlFor="sv-max" className={label}>
              ფასი მდე (₾)
            </label>
            <input id="sv-max" name="priceMax" type="number" min={0} max={999999} className={input} />
          </div>
        </div>
        <div>
          <label htmlFor="sv-web" className={label}>
            ვებსაიტი
          </label>
          <input id="sv-web" name="website" type="url" maxLength={240} placeholder="https://" className={input} />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-sv-orange px-6 py-3.5 text-[15px] font-extrabold text-white shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          გამოქვეყნება
        </button>
        <p className="text-[12px] font-semibold text-sv-ink/45">
          განცხადება ქონებაზე — ცალკე, უფასოდ,{' '}
          <LocalizedLink href="/add-listing" className="font-extrabold text-sv-blue">
            დაამატე განცხადება
          </LocalizedLink>
          .
        </p>
      </div>
    </form>
  )
}
