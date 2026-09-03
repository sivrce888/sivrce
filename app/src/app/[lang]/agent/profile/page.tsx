import type { Metadata } from "next"
import Link from "next/link"
import { BadgeCheck, ExternalLink, Star } from "lucide-react"

import { saveAgentProfile } from "@/app/[lang]/agent/profile/actions"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import StatCard from "@/components/dashboard/StatCard"
import { RequestVerification } from "@/components/dashboard/RequestVerification"
import { agentNav } from "@/components/agent-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "პროფილი — აგენტის პანელი",
  robots: { index: false },
}

export default async function AgentProfilePage() {
  const user = await requireRole("agent", "/agent")

  const profile = await safeQuery(
    () => db.agentProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )

  return (
    <DashboardShell
      nav={agentNav}
      title="აგენტის პანელი"
      subtitle="პროფილი"
      userLabel={user.name ?? user.email}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-black tracking-tight text-sv-ink">ჩემი პროფილი</h1>
        {profile ? (
          <Link
            href={`/agents/${profile.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-sv-ink/12 px-4 py-2 text-[12.5px] font-bold text-sv-ink/70 transition hover:border-sv-blue hover:text-sv-blue"
          >
            საჯარო გვერდი
            <ExternalLink size={13} aria-hidden />
          </Link>
        ) : null}
      </div>

      {profile ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="განცხადებები" value={profile.listingsCount} />
          <StatCard label="რეიტინგი" value={profile.rating ? profile.rating.toFixed(1) : "—"} />
          <StatCard label="შეფასებები" value={profile.reviewsCount} />
        </div>
      ) : (
        <div className="mb-6">
          <EmptyState
            title="აგენტის პროფილი ჯერ არ გაქვს"
            body="შეავსე სახელი და სააგენტო — საჯარო გვერდი /agents-ზე ავტომატურად შეიქმნება."
          />
        </div>
      )}

      <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
        <h2 className="text-[15px] font-extrabold text-sv-ink">
          {profile ? "პროფილის რედაქტირება" : "პროფილის შექმნა"}
        </h2>
        {profile ? (
          <p className="mt-1 flex items-center gap-1.5 text-[12.5px] font-medium text-sv-ink/55">
            <BadgeCheck size={13} className="text-sv-blue" aria-hidden />
            {profile.agency}
            {profile.verified ? " · ვერიფიცირებული" : ""}
          </p>
        ) : null}

        <form action={saveAgentProfile} className="mt-5 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/55">სახელი და გვარი</span>
            <input
              name="name"
              required
              maxLength={160}
              defaultValue={profile?.name ?? user.name ?? ""}
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/55">სააგენტო</span>
            <input
              name="agency"
              required
              maxLength={160}
              defaultValue={profile?.agency ?? ""}
              placeholder="მაგ. Remax Georgia"
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/55">ავატარის ტექსტი</span>
            <input
              name="avatarText"
              maxLength={24}
              defaultValue={profile?.avatarText ?? ""}
              placeholder="NG"
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/55">ენები</span>
            <input
              name="languages"
              defaultValue={profile?.languages.join(", ") ?? ""}
              placeholder="ქართული, ინგლისური, რუსული"
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/55">სპეციალიზაცია</span>
            <input
              name="specialties"
              defaultValue={profile?.specialties.join(", ") ?? ""}
              placeholder="ბინები, კომერციული, ახალი პროექტები"
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
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

      {profile ? (
        <RequestVerification subjectType="agent" subjectId={profile.id} verified={profile.verified} />
      ) : null}

      {profile ? (
        <section className="mt-6 rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
          <div className="flex flex-wrap items-center gap-4">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black text-white"
              style={{ backgroundColor: profile.color }}
            >
              {profile.avatarText}
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[18px] font-black text-sv-ink">
                {profile.name}
                {profile.verified ? (
                  <BadgeCheck size={18} className="text-sv-blue" aria-label="ვერიფიცირებული" />
                ) : null}
              </p>
              <p className="text-[13px] font-semibold text-sv-ink/55">{profile.agency}</p>
              {profile.rating > 0 ? (
                <p className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-bold text-sv-ink/70">
                  <Star size={13} className="fill-sv-orange text-sv-orange" />
                  {profile.rating.toFixed(1)} · {profile.reviewsCount} შეფასება
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </DashboardShell>
  )
}
