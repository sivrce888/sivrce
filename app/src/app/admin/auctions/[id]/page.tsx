import { ArrowLeft, Gavel, HandCoins, ShieldCheck, Trophy } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { AuctionAdminActions } from "@/components/admin/auctions/AuctionAdminActions"
import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import { getAuctionDetail } from "@/lib/admin/auctions"
import { fmtDateTime, fmtNum, fmtTetri } from "@/lib/admin/format"

function Field({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-[11px] font-bold tracking-[0.08em] text-sv-ink/45 uppercase">
        {label}
      </dt>
      <dd className={`mt-1 text-[14px] font-semibold text-sv-ink ${mono ? "tabular-nums" : ""}`}>
        {value}
      </dd>
    </div>
  )
}

export default async function AdminAuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const a = await getAuctionDetail(id)
  if (!a) notFound()

  const bidderLabel = (u: { name: string | null; email: string }) =>
    u.name ? `${u.name} (${u.email})` : u.email

  return (
    <div>
      <Link
        href="/admin/auctions"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-sv-ink/50 hover:text-sv-ink"
      >
        <ArrowLeft className="h-4 w-4" /> All auctions
      </Link>
      <PageHeader
        title={`Auction ${a.shortPublicCode}`}
        description={a.listing.title}
        actions={<StatusPill status={a.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          {/* Auction card */}
          <section className="rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-sv-ink">
              <Gavel className="h-4 w-4 text-sv-blue" /> Auction
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Field label="Starting price" value={fmtTetri(a.startingPriceTetri, a.currency)} mono />
              <Field label="Current price" value={fmtTetri(a.currentPriceTetri, a.currency)} mono />
              <Field label="Bid increment" value={fmtTetri(a.bidIncrementTetri, a.currency)} mono />
              <Field
                label="Reserve price"
                value={a.reservePriceTetri !== null ? fmtTetri(a.reservePriceTetri, a.currency) : "None"}
                mono
              />
              <Field
                label="Buy-now price"
                value={a.buyNowPriceTetri !== null ? fmtTetri(a.buyNowPriceTetri, a.currency) : "None"}
                mono
              />
              <Field label="Deposit" value={fmtTetri(a.depositAmountTetri, a.currency)} mono />
              <Field label="Starts" value={fmtDateTime(a.startsAt)} />
              <Field label="Ends" value={fmtDateTime(a.endsAt)} />
              <Field label="Anti-snipe" value={`${fmtNum(a.antiSnipeMinutes)} min`} />
              <Field label="Total bids" value={fmtNum(a.totalBids)} mono />
              <Field label="Unique bidders" value={fmtNum(a.uniqueBidders)} mono />
              <Field label="Official" value={a.isOfficial ? "Yes" : "No"} />
            </dl>
            {a.status === "paused" && a.pausedReason ? (
              <p className="mt-4 rounded-[var(--radius-control)] bg-amber-50 px-3.5 py-2.5 text-[13px] font-semibold text-amber-800">
                Paused {fmtDateTime(a.pausedAt)} — {a.pausedReason}
              </p>
            ) : null}
          </section>

          {/* People */}
          <section className="rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-sv-ink">
              <ShieldCheck className="h-4 w-4 text-sv-blue" /> Organizer
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Organizer" value={bidderLabel(a.organizer)} />
              <Field label="Agency" value={a.agency ? a.agency.name : "—"} />
            </dl>
          </section>

          {/* Winner */}
          {a.winnerUserId && a.winner ? (
            <section className="rounded-[var(--radius-tile)] border border-emerald-200 bg-emerald-50/60 p-5 shadow-[var(--shadow-card)]">
              <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-emerald-900">
                <Trophy className="h-4 w-4 text-emerald-600" /> Winner
              </h2>
              <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                <Field label="Winner" value={bidderLabel(a.winner)} />
                <Field
                  label="Winning amount"
                  value={a.winningAmountTetri !== null ? fmtTetri(a.winningAmountTetri, a.currency) : "—"}
                  mono
                />
                <Field label="Paid at" value={a.winnerPaidAt ? fmtDateTime(a.winnerPaidAt) : "Not paid yet"} />
              </dl>
            </section>
          ) : null}

          {/* Bids */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold text-sv-ink">
              <HandCoins className="h-4 w-4 text-sv-blue" /> Bid history
              <span className="text-[12px] font-bold text-sv-ink/40">
                {a.bids.length === 100 ? "latest 100" : fmtNum(a.bids.length)}
              </span>
            </h2>
            {a.bids.length === 0 ? (
              <EmptyState
                icon={HandCoins}
                title="No bids yet"
                hint="Bids placed on this auction will appear here."
              />
            ) : (
              <DataTable>
                <THeadRow>
                  <th className={th}>Bidder</th>
                  <th className={`${th} text-right`}>Amount</th>
                  <th className={`${th} text-right`}>Max (proxy)</th>
                  <th className={th}>Type</th>
                  <th className={th}>Status</th>
                  <th className={th}>Placed</th>
                </THeadRow>
                <tbody>
                  {a.bids.map((b) => (
                    <TRow key={b.id}>
                      <td className={`${td} max-w-[220px] truncate`}>{bidderLabel(b.bidder)}</td>
                      <td className={`${td} text-right tabular-nums`}>
                        {fmtTetri(b.amountTetri, a.currency)}
                      </td>
                      <td className={`${td} text-right tabular-nums`}>
                        {b.maxAmountTetri !== null ? fmtTetri(b.maxAmountTetri, a.currency) : "—"}
                      </td>
                      <td className={td}>{b.isBuyNow ? "Buy now" : b.isProxy ? "Proxy" : "Manual"}</td>
                      <td className={td}>
                        <StatusPill status={b.status} />
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{fmtDateTime(b.placedAt)}</td>
                    </TRow>
                  ))}
                </tbody>
              </DataTable>
            )}
          </section>

          {/* Deposits */}
          <section>
            <h2 className="mb-3 text-[15px] font-extrabold text-sv-ink">Deposits</h2>
            {a.deposits.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No deposits"
                hint="Bidder deposits held for this auction will appear here."
              />
            ) : (
              <DataTable>
                <THeadRow>
                  <th className={th}>Bidder</th>
                  <th className={`${th} text-right`}>Amount</th>
                  <th className={th}>Status</th>
                  <th className={th}>Held</th>
                  <th className={th}>Refunded</th>
                </THeadRow>
                <tbody>
                  {a.deposits.map((d) => (
                    <TRow key={d.id}>
                      <td className={`${td} max-w-[220px] truncate`}>{bidderLabel(d.bidder)}</td>
                      <td className={`${td} text-right tabular-nums`}>
                        {fmtTetri(d.amountTetri, d.currency)}
                      </td>
                      <td className={td}>
                        <StatusPill status={d.status} />
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{fmtDateTime(d.heldAt)}</td>
                      <td className={`${td} whitespace-nowrap`}>
                        {d.refundedAt ? fmtDateTime(d.refundedAt) : "—"}
                      </td>
                    </TRow>
                  ))}
                </tbody>
              </DataTable>
            )}
          </section>
        </div>

        {/* Sidebar: actions */}
        <div>
          <AuctionAdminActions auctionId={a.id} status={a.status} />
        </div>
      </div>
    </div>
  )
}
