import type { Metadata } from "next"

import { setDeveloperLeadStatus } from "@/app/[lang]/developer/leads/actions"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import { developerNav } from "@/components/developer-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ლიდები",
  robots: { index: false },
}

const STATUS_KA: Record<string, string> = {
  new: "ახალი",
  contacted: "დაკავშირებული",
  qualified: "კვალიფიცირებული",
  closed: "დახურული",
}

export default async function DeveloperLeadsPage() {
  const user = await requireRole("developer", "/developer")

  // ponytail: no developer-scoped lead model; leads = inquiries on own listings (or addressed to own email)
  const listingIds = await safeQuery(
    () =>
      db.listing
        .findMany({
          where: { ownerId: user.id, deletedAt: null },
          select: { id: true },
        })
        .then((rows) => rows.map((r) => r.id)),
    [],
  )

  const leads = await safeQuery(
    () =>
      db.inquiry.findMany({
        where: {
          deletedAt: null,
          OR: [
            { listingId: { in: listingIds } },
            { agentEmail: user.email },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    [],
  )

  return (
    <DashboardShell
      nav={developerNav}
      title="დეველოპერის პანელი"
      subtitle="ლიდები"
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-5 text-[22px] font-black tracking-tight text-sv-ink">
        ლიდები
      </h1>

      {leads.length === 0 ? (
        <EmptyState
          title="ლიდები ჯერ არ გაქვს"
          body="მყიდველების მოთხოვნები შენს განცხადებებზე აქ გამოჩნდება. დაამატე გასაყიდი ბინა, რომ პირველი მოთხოვნები მიიღო."
          actionHref="/add-listing?deal=sale&propType=apartment"
          actionLabel="განცხადების დამატება"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-extrabold text-sv-ink">
                    {lead.buyerName}
                  </p>
                  <p className="mt-0.5 text-[12.5px] font-medium text-sv-ink/55">
                    {lead.buyerEmail}
                    {lead.buyerPhone ? (
                      <>
                        {" · "}
                        <a href={`tel:${lead.buyerPhone}`} className="hover:text-sv-blue">
                          {lead.buyerPhone}
                        </a>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {lead.city ? (
                    <span className="text-[12px] font-semibold text-sv-ink/45">
                      {lead.city}
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-[13px] font-medium leading-relaxed text-sv-ink/70">
                {lead.message}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11.5px] font-semibold text-sv-ink/40">
                  {new Intl.DateTimeFormat("ka-GE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(lead.createdAt)}
                </p>
                <form action={setDeveloperLeadStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={lead.id} />
                  <select
                    name="status"
                    defaultValue={lead.status}
                    aria-label="ლიდის სტატუსი"
                    className="h-9 rounded-full border border-sv-ink/12 bg-sv-cloud/40 px-3 text-[12px] font-bold text-sv-ink outline-none focus:border-sv-blue"
                  >
                    {Object.entries(STATUS_KA).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-full bg-sv-blue px-3.5 py-1.5 text-[12px] font-bold text-white transition hover:bg-sv-blue-deep"
                  >
                    შენახვა
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
