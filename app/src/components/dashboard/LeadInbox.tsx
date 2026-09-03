import LocalizedLink from "@/components/LocalizedLink"
import { MessageCircle, Phone } from "lucide-react"

import { setProLeadStatus } from "@/components/dashboard/lead-actions"
import { INQUIRY_STATUS_KA, INQUIRY_STATUSES, isInquiryStatus, leadWaText } from "@/lib/pro-leads"
import { telHref, waHref } from "@/lib/inquiries/phone"

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

const dateFmt = new Intl.DateTimeFormat("ka-GE", {
  dateStyle: "medium",
  timeStyle: "short",
})

function statusKa(status: string): string {
  return INQUIRY_STATUS_KA[status as keyof typeof INQUIRY_STATUS_KA] ?? status
}

function LeadCard({
  lead,
  title,
}: {
  lead: InboxLead
  title: string | undefined
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
          <p className="mt-1 text-[12px] font-medium text-sv-ink/45">
            {[lead.district, lead.city].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span className="rounded-full bg-sv-blue/10 px-2.5 py-1 text-[11px] font-bold text-sv-blue">
          {statusKa(lead.status)}
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
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-sv-orange px-4 text-[13px] font-bold text-white shadow-glow-orange transition hover:opacity-95"
          >
            <Phone size={14} strokeWidth={2.4} />
            ზარი
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
            ელფოსტა
          </a>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-sv-ink/6 pt-3">
        <p className="text-[11.5px] font-semibold text-sv-ink/40">{dateFmt.format(lead.createdAt)}</p>
        <form action={setProLeadStatus} className="flex items-center gap-2">
          <input type="hidden" name="id" value={lead.id} />
          <select
            name="status"
            defaultValue={isInquiryStatus(lead.status) ? lead.status : "new"}
            aria-label="ლიდის სტატუსი"
            className="h-9 rounded-full border border-sv-ink/12 bg-sv-cloud/40 px-3 text-[12px] font-bold text-sv-ink outline-none focus:border-sv-blue"
          >
            {INQUIRY_STATUSES.map((value) => (
              <option key={value} value={value}>
                {INQUIRY_STATUS_KA[value]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-sv-navy px-3.5 py-1.5 text-[12px] font-bold text-white transition hover:opacity-90"
          >
            შენახვა
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
}: {
  leads: InboxLead[]
  titles: Record<string, string>
  layout?: "list" | "board"
}) {
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
                <h2 className="text-[12px] font-extrabold uppercase tracking-wide text-sv-ink/55">
                  {INQUIRY_STATUS_KA[status]}
                </h2>
                <span className="rounded-full bg-sv-ink/6 px-2 py-0.5 text-[11px] font-black tabular-nums text-sv-ink/60">
                  {bucket.length}
                </span>
              </header>
              <div className="flex flex-col gap-2">
                {bucket.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-sv-ink/10 px-3 py-6 text-center text-[11.5px] font-medium text-sv-ink/35">
                    ცარიელი
                  </p>
                ) : (
                  bucket.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} title={titles[lead.listingId]} />
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
        <LeadCard key={lead.id} lead={lead} title={titles[lead.listingId]} />
      ))}
    </div>
  )
}
