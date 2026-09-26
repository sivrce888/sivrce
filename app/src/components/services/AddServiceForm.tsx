'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { createServiceListing } from '@/app/[lang]/add-service/actions'
import { formatPhone } from '@/lib/inquiries/phone'
import LocalizedLink from '@/components/LocalizedLink'
import { SERVICE_CATEGORIES, SERVICE_CITIES, pickLocText } from '@/lib/services'
import { useI18n } from '@/lib/i18n/context'
import { panelLang } from '@/lib/i18n/core'

const input =
  'w-full rounded-control border border-sv-ink/[0.08] bg-sv-cloud px-4 py-3.5 text-[15px] font-semibold text-sv-ink placeholder:text-sv-ink/35 outline-none transition focus:border-sv-blue focus:ring-4 focus:ring-sv-blue/10'
const label = 'mb-2 block text-[13px] font-extrabold text-sv-ink/70'

const L = {
  ka: {
    nameLabel: 'კომპანიის სახელი',
    namePh: 'მაგ. Atelier Frame',
    catLabel: 'კატეგორია',
    cityLabel: 'ქალაქი',
    phoneLabel: 'ტელეფონი',
    descLabel: 'აღწერა',
    descPh: 'რას აკეთებ, რომელი უბნები, რა პაკეტები?',
    priceFromLabel: 'ფასიდან (₾)',
    priceToLabel: 'ფასიმდე (₾)',
    webLabel: 'ვებგვერდი',
    publish: 'გამოქვეყნება',
    listingNotePrefix: 'განცხადება უძრავ ქონებაზე — ცალკე, უფასოდ,',
    listingNoteLink: 'დაამატე განცხადება',
  },
  en: {
    nameLabel: 'Company name',
    namePh: 'e.g. Atelier Frame',
    catLabel: 'Category',
    cityLabel: 'City',
    phoneLabel: 'Phone',
    descLabel: 'Description',
    descPh: 'What you do, which areas, what packages?',
    priceFromLabel: 'Price from (₾)',
    priceToLabel: 'Price up to (₾)',
    webLabel: 'Website',
    publish: 'Publish',
    listingNotePrefix: 'Property listings are separate and free —',
    listingNoteLink: 'add a listing',
  },
  de: {
    nameLabel: 'Firmenname',
    namePh: 'z. B. Atelier Frame',
    catLabel: 'Kategorie',
    cityLabel: 'Stadt',
    phoneLabel: 'Telefon',
    descLabel: 'Beschreibung',
    descPh: 'Was Sie machen, welche Viertel, welche Pakete?',
    priceFromLabel: 'Preis ab (₾)',
    priceToLabel: 'Preis bis (₾)',
    webLabel: 'Webseite',
    publish: 'Veröffentlichen',
    listingNotePrefix: 'Immobilienanzeigen sind separat und kostenlos —',
    listingNoteLink: 'Anzeige hinzufügen',
  },
} as const

/** City option values are data (submitted ka) — only the label is localized. */
const CITY_L10N: Record<string, { en: string; de: string }> = {
  'თბილისი': { en: 'Tbilisi', de: 'Tbilisi' },
  'ბათუმი': { en: 'Batumi', de: 'Batumi' },
  'ქუთაისი': { en: 'Kutaisi', de: 'Kutaisi' },
  'რუსთავი': { en: 'Rustavi', de: 'Rustavi' },
}

export function AddServiceForm() {
  const { lang } = useI18n()
  const loc = panelLang(lang)
  const T = L[loc]
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
            {T.nameLabel}
          </label>
          <input id="sv-name" name="name" required maxLength={160} className={input} placeholder={T.namePh} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="sv-cat" className={label}>
              {T.catLabel}
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
              {T.cityLabel}
            </label>
            <select id="sv-city" name="city" required className={input}>
              {SERVICE_CITIES.map((c) => (
                <option key={c} value={c}>
                  {loc === 'ka' ? c : CITY_L10N[c]?.[loc] ?? c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="sv-phone" className={label}>
            {T.phoneLabel}
          </label>
          <input
            id="sv-phone"
            name="phone"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="+995 500 333 111"
            className={input}
            onChange={(e) => {
              e.currentTarget.value = formatPhone(e.currentTarget.value)
            }}
          />
        </div>
        <div>
          <label htmlFor="sv-desc" className={label}>
            {T.descLabel}
          </label>
          <textarea
            id="sv-desc"
            name="description"
            required
            minLength={40}
            maxLength={2000}
            rows={5}
            placeholder={T.descPh}
            className={`${input} resize-none`}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="sv-min" className={label}>
              {T.priceFromLabel}
            </label>
            <input id="sv-min" name="priceMin" type="number" min={0} max={999999} className={input} />
          </div>
          <div>
            <label htmlFor="sv-max" className={label}>
              {T.priceToLabel}
            </label>
            <input id="sv-max" name="priceMax" type="number" min={0} max={999999} className={input} />
          </div>
        </div>
        <div>
          <label htmlFor="sv-web" className={label}>
            {T.webLabel}
          </label>
          <input id="sv-web" name="website" type="url" maxLength={240} placeholder="https://" className={input} />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-sv-orange px-6 py-3.5 text-[15px] font-extrabold text-sv-ink shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {T.publish}
        </button>
        <p className="text-[12px] font-semibold text-sv-ink/60">
          {T.listingNotePrefix}{' '}
          <LocalizedLink href="/add-listing" className="font-extrabold text-sv-blue">
            {T.listingNoteLink}
          </LocalizedLink>
          .
        </p>
      </div>
    </form>
  )
}
