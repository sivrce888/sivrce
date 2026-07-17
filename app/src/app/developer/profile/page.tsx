import type { Metadata } from "next"
import Link from "next/link"
import { Building2, ExternalLink, MapPin, Star } from "lucide-react"

import { saveDeveloperProfile } from "@/app/developer/profile/actions"
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
    () => db.developerProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )

  return (
    <DashboardShell
      nav={developerNav}
      title="დეველოპერის პანელი"
      subtitle="პროფილი"
      userLabel={user.name ?? user.email}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-black tracking-tight text-sv-ink">პროფილი</h1>
        {profile ? (
          <Link
            href={`/developers/${profile.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-sv-ink/12 px-4 py-2 text-[12.5px] font-bold text-sv-ink/70 transition hover:border-sv-blue hover:text-sv-blue"
          >
            საჯარო გვერდი
            <ExternalLink size={13} aria-hidden />
          </Link>
        ) : null}
      </div>

      {profile ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="პროექტები" value={profile.projectsCount} icon={<Building2 size={18} />} />
          <StatCard
            label="დასრულებული"
            value={profile.completedCount}
            icon={<Building2 size={18} />}
          />
          <StatCard label="რეიტინგი" value={profile.rating.toFixed(1)} icon={<Star size={18} />} />
        </div>
      ) : (
        <div className="mb-6">
          <EmptyState
            title="პროფილი ჯერ არ გაქვს"
            body="შეავსე ქვემოთ სახელი, შტაბ-ბინა და აღწერა — საჯარო გვერდი ავტომატურად შეიქმნება."
          />
        </div>
      )}

      <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
        <h2 className="text-[15px] font-extrabold text-sv-ink">
          {profile ? "პროფილის რედაქტირება" : "პროფილის შექმნა"}
        </h2>
        {profile ? (
          <p className="mt-1 flex items-center gap-1 text-[12.5px] font-medium text-sv-ink/55">
            <MapPin size={13} aria-hidden />
            {profile.headquarters}
          </p>
        ) : null}

        <form action={saveDeveloperProfile} className="mt-5 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/55">კომპანიის სახელი</span>
            <input
              name="name"
              required
              maxLength={160}
              defaultValue={profile?.name ?? ""}
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/55">შტაბ-ბინა</span>
            <input
              name="headquarters"
              required
              maxLength={160}
              defaultValue={profile?.headquarters ?? ""}
              placeholder="თბილისი"
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/55">ლოგოს ტექსტი</span>
            <input
              name="logoText"
              maxLength={40}
              defaultValue={profile?.logoText ?? ""}
              placeholder="AB"
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/55">აღწერა</span>
            <textarea
              name="description"
              required
              maxLength={4000}
              rows={5}
              defaultValue={profile?.description ?? ""}
              className="rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 py-3 text-[14px] font-medium leading-relaxed text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <button
            type="submit"
            className="mt-1 inline-flex w-fit rounded-full bg-sv-orange px-6 py-2.5 text-[13px] font-bold text-white shadow-glow-orange transition hover:opacity-95"
          >
            შენახვა
          </button>
        </form>
      </section>
    </DashboardShell>
  )
}
