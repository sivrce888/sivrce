import type { Metadata } from "next"
import LocalizedLink from "@/components/LocalizedLink"
import { Pencil, Plus } from "lucide-react"

import { deleteDeveloperProject } from "@/app/[lang]/developer/projects/actions"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import { developerNav } from "@/components/developer-dashboard/nav"
import ProjectForm from "@/components/developer-dashboard/ProjectForm"
import { db } from "@/lib/db"
import { PROJECT_STATUS_KA, isProjectStatus } from "@/lib/developer-project"
import { requireRole, safeQuery } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ჩემი პროექტები",
  robots: { index: false },
}

const fmt = new Intl.NumberFormat("ka-GE")

export default async function DeveloperProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; edit?: string; confirmDelete?: string; err?: string }>
}) {
  const user = await requireRole("developer", "/developer")
  const q = await searchParams
  const showNew = q.new === "1"
  const editId = q.edit?.trim() || null
  const confirmDelete = q.confirmDelete === "1"
  const formError = q.err === "1"

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

  const editing = editId ? projects.find((p) => p.id === editId) ?? null : null

  return (
    <DashboardShell
      nav={developerNav}
      title="დეველოპერის პანელი"
      subtitle="პროექტები"
      userLabel={user.name ?? user.email}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-black tracking-tight text-sv-ink">პროექტები</h1>
        {showNew || editing ? null : (
          <LocalizedLink
            href="/developer/projects?new=1"
            className="inline-flex items-center gap-1.5 rounded-full bg-sv-orange px-5 py-2.5 text-[13px] font-bold text-white shadow-glow-orange transition hover:opacity-95"
          >
            <Plus size={15} strokeWidth={2.5} />
            დაამატე პროექტი
          </LocalizedLink>
        )}
      </div>

      {showNew ? <ProjectForm project={null} error={formError} /> : null}
      {editing && confirmDelete ? (
        <section className="mb-6 rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
          <p className="text-[16px] font-extrabold text-sv-ink">წავშალოთ „{editing.name}“?</p>
          <p className="mt-1 text-[13px] font-medium text-sv-ink/50">
            პროექტი გაქრება დირექტორიიდან. განცხადებები დარჩება.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <form action={deleteDeveloperProject}>
              <input type="hidden" name="id" value={editing.id} />
              <button
                type="submit"
                className="rounded-full bg-sv-orange px-5 py-2.5 text-[13px] font-bold text-white shadow-glow-orange"
              >
                წაშლა
              </button>
            </form>
            <LocalizedLink
              href={`/developer/projects?edit=${encodeURIComponent(editing.id)}`}
              className="rounded-full border border-sv-ink/12 px-5 py-2.5 text-[13px] font-bold text-sv-ink/70"
            >
              გაუქმება
            </LocalizedLink>
          </div>
        </section>
      ) : null}
      {editing && !confirmDelete ? (
        <div className="mb-6 space-y-3">
          <ProjectForm
            project={{
              id: editing.id,
              name: editing.name,
              city: editing.city,
              district: editing.district,
              address: editing.address,
              status: editing.status,
              readyBy: editing.readyBy,
              priceFrom: editing.priceFrom,
              pricePerSqmFrom: editing.pricePerSqmFrom,
              units: editing.units,
              body: editing.body,
              lat: editing.lat,
              lng: editing.lng,
              image: editing.image,
            }}
            error={formError}
          />
          <LocalizedLink
            href={`/developer/projects?edit=${encodeURIComponent(editing.id)}&confirmDelete=1`}
            className="inline-block text-[12.5px] font-bold text-sv-ink/40 hover:text-sv-orange"
          >
            პროექტის წაშლა
          </LocalizedLink>
        </div>
      ) : null}

      {showNew || editing ? null : projects.length === 0 ? (
        <EmptyState
          title="პროექტები ჯერ არ გაქვს"
          body="დაამატე სამშენებლო პროექტი — გამოჩნდება დირექტორიაში და რუკაზე. შემდეგ დაამატე გასაყიდი ბინები."
          actionHref="/developer/projects?new=1"
          actionLabel="დაამატე პროექტი"
        />
      ) : (
        <div className="overflow-x-auto rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card">
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
                <th className="px-5 py-3.5 text-right"> </th>
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
                      {isProjectStatus(p.status) ? PROJECT_STATUS_KA[p.status] : p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-sv-ink/70">{p.readyBy || "—"}</td>
                  <td className="px-5 py-3.5 font-bold text-sv-ink">
                    {p.priceFrom > 0 ? `${fmt.format(p.priceFrom)} ₾` : "—"}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-sv-ink/70">{p.units}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-3">
                      <LocalizedLink
                        href={`/add-listing?deal=sale&propType=apartment&projectSlug=${encodeURIComponent(p.slug)}&city=${encodeURIComponent(p.city)}&district=${encodeURIComponent(p.district)}`}
                        className="text-[12px] font-bold text-sv-blue hover:underline"
                      >
                        + ბინა
                      </LocalizedLink>
                      <LocalizedLink
                        href={`/developer/projects?edit=${encodeURIComponent(p.id)}`}
                        className="inline-flex items-center gap-1 text-[12px] font-bold text-sv-ink/55 hover:text-sv-blue"
                      >
                        <Pencil size={12} aria-hidden />
                        რედაქტირება
                      </LocalizedLink>
                    </div>
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
