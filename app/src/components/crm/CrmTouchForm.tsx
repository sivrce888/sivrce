import { ACTIVITY_TYPES } from "@/lib/admin/crm"
import { FOLLOW_UP_PRESETS, followUpInputValue, followUpState } from "@/lib/crm-follow-up"
import { panelLang } from "@/lib/i18n/core"

const L = {
  ka: {
    types: { call: "ზარი", email: "ელფოსტა", sms: "SMS", meeting: "შეხვედრა", viewing: "ნახვა", note: "შენიშვნა" },
    typeAria: "კონტაქტის ტიპი",
    notes: "რა მოხდა? (არასავალდებულო)",
    next: "შემდეგი კონტაქტი",
    presets: ["დღეს", "ხვალ", "3 დღეში", "1 კვირაში", "2 კვირაში"],
    date: "ან თარიღი",
    save: "შენახვა",
  },
  en: {
    types: { call: "Call", email: "Email", sms: "SMS", meeting: "Meeting", viewing: "Viewing", note: "Note" },
    typeAria: "Contact type",
    notes: "What happened? (optional)",
    next: "Next follow-up",
    presets: ["Today", "Tomorrow", "In 3 days", "In 1 week", "In 2 weeks"],
    date: "Or pick a date",
    save: "Save",
  },
  de: {
    types: { call: "Anruf", email: "E-Mail", sms: "SMS", meeting: "Treffen", viewing: "Besichtigung", note: "Notiz" },
    typeAria: "Kontaktart",
    notes: "Was ist passiert? (optional)",
    next: "Nächster Kontakt",
    presets: ["Heute", "Morgen", "In 3 Tagen", "In 1 Woche", "In 2 Wochen"],
    date: "Oder Datum wählen",
    save: "Speichern",
  },
} as const

const field =
  "h-10 rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 text-[13.5px] text-sv-ink outline-none placeholder:text-sv-ink/40 focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25"
const chip =
  "h-9 rounded-full border border-sv-ink/12 bg-white px-3.5 text-[12.5px] font-bold text-sv-ink/80 transition-colors hover:border-sv-blue hover:text-sv-blue-deep focus-visible:outline-2 focus-visible:outline-sv-blue"

/**
 * The CRM's core loop in one zero-JS form: log what happened, book the next
 * touch. Preset chips are submit buttons, so "called, try again tomorrow" is
 * one tap. Save comes first in DOM order so Enter never picks a preset.
 * Only a future follow-up is prefilled — a due one is resolved by
 * the touch unless a new date is chosen.
 */
export function CrmTouchForm({
  action,
  leadId,
  nextFollowUp,
  lang,
}: {
  action: (fd: FormData) => Promise<void>
  leadId: string
  nextFollowUp: Date | null
  lang: string
}) {
  const t = L[panelLang(lang)]
  const keep = followUpState(nextFollowUp) === "upcoming" ? followUpInputValue(nextFollowUp) : ""
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <select name="type" defaultValue="call" aria-label={t.typeAria} className={field}>
        {ACTIVITY_TYPES.map((type) => (
          <option key={type} value={type}>
            {t.types[type]}
          </option>
        ))}
      </select>
      <textarea
        name="notes"
        rows={2}
        maxLength={2000}
        aria-label={t.notes}
        placeholder={t.notes}
        className={`${field} h-auto w-full py-2.5 leading-relaxed`}
      />
      <fieldset>
        <legend className="mb-2 text-[11px] font-bold tracking-[0.08em] text-sv-ink/60 uppercase">
          {t.next}
        </legend>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            name="followUpDate"
            defaultValue={keep}
            min={followUpInputValue(new Date())}
            aria-label={t.date}
            className={field}
          />
          <button
            type="submit"
            className="h-10 rounded-[var(--radius-control)] bg-sv-blue px-4 text-[13px] font-bold text-white transition-colors hover:bg-sv-blue-deep"
          >
            {t.save}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {FOLLOW_UP_PRESETS.map((days, i) => (
            <button key={days} type="submit" name="followUpDays" value={days} className={chip}>
              {t.presets[i]}
            </button>
          ))}
        </div>
      </fieldset>
    </form>
  )
}
