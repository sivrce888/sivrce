import type { Metadata } from "next"
import { ArrowLeft, Building2, CreditCard, Trash2 } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ContactCard } from "@/components/admin/inquiries/ContactCard"
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import { fmtDate, fmtDateTime, fmtMoney, timeAgo } from "@/lib/admin/format"
import {
  INQUIRY_STATUSES,
  INQUIRY_STATUS_LABELS,
  getInquiry,
  getListingTitle,
  shortRef,
} from "@/lib/admin/inquiries"

import { restore, setStatus, softDelete, toggleForSale } from "./actions"

export const metadata: Metadata = { title: "Inquiry" }

const panel =
  "rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]"
const inputCls =
  "mt-1 h-10 w-full rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 text-[13.5px] text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25"
const labelCls = "block text-[12px] font-bold text-sv-ink/50"
const submitCls =
  "inline-flex h-10 items-center justify-center rounded-[var(--radius-control)] bg-sv-navy px-4 text-[13px] font-bold text-white transition-colors hover:bg-sv-navy-soft"

export default async function AdminInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const inquiry = await getInquiry(id)
  if (!inquiry) notFound()
  const listingTitle = await getListingTitle(inquiry.listingId)
  const deleted = inquiry.deletedAt !== null

  return (
    <>
      <Link
        href="/admin/inquiries"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-sv-ink/50 transition-colors hover:text-sv-blue"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to inquiries
      </Link>
      <PageHeader
        title={`Inquiry · ${inquiry.buyerName}`}
        description={`Received ${timeAgo(inquiry.createdAt)} (${fmtDateTime(inquiry.createdAt)})`}
        actions={
          deleted ? (
            <ConfirmButton
              action={restore}
              fields={{ id: inquiry.id }}
              label="Restore"
              tone="primary"
            />
          ) : (
            <ConfirmButton
              action={softDelete}
              fields={{ id: inquiry.id }}
              label="Move to trash"
              confirm="Move this inquiry to trash? It will disappear from the list but stays recoverable."
              tone="danger"
            />
          )
        }
      />

      {deleted ? (
        <div className="mb-5 flex items-center gap-2.5 rounded-[var(--radius-tile)] border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700">
          <Trash2 className="h-4 w-4" />
          In trash since {fmtDateTime(inquiry.deletedAt)} — hidden from the list until restored.
        </div>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          <section className={panel}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[12px] font-bold tracking-[0.08em] text-sv-ink/45 uppercase">
                Message
              </h2>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-sv-cloud px-2.5 py-1 text-[12px] font-bold text-sv-ink/60">
                  {inquiry.deal}
                </span>
                <StatusPill status={inquiry.status} />
              </div>
            </div>
            <p className="mt-3 text-[14.5px] leading-relaxed whitespace-pre-wrap text-sv-ink/85">
              {inquiry.message}
            </p>
            <p className="mt-4 border-t border-sv-ink/6 pt-3 text-[12.5px] text-sv-ink/45">
              Quality score <span className="font-bold tabular-nums text-sv-ink/70">{inquiry.qualityScore}</span>
            </p>
          </section>

          <section className={panel}>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-sv-ink/35" />
              <h2 className="text-[12px] font-bold tracking-[0.08em] text-sv-ink/45 uppercase">
                Lead purchases ({inquiry.purchases.length})
              </h2>
            </div>
            {inquiry.purchases.length === 0 ? (
              <p className="mt-3 text-[13px] text-sv-ink/45">
                No agent has purchased this lead yet.
              </p>
            ) : (
              <div className="-mx-5 mt-3">
                <DataTable>
                  <THeadRow>
                    <th className={th}>Buyer ID</th>
                    <th className={`${th} text-right`}>Price</th>
                    <th className={th}>Purchased</th>
                    <th className={th}>Expires</th>
                  </THeadRow>
                  <tbody>
                    {inquiry.purchases.map((p) => (
                      <TRow key={p.id}>
                        <td className={td}>
                          <span title={p.buyerId} className="font-mono text-[12px] text-sv-ink/70">
                            {shortRef(p.buyerId)}
                          </span>
                        </td>
                        <td className={`${td} text-right tabular-nums`}>
                          {fmtMoney(p.price, p.currency)}
                        </td>
                        <td className={`${td} whitespace-nowrap`}>{fmtDateTime(p.purchasedAt)}</td>
                        <td className={`${td} whitespace-nowrap`}>{fmtDate(p.expiresAt)}</td>
                      </TRow>
                    ))}
                  </tbody>
                </DataTable>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          <section className={panel}>
            <h2 className="text-[12px] font-bold tracking-[0.08em] text-sv-ink/45 uppercase">
              Status
            </h2>
            <form action={setStatus} className="mt-3 flex flex-col gap-3">
              <input type="hidden" name="id" value={inquiry.id} />
              <label className={labelCls}>
                Inquiry status
                <select name="status" defaultValue={inquiry.status} className={inputCls}>
                  {INQUIRY_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {INQUIRY_STATUS_LABELS[s]}
                    </option>
                  ))}
                  {INQUIRY_STATUSES.includes(inquiry.status as (typeof INQUIRY_STATUSES)[number]) ? null : (
                    <option value={inquiry.status}>{inquiry.status}</option>
                  )}
                </select>
              </label>
              <button type="submit" className={submitCls}>
                Update status
              </button>
            </form>
          </section>

          <ContactCard
            title="Buyer"
            name={inquiry.buyerName}
            email={inquiry.buyerEmail}
            phone={inquiry.buyerPhone}
          />
          <ContactCard
            title="Agent"
            name={inquiry.agentName}
            email={inquiry.agentEmail}
            phone={inquiry.agentPhone}
          />

          <section className={panel}>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-sv-ink/35" />
              <h2 className="text-[12px] font-bold tracking-[0.08em] text-sv-ink/45 uppercase">
                Listing reference
              </h2>
            </div>
            {listingTitle ? (
              <p className="mt-2 text-[14px] font-bold text-sv-ink">{listingTitle}</p>
            ) : null}
            <p className="mt-1 font-mono text-[12px] break-all text-sv-ink/50">
              listing:{inquiry.listingId}
            </p>
            <Link
              href={`/admin/listings/${inquiry.listingId}`}
              className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-sv-blue hover:underline"
            >
              Open in Listings
            </Link>
            <dl className="mt-3 space-y-1.5 border-t border-sv-ink/6 pt-3 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-sv-ink/45">Price</dt>
                <dd className="font-bold tabular-nums text-sv-ink/75">{fmtMoney(inquiry.price)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-sv-ink/45">City</dt>
                <dd className="font-semibold text-sv-ink/75">{inquiry.city || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-sv-ink/45">District</dt>
                <dd className="font-semibold text-sv-ink/75">{inquiry.district || "—"}</dd>
              </div>
            </dl>
          </section>

          <section className={panel}>
            <h2 className="text-[12px] font-bold tracking-[0.08em] text-sv-ink/45 uppercase">
              Lead marketplace
            </h2>
            <form action={toggleForSale} className="mt-3 flex flex-col gap-3">
              <input type="hidden" name="id" value={inquiry.id} />
              <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] font-semibold text-sv-ink/75">
                <input
                  type="checkbox"
                  name="isForSale"
                  value="true"
                  defaultChecked={inquiry.isForSale}
                  className="h-4 w-4 accent-sv-blue"
                />
                Offer this lead for sale
              </label>
              <label className={labelCls}>
                Price (GEL, whole units)
                <input
                  type="number"
                  name="price"
                  min={0}
                  step={1}
                  defaultValue={inquiry.price}
                  className={inputCls}
                />
              </label>
              <button type="submit" className={submitCls}>
                Save marketplace settings
              </button>
            </form>
            {inquiry.exclusivityExpiresAt ? (
              <p className="mt-3 text-[12.5px] text-sv-ink/45">
                Exclusivity expires {fmtDateTime(inquiry.exclusivityExpiresAt)}
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </>
  )
}
