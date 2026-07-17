import type { Metadata } from "next"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import { sellerNav } from "@/components/seller-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ლიდები · გამყიდველი",
  robots: { index: false },
}

const STATUS_LABEL: Record<string, string> = {
  new: "ახალი",
  contacted: "კონტაქტი",
  viewing_scheduled: "ვიზიტი დაგეგმილი",
  offer_made: "შეთავაზება",
  negotiating: "მოლაპარაკება",
  closed_won: "მოგებული",
  closed_lost: "წაგებული",
  disqualified: "დისკვალიფიცირებული",
}

const STATUS_TONE: Record<string, string> = {
  new: "info",
  contacted: "neutral",
  viewing_scheduled: "success",
  offer_made: "warning",
  negotiating: "warning",
  closed_won: "success",
  closed_lost: "error",
  disqualified: "neutral",
}

export default async function SellerLeadsPage() {
  const user = await requireRole("seller", "/seller")

  const leads = await safeQuery(
    () =>
      db.crmLead.findMany({
        where: { agentId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    [],
  )

  return (
    <DashboardShell
      nav={sellerNav}
      title="გამყიდველის პანელი"
      subtitle="ლიდები"
      userLabel={user.name ?? user.email}
    >
      <h2 className="mb-6 text-[18px] font-extrabold tracking-tight text-sv-ink">
        ყველა ლიდი ({leads.length})
      </h2>

      {leads.length === 0 ? (
        <EmptyState
          title="ლიდები ჯერ არ გყავს"
          body="ახალი მოთხოვნები აქ გამოჩნდება, როცა მყიდველი დაინტერესდება შენი განცხადებით."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sv-ink/6 bg-white shadow-sm">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-sv-ink/6 bg-sv-cloud/60">
              <tr>
                <th className="px-5 py-3 text-[12px] font-extrabold uppercase tracking-wide text-sv-ink/50">
                  სახელი
                </th>
                <th className="px-5 py-3 text-[12px] font-extrabold uppercase tracking-wide text-sv-ink/50">
                  ტელეფონი
                </th>
                <th className="px-5 py-3 text-[12px] font-extrabold uppercase tracking-wide text-sv-ink/50">
                  სტატუსი
                </th>
                <th className="px-5 py-3 text-[12px] font-extrabold uppercase tracking-wide text-sv-ink/50">
                  თარიღი
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-ink/5">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-sv-cloud/40">
                  <td className="px-5 py-3.5 font-bold text-sv-ink">{lead.name}</td>
                  <td className="px-5 py-3.5 font-medium text-sv-ink/60">{lead.phone}</td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full bg-sv-blue/10 px-2.5 py-1 text-[11.5px] font-bold text-sv-blue">
                      {STATUS_LABEL[lead.status] ?? lead.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sv-ink/50">
                    {new Date(lead.createdAt).toLocaleDateString("ka-GE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  )
}
