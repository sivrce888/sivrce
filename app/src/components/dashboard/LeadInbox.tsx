import LocalizedLink from "@/components/LocalizedLink"
import { MessageCircle, Phone } from "lucide-react"

import { LEAD_STATUS_ORDER, leadStatusLabels } from "@/components/agency-dashboard/nav"
import { setCrmClientStatus, setProLeadStatus } from "@/components/dashboard/lead-actions"
import { db } from "@/lib/db"
import { safeQuery } from "@/lib/guards"
import { INQUIRY_STATUSES, isInquiryStatus, leadWaText } from "@/lib/pro-leads"
import { inquiryStatusLabel } from "@/components/agent-dashboard/format"
import { telHref, waHref } from "@/lib/inquiries/phone"
import { panelLang } from "@/lib/i18n/core"

export type InboxLead = {
  id: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string | null
  message: string
  status: string
  listingId: string
  city: string
  district: string
  createdAt: Date
}

const L = {
  ka: {
    call: "ზარი",
    email: "ელფოსტა",
    statusAria: "ლიდის სტატუსი",
    save: "შენახვა",
    empty: "ცარიელი",
    dateFmt: new Intl.DateTimeFormat("ka-GE", { dateStyle: "medium", timeStyle: "short" }),
  },
  en: {
    call: "Call",
    email: "Email",
    statusAria: "Lead status",
    save: "Save",
    empty: "Empty",
    dateFmt: new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }),
  },
  de: {
    call: "Anrufen",
    email: "E-Mail",
    statusAria: "Lead-Status",
    save: "Speichern",
    empty: "Leer",
    dateFmt: new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }),
  },
} as const

function LeadCard({
  lead,
  title,
  t,
  statusLabel,
}: {
  lead: InboxLead
  title: string | undefined
  t: (typeof L)[keyof typeof L]
  statusLabel: Record<string, string>
}) {
  const phone = lead.buyerPhone?.trim() || null
  const wa = phone ? waHref(phone, leadWaText(lead.buyerName, title)) : null

  return (
    <article className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-extrabold tracking-[-0.02em] text-sv-ink">{lead.buyerName}</p>
          {title ? (
            <LocalizedLink
              href={`/listing/${lead.listingId}`}
              className="mt-0.5 block truncate text-[12.5px] font-semibold text-sv-blue hover:underline"
            >
              {title}
            </LocalizedLink>
          ) : null}
          <p className="mt-1 text-[12px] font-medium text-sv-ink/60">
            {[lead.district, lead.city].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span className="rounded-full bg-sv-blue/10 px-2.5 py-1 text-[11px] font-bold text-sv-blue-deep">
          {statusLabel[lead.status] ?? lead.status}
        </span>
      </div>

      {lead.message ? (
        <p className="mt-3 line-clamp-2 text-[13px] font-medium leading-relaxed text-sv-ink/70">
          {lead.message}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {phone ? (
          <a
            href={telHref(phone)}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-sv-orange px-4 text-[13px] font-bold text-sv-ink shadow-glow-orange transition hover:opacity-95"
          >
            <Phone size={14} strokeWidth={2.4} />
            {t.call}
          </a>
        ) : null}
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-sv-blue px-4 text-[13px] font-bold text-white transition hover:bg-sv-blue-deep"
          >
            <MessageCircle size={14} strokeWidth={2.4} />
            WhatsApp
          </a>
        ) : null}
        {lead.buyerEmail ? (
          <a
            href={`mailto:${lead.buyerEmail}`}
            className="inline-flex h-10 items-center rounded-full border border-sv-ink/12 px-4 text-[12.5px] font-bold text-sv-ink/70 transition hover:border-sv-blue hover:text-sv-blue"
          >
            {t.email}
          </a>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-sv-ink/6 pt-3">
        <p className="text-[11.5px] font-semibold text-sv-ink/60">{t.dateFmt.format(lead.createdAt)}</p>
        <form action={setProLeadStatus} className="flex items-center gap-2">
          <input type="hidden" name="id" value={lead.id} />
          <select
            name="status"
            defaultValue={isInquiryStatus(lead.status) ? lead.status : "new"}
            aria-label={t.statusAria}
            className="h-9 rounded-full border border-sv-ink/12 bg-sv-cloud/40 px-3 text-[12px] font-bold text-sv-ink outline-none focus:border-sv-blue"
          >
            {INQUIRY_STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabel[value]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-sv-navy px-3.5 py-1.5 text-[12px] font-bold text-white transition hover:opacity-90"
          >
            {t.save}
          </button>
        </form>
      </div>
    </article>
  )
}

export default function LeadInbox({
  leads,
  titles,
  layout = "list",
  lang = "ka",
}: {
  leads: InboxLead[]
  titles: Record<string, string>
  layout?: "list" | "board"
  lang?: string
}) {
  const t = L[panelLang(lang)]
  const statusLabel = inquiryStatusLabel(lang)

  if (layout === "board") {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {INQUIRY_STATUSES.map((status) => {
          const bucket = leads.filter((l) => l.status === status)
          return (
            <section
              key={status}
              className="w-[min(100%,20rem)] shrink-0 rounded-card border border-sv-ink/[0.06] bg-sv-cloud/50 p-3"
            >
              <header className="flex items-center justify-between px-1 pb-2">
                <h2 className="text-[12px] font-extrabold uppercase tracking-wide text-sv-ink/60">
                  {statusLabel[status]}
                </h2>
                <span className="rounded-full bg-sv-ink/6 px-2 py-0.5 text-[11px] font-black tabular-nums text-sv-ink/60">
                  {bucket.length}
                </span>
              </header>
              <div className="flex flex-col gap-2">
                {bucket.length === 0 ? (
                  <p className="rounded-control border border-dashed border-sv-ink/10 px-3 py-6 text-center text-[11.5px] font-medium text-sv-ink/35">
                    {t.empty}
                  </p>
                ) : (
                  bucket.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} title={titles[lead.listingId]} t={t} statusLabel={statusLabel} />
                  ))
                )}
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} title={titles[lead.listingId]} t={t} statusLabel={statusLabel} />
      ))}
    </div>
  )
}

const CLIENT_L = {
  ka: {
    h2: "ჩემი კლიენტები",
    hint: "Sivrce-ის გუნდის მიერ თქვენზე გადმოცემული კლიენტები.",
    call: "ზარი",
    followUp: "შემდეგი კონტაქტი",
    statusAria: "კლიენტის სტატუსი",
    save: "შენახვა",
    locale: "ka-GE",
  },
  en: {
    h2: "My clients",
    hint: "Clients the Sivrce team assigned to you.",
    call: "Call",
    followUp: "Next follow-up",
    statusAria: "Client status",
    save: "Save",
    locale: "en-GB",
  },
  de: {
    h2: "Meine Kunden",
    hint: "Kunden, die das Sivrce-Team Ihnen zugewiesen hat.",
    call: "Anrufen",
    followUp: "Nächster Kontakt",
    statusAria: "Kundenstatus",
    save: "Speichern",
    locale: "de-DE",
  },
} as const

/** CRM clients assigned to these users (agent: self; agency: whole team). Renders nothing when empty. */
export async function CrmClients({ ownerIds, lang }: { ownerIds: string[]; lang: string }) {
  const clients = await safeQuery(
    () =>
      db.crmLead.findMany({
        where: { agentId: { in: ownerIds } },
        orderBy: [{ nextFollowUp: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
        take: 60,
      }),
    [],
  )
  if (clients.length === 0) return null
  const t = CLIENT_L[panelLang(lang)]
  const statusLabel = leadStatusLabels(lang)
  const dateFmt = new Intl.DateTimeFormat(t.locale, { dateStyle: "medium", timeStyle: "short" })
  const now = new Date()

  return (
    <section aria-labelledby="crm-clients-h" className="mb-8">
      <h2 id="crm-clients-h" className="text-[17px] font-extrabold tracking-[-0.02em] text-sv-ink">
        {t.h2} <span className="text-sv-ink/40 tabular-nums">{clients.length}</span>
      </h2>
      <p className="mt-0.5 mb-4 text-[12.5px] font-medium text-sv-ink/60">{t.hint}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {clients.map((c) => {
          const overdue = c.nextFollowUp !== null && c.nextFollowUp < now && c.closedAt === null
          return (
            <article
              key={c.id}
              className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-extrabold tracking-[-0.02em] text-sv-ink">
                    {c.name}
                  </p>
                  {c.district ? (
                    <p className="mt-0.5 text-[12px] font-medium text-sv-ink/60">{c.district}</p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-full bg-sv-blue/10 px-2.5 py-1 text-[11px] font-bold text-sv-blue-deep">
                  {statusLabel[c.status]}
                </span>
              </div>
              {c.notes ? (
                <p className="mt-3 line-clamp-2 text-[13px] font-medium leading-relaxed text-sv-ink/70">
                  {c.notes}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a
                  href={telHref(c.phone)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-sv-orange px-4 text-[13px] font-bold text-sv-ink shadow-glow-orange transition hover:opacity-95"
                >
                  <Phone size={14} strokeWidth={2.4} aria-hidden />
                  {t.call}
                </a>
                <a
                  href={waHref(c.phone, leadWaText(c.name))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-sv-blue px-4 text-[13px] font-bold text-white transition hover:bg-sv-blue-deep"
                >
                  <MessageCircle size={14} strokeWidth={2.4} aria-hidden />
                  WhatsApp
                </a>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-sv-ink/6 pt-3">
                <p className={`text-[11.5px] font-semibold ${overdue ? "text-rose-600" : "text-sv-ink/60"}`}>
                  {c.nextFollowUp ? `${t.followUp}: ${dateFmt.format(c.nextFollowUp)}` : dateFmt.format(c.createdAt)}
                </p>
                <form action={setCrmClientStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <select
                    name="status"
                    defaultValue={c.status}
                    aria-label={t.statusAria}
                    className="h-9 rounded-full border border-sv-ink/12 bg-sv-cloud/40 px-3 text-[12px] font-bold text-sv-ink outline-none focus:border-sv-blue"
                  >
                    {LEAD_STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel[s]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-full bg-sv-navy px-3.5 py-1.5 text-[12px] font-bold text-white transition hover:opacity-90"
                  >
                    {t.save}
                  </button>
                </form>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
