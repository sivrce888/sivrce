import { ArrowLeft, Check, Flag, ImageIcon, ShieldAlert, TrendingUp, TriangleAlert } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { ListingMediaGrid } from "@/components/admin/listings/ListingMediaGrid"
import { ListingOpsPanel } from "@/components/admin/listings/ListingOpsPanel"
import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { StatCard } from "@/components/admin/ui/StatCard"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import { fmtDate, fmtDateTime, fmtMoney, fmtNum, fmtPct, fmtTetri } from "@/lib/admin/format"
import { DEAL_TYPE_OPTIONS, PROPERTY_TYPE_OPTIONS, TIER_OPTIONS, optionLabel } from "@/lib/admin/listings"
import { db } from "@/lib/db"

export const metadata = { title: "Listing detail" }

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-4 text-[15px] font-extrabold text-sv-ink">{title}</h2>
      {children}
    </section>
  )
}

function Def({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold tracking-[0.08em] text-sv-ink/40 uppercase">{label}</dt>
      <dd className="mt-0.5 text-[13.5px] font-semibold break-words text-sv-ink/85">{children}</dd>
    </div>
  )
}

const EVENT_CLS: Record<string, string> = {
  listed: "bg-sv-blue/10 text-sv-blue",
  price_drop: "bg-emerald-50 text-emerald-700",
  price_increase: "bg-rose-50 text-rose-700",
  sold: "bg-violet-50 text-violet-700",
}

export default async function AdminListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const listing = await db.listing.findUnique({
    where: { id },
    include: {
      media: {
        where: { deletedAt: null },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
      priceEvents: { orderBy: { recordedAt: "desc" }, take: 50 },
      boostHistory: { orderBy: { createdAt: "desc" }, take: 25 },
      _count: { select: { complaintsAsSubject: true, moderationQueueItems: true } },
    },
  })
  if (!listing) notFound()

  const deletedAt = listing.deletedAt
  const complaints = listing._count.complaintsAsSubject
  const moderationItems = listing._count.moderationQueueItems
  const now = new Date()

  return (
    <>
      <PageHeader
        title={listing.title}
        description={`${listing.city} · ${listing.district} — ${listing.slug}`}
        actions={
          <Link
            href="/admin/listings"
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-sv-ink/12 bg-white px-3.5 text-[12.5px] font-bold text-sv-ink/75 transition-colors hover:border-sv-ink/25 hover:text-sv-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All listings
          </Link>
        }
      />

      {deletedAt ? (
        <div className="mb-5 flex items-center gap-3 rounded-[var(--radius-tile)] border border-rose-200 bg-rose-50 px-5 py-3.5 text-[13px] font-semibold text-rose-700">
          <TriangleAlert className="h-4.5 w-4.5 shrink-0" />
          Soft-deleted on {fmtDateTime(deletedAt)} — hidden from the public site. Use Restore in
          Operations to bring it back.
        </div>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Section title="Details">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 xl:grid-cols-4">
              <Def label="ID">
                <span className="font-mono text-[12px] break-all">{listing.id}</span>
              </Def>
              <Def label="Slug">
                <span className="font-mono text-[12px] break-all">{listing.slug}</span>
              </Def>
              <Def label="Owner ID">
                {listing.ownerId ? (
                  <span className="font-mono text-[12px] break-all">{listing.ownerId}</span>
                ) : (
                  "—"
                )}
              </Def>
              <Def label="Deal">{optionLabel(DEAL_TYPE_OPTIONS, listing.dealType)}</Def>
              <Def label="Type">{optionLabel(PROPERTY_TYPE_OPTIONS, listing.propertyType)}</Def>
              <Def label="Tier">{optionLabel(TIER_OPTIONS, listing.tier)}</Def>
              <Def label="Status">
                <StatusPill status={listing.status} />
              </Def>
              <Def label="Verified">
                {listing.verified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <Check className="h-4 w-4" /> Yes
                  </span>
                ) : (
                  "No"
                )}
              </Def>
              <Def label="Price">{fmtMoney(listing.price, listing.currency)}</Def>
              <Def label="Price per m²">{fmtMoney(listing.pricePerSqm, listing.currency)}</Def>
              <Def label="Currency">{listing.currency}</Def>
              <Def label="Area">{`${fmtNum(listing.area)} m²`}</Def>
              <Def label="Rooms">{fmtNum(listing.rooms)}</Def>
              <Def label="Bedrooms">{fmtNum(listing.bedrooms)}</Def>
              <Def label="Bathrooms">{fmtNum(listing.bathrooms)}</Def>
              <Def label="Floor">
                {listing.floor ?? "—"}
                {listing.totalFloors ? ` / ${listing.totalFloors}` : ""}
              </Def>
              <Def label="Year built">{listing.yearBuilt ?? "—"}</Def>
              <Def label="City">{listing.city}</Def>
              <Def label="District">{listing.district}</Def>
              <Def label="Address">{listing.address}</Def>
              <Def label="Coordinates">
                <span className="font-mono text-[12px]">
                  {listing.lat.toFixed(5)}, {listing.lng.toFixed(5)}
                </span>
              </Def>
              <Def label="Trust score">{`${listing.trustScore} / 100`}</Def>
              <Def label="Profile fill">{fmtPct(listing.fillPercentage)}</Def>
              <Def label="Views">{fmtNum(listing.views)}</Def>
              <Def label="Created">{fmtDateTime(listing.createdAt)}</Def>
              <Def label="Updated">{fmtDateTime(listing.updatedAt)}</Def>
              {listing.soldAt ? <Def label="Sold at">{fmtDateTime(listing.soldAt)}</Def> : null}
              {listing.soldPrice !== null ? (
                <Def label="Sold price">{fmtMoney(listing.soldPrice, listing.currency)}</Def>
              ) : null}
            </dl>
          </Section>

          <Section title="Features">
            {listing.features.length === 0 ? (
              <p className="text-[13px] text-sv-ink/45">No features recorded.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {listing.features.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-sv-cloud px-3 py-1.5 text-[12.5px] font-semibold text-sv-ink/70"
                  >
                    {f.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            )}
          </Section>

          <Section title="Description">
            <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap text-sv-ink/75">
              {listing.description}
            </p>
          </Section>

          <Section title={`Media (${listing.media.length})`}>
            <ListingMediaGrid listingId={listing.id} media={listing.media} />
          </Section>

          <Section title={`Price history (${listing.priceEvents.length})`}>
            {listing.priceEvents.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="No price events"
                hint="Price changes, listings and sales recorded for this property will appear here."
              />
            ) : (
              <ol className="relative ml-1 space-y-4 border-l border-sv-ink/10 pl-5">
                {listing.priceEvents.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute top-1.5 -left-[26.5px] h-2.5 w-2.5 rounded-full bg-sv-blue ring-4 ring-sv-blue/10" />
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-bold whitespace-nowrap capitalize ${EVENT_CLS[e.eventType] ?? "bg-sv-ink/6 text-sv-ink/60"}`}
                      >
                        {e.eventType.replaceAll("_", " ")}
                      </span>
                      <span className="text-[14px] font-extrabold tabular-nums text-sv-ink">
                        {fmtMoney(e.price, e.currency)}
                      </span>
                      {e.previousPrice !== null ? (
                        <span className="text-[12.5px] text-sv-ink/45 tabular-nums">
                          was {fmtMoney(e.previousPrice, e.currency)}
                        </span>
                      ) : null}
                      {e.pricePerSqm !== null ? (
                        <span className="text-[12.5px] text-sv-ink/45 tabular-nums">
                          {fmtMoney(e.pricePerSqm, e.currency)}/m²
                        </span>
                      ) : null}
                      <span className="ml-auto text-[12px] whitespace-nowrap text-sv-ink/45">
                        {fmtDateTime(e.recordedAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Section>

          <Section title={`Boost history (${listing.boostHistory.length})`}>
            {listing.boostHistory.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title="No boosts"
                hint="Paid tier upgrades for this listing will appear here."
              />
            ) : (
              <DataTable>
                <THeadRow>
                  <th className={th}>Boost</th>
                  <th className={`${th} text-right`}>Amount</th>
                  <th className={`${th} text-right`}>Days</th>
                  <th className={th}>Started</th>
                  <th className={th}>Expires</th>
                  <th className={th}>Provider</th>
                  <th className={th}>State</th>
                </THeadRow>
                <tbody>
                  {listing.boostHistory.map((b) => (
                    <TRow key={b.id}>
                      <td className={`${td} font-semibold whitespace-nowrap`}>
                        {optionLabel(TIER_OPTIONS, b.fromTier)} → {optionLabel(TIER_OPTIONS, b.toTier)}
                      </td>
                      <td className={`${td} text-right font-bold whitespace-nowrap tabular-nums`}>
                        {fmtTetri(b.amountTetri, b.currency)}
                      </td>
                      <td className={`${td} text-right tabular-nums`}>{fmtNum(b.durationDays)}</td>
                      <td className={`${td} whitespace-nowrap text-sv-ink/55`}>{fmtDate(b.startedAt)}</td>
                      <td className={`${td} whitespace-nowrap text-sv-ink/55`}>{fmtDate(b.expiresAt)}</td>
                      <td className={td}>{b.provider ?? "—"}</td>
                      <td className={td}>
                        {b.endedAt ? (
                          <span className="text-[12.5px] text-sv-ink/55">
                            Ended{b.endedReason ? `: ${b.endedReason.replaceAll("_", " ")}` : ""}
                          </span>
                        ) : (
                          <StatusPill status={b.expiresAt > now ? "active" : "expired"} />
                        )}
                      </td>
                    </TRow>
                  ))}
                </tbody>
              </DataTable>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <ListingOpsPanel listing={listing} />
          <StatCard
            label="Complaints"
            value={fmtNum(complaints)}
            icon={Flag}
            tone={complaints > 0 ? "danger" : "ink"}
            hint="Reports filed against this listing"
          />
          <StatCard
            label="Moderation items"
            value={fmtNum(moderationItems)}
            icon={ShieldAlert}
            tone={moderationItems > 0 ? "orange" : "ink"}
            hint="Moderation queue entries for this listing"
          />
        </div>
      </div>
    </>
  )
}
