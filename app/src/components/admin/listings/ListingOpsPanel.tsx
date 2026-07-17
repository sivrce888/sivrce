import {
  adjustTrustScore,
  restore,
  setStatus,
  setTier,
  softDelete,
  toggleVerified,
} from "@/app/admin/listings/actions"
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { STATUS_OPTIONS, TIER_OPTIONS } from "@/lib/admin/listings"
import { fmtDateTime } from "@/lib/admin/format"

const inputCls =
  "h-10 w-full rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 text-[13.5px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25"
const labelCls = "block text-[12.5px] font-bold text-sv-ink/60"
const submitCls =
  "inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] bg-sv-blue px-3.5 text-[12.5px] font-bold text-white transition-colors hover:bg-sv-blue-deep"

/** Operations card on the listing detail page — every control hits an audited server action. */
export function ListingOpsPanel({
  listing,
}: {
  listing: {
    id: string
    verified: boolean
    tier: string
    tierExpiresAt: Date | null
    status: string
    trustScore: number
    deletedAt: Date | null
  }
}) {
  const { id } = listing
  return (
    <section className="rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-4 text-[15px] font-extrabold text-sv-ink">Operations</h2>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-bold text-sv-ink/80">Verified badge</p>
            <p className="mt-0.5 text-[12px] text-sv-ink/45">
              Currently {listing.verified ? "verified" : "not verified"}
            </p>
          </div>
          <ConfirmButton
            action={toggleVerified}
            fields={{ id }}
            label={listing.verified ? "Remove badge" : "Mark verified"}
            tone={listing.verified ? "ghost" : "primary"}
          />
        </div>

        <form action={setTier} className="space-y-2 border-t border-sv-ink/6 pt-4">
          <input type="hidden" name="id" value={id} />
          <label className={labelCls} htmlFor="ops-tier">
            Tier
          </label>
          <select id="ops-tier" name="tier" defaultValue={listing.tier} className={inputCls}>
            {TIER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <label className={labelCls} htmlFor="ops-tier-days">
            Expires in (days){" "}
            <span className="font-normal text-sv-ink/40">— blank means no expiry</span>
          </label>
          <input
            id="ops-tier-days"
            name="days"
            type="number"
            min={1}
            max={3650}
            className={inputCls}
          />
          <p className="text-[12px] text-sv-ink/45">
            Current expiry: {listing.tierExpiresAt ? fmtDateTime(listing.tierExpiresAt) : "none"}
          </p>
          <button type="submit" className={submitCls}>
            Set tier
          </button>
        </form>

        <form action={setStatus} className="space-y-2 border-t border-sv-ink/6 pt-4">
          <input type="hidden" name="id" value={id} />
          <label className={labelCls} htmlFor="ops-status">
            Status
          </label>
          <select id="ops-status" name="status" defaultValue={listing.status} className={inputCls}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button type="submit" className={submitCls}>
            Update status
          </button>
        </form>

        <form action={adjustTrustScore} className="space-y-2 border-t border-sv-ink/6 pt-4">
          <input type="hidden" name="id" value={id} />
          <label className={labelCls} htmlFor="ops-trust-delta">
            Trust score{" "}
            <span className="font-normal text-sv-ink/40">
              — currently {listing.trustScore}/100, adjust by ±
            </span>
          </label>
          <input
            id="ops-trust-delta"
            name="delta"
            type="number"
            min={-100}
            max={100}
            required
            className={inputCls}
          />
          <button type="submit" className={submitCls}>
            Apply adjustment
          </button>
        </form>

        <div className="border-t border-sv-ink/8 pt-4">
          {listing.deletedAt ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12.5px] font-semibold text-rose-600">
                Deleted {fmtDateTime(listing.deletedAt)}
              </p>
              <ConfirmButton
                action={restore}
                fields={{ id }}
                label="Restore listing"
                tone="warning"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12.5px] text-sv-ink/45">
                Soft-delete hides the listing publicly; it can be restored.
              </p>
              <ConfirmButton
                action={softDelete}
                fields={{ id }}
                label="Soft-delete"
                tone="danger"
                confirm="Soft-delete this listing? It disappears from public search but can be restored later."
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
