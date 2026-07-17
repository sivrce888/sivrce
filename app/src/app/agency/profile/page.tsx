import type { Metadata } from "next"
import { Building2, MapPin, Star, Users } from "lucide-react"

import { saveAgencyProfile } from "@/app/agency/profile/actions"
import { AGENCY_NAV } from "@/components/agency-dashboard/nav"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import StatCard from "@/components/dashboard/StatCard"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "სააგენტოს პროფილი",
  robots: { index: false },
}

export default async function AgencyProfilePage() {
  const user = await requireRole("agency", "/agency")

  const profile = await safeQuery(
    () => db.agencyProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )

  return (
    <DashboardShell
      nav={AGENCY_NAV}
      title="სააგენტოს პანელი"
      subtitle="პროფილი"
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-5 text-[22px] font-black tracking-tight text-sv-ink">პროფილი</h1>

      {profile ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="გუნდი" value={profile.teamSize} icon={<Users size={18} />} />
          <StatCard
            label="აქტიური განცხადებები"
            value={profile.activeListings}
            icon={<Building2 size={18} />}
          />
          <StatCard label="რეიტინგი" value={profile.rating.toFixed(1)} icon={<Star size={18} />} />
        </div>
      ) : (
        <div className="mb-6">
          <EmptyState
            title="პროფილი ჯერ არ გაქვს"
            body="შეავსე ქვემოთ სახელი, ქალაქი და აღწერა — ეს მონაცემები გამოჩნდება შენს სააგენტოსთან დაკავშირებულ განცხადებებზე."
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
            {profile.city}
          </p>
        ) : null}

        <form action={saveAgencyProfile} className="mt-5 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/55">სააგენტოს სახელი</span>
            <input
              name="name"
              required
              maxLength={180}
              defaultValue={profile?.name ?? ""}
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/55">ქალაქი</span>
            <input
              name="city"
              required
              maxLength={100}
              defaultValue={profile?.city ?? ""}
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
              placeholder="AG"
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/55">აღწერა</span>
            <textarea
              name="summary"
              required
              maxLength={4000}
              rows={5}
              defaultValue={profile?.summary ?? ""}
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
