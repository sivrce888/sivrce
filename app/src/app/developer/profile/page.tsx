import type { Metadata } from "next"
import { Building2, MapPin, Star } from "lucide-react"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import StatCard from "@/components/dashboard/StatCard"
import { developerNav } from "@/components/developer-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ჩემი პროფილი",
  robots: { index: false },
}

export default async function DeveloperProfilePage() {
  const user = await requireRole("developer", "/developer")

  const profile = await safeQuery(
    () =>
      db.developerProfile.findFirst({
        where: { ownerId: user.id, deletedAt: null },
      }),
    null,
  )

  return (
    <DashboardShell
      nav={developerNav}
      title="დეველოპერის პანელი"
      subtitle="პროფილი"
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-5 text-[22px] font-black tracking-tight text-sv-ink">
        პროფილი
      </h1>

      {!profile ? (
        <EmptyState
          title="პროფილი ჯერ არ არის შექმნილი"
          body="დეველოპერის საჯარო პროფილი (სახელი, ლოგო, აღწერა) მალე დაემატება — აქ შეძლებ მის რედაქტირებას."
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-sv-ink/6 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-[18px] font-black text-white"
                style={{ backgroundColor: profile.color }}
                aria-hidden
              >
                {profile.logoText}
              </span>
              <div>
                <p className="text-[18px] font-black tracking-tight text-sv-ink">
                  {profile.name}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[12.5px] font-medium text-sv-ink/55">
                  <MapPin size={13} />
                  {profile.headquarters}
                </p>
              </div>
            </div>
            <p className="mt-4 text-[13.5px] font-medium leading-relaxed text-sv-ink/70">
              {profile.description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="პროექტები"
              value={profile.projectsCount}
              icon={<Building2 size={18} />}
            />
            <StatCard
              label="დასრულებული"
              value={profile.completedCount}
              icon={<Building2 size={18} />}
            />
            <StatCard
              label="რეიტინგი"
              value={profile.rating.toFixed(1)}
              icon={<Star size={18} />}
            />
          </div>

          <EmptyState
            title="პროფილის რედაქტირება მალე"
            body="ტექსტების, ლოგოსა და საკონტაქტო მონაცემების ცვლილება მალე დაემატება."
          />
        </div>
      )}
    </DashboardShell>
  )
}
