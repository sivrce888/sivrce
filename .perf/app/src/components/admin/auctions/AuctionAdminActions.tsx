"use client"

import {
  cancelAuction,
  pauseAuction,
  resumeAuction,
} from "@/app/admin/auctions/actions"

const labelCls = "block text-[12px] font-bold tracking-[0.06em] text-sv-ink/50 uppercase"
const inputCls =
  "mt-1.5 h-10 w-full rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 text-[13.5px] text-sv-ink normal-case outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25"
const btnBase =
  "inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] px-3.5 text-[12.5px] font-bold whitespace-nowrap text-white transition-colors"

function ReasonField({ name, hint }: { name: string; hint: string }) {
  return (
    <label className={labelCls}>
      Reason
      <input
        type="text"
        name={name}
        required
        minLength={3}
        maxLength={500}
        placeholder={hint}
        className={inputCls}
      />
    </label>
  )
}

/** Status-gated auction ops. Server actions re-check the current status before writing. */
export function AuctionAdminActions({
  auctionId,
  status,
}: {
  auctionId: string
  status: string
}) {
  const cancellable = ["scheduled", "live", "paused"].includes(status)
  if (status !== "live" && status !== "paused" && !cancellable) return null

  return (
    <div className="rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-[15px] font-extrabold text-sv-ink">Actions</h2>
      <div className="mt-4 flex flex-col gap-5">
        {status === "live" ? (
          <form action={pauseAuction} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={auctionId} />
            <ReasonField name="reason" hint="Why is this auction being paused?" />
            <div>
              <button type="submit" className={`${btnBase} bg-amber-500 hover:bg-amber-600`}>
                Pause auction
              </button>
            </div>
          </form>
        ) : null}
        {status === "paused" ? (
          <form action={resumeAuction}>
            <input type="hidden" name="id" value={auctionId} />
            <button type="submit" className={`${btnBase} bg-sv-blue hover:bg-sv-blue-deep`}>
              Resume auction
            </button>
          </form>
        ) : null}
        {cancellable ? (
          <form
            action={cancelAuction}
            onSubmit={(e) => {
              if (!window.confirm("Cancel this auction? This cannot be undone.")) {
                e.preventDefault()
              }
            }}
            className="flex flex-col gap-3 border-t border-sv-ink/8 pt-5"
          >
            <input type="hidden" name="id" value={auctionId} />
            <ReasonField name="reason" hint="Why is this auction being cancelled?" />
            <div>
              <button type="submit" className={`${btnBase} bg-rose-600 hover:bg-rose-700`}>
                Cancel auction
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  )
}
