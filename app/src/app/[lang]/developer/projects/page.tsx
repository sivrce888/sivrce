import type { Metadata } from "next"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import { developerNav } from "@/components/developer-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ჩემი პროექტები",
  robots: { index: false },
}

const fmt = new Intl.NumberFormat("ka-GE")

export default async function DeveloperProjectsPage() {
  const user = await requireRole("developer", "/developer")

  const profile = await safeQuery(
    () =>
      db.developerProfile.findFirst({
        where: { ownerId: user.id, deletedAt: null },
        select: { name: true },
      }),
    null,
  )

  const projects = await safeQuery(
    () =>
      db.projectDirectory.findMany({
        where: {
          deletedAt: null,
          OR: [
            { ownerId: user.id },
            ...(profile ? [{ developer: profile.name }] : []),
          ],
        },
        orderBy: { createdAt: "desc" },
      }),
    [],
  )

  return (
    <DashboardShell
      nav={developerNav}
      title="დეველოპერის პანელი"
      subtitle="პროექტები"
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-5 text-[22px] font-black tracking-tight text-sv-ink">
        პროექტები
      </h1>

      {projects.length === 0 ? (
        <EmptyState
          title="პროექტები ჯერ არ გაქვს"
          body="შენი სამშენებლო პროექტები აქ გამოჩნდება, როგორც კი რეესტრში დაემატება."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sv-ink/6 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-sv-ink/8 text-[11px] font-bold uppercase tracking-wide text-sv-ink/45">
                <th className="px-5 py-3.5">პროექტი</th>
                <th className="px-5 py-3.5">ქალაქი</th>
                <th className="px-5 py-3.5">უბანი</th>
                <th className="px-5 py-3.5">სტატუსი</th>
                <th className="px-5 py-3.5">ჩაბარება</th>
                <th className="px-5 py-3.5">ფასი-დან</th>
                <th className="px-5 py-3.5">ბინები</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-sv-ink/5 last:border-0 hover:bg-sv-cloud/40"
                >
                  <td className="px-5 py-3.5 font-bold text-sv-ink">{p.name}</td>
                  <td className="px-5 py-3.5 font-medium text-sv-ink/70">{p.city}</td>
                  <td className="px-5 py-3.5 font-medium text-sv-ink/70">{p.district}</td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full bg-sv-blue/8 px-2.5 py-1 text-[11px] font-bold text-sv-blue">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-sv-ink/70">{p.readyBy}</td>
                  <td className="px-5 py-3.5 font-bold text-sv-ink">
                    {p.priceFrom > 0 ? `${fmt.format(p.priceFrom)} ₾` : "—"}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-sv-ink/70">{p.units}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  )
}
