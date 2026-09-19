import type { Metadata } from "next"
import LocalizedLink from "@/components/LocalizedLink"
import { Pencil, Plus } from "lucide-react"

import { deleteDeveloperProject } from "@/app/[lang]/developer/projects/actions"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import { developerNav } from "@/components/developer-dashboard/nav"
import ProjectForm from "@/components/developer-dashboard/ProjectForm"
import { fmtNum, projectStatusLabel } from "@/components/agent-dashboard/format"
import { db } from "@/lib/db"
import { isProjectStatus } from "@/lib/developer-project"
import { requireRole, safeQuery } from "@/lib/guards"
import { isValidLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

const L = {
  ka: {
    metaTitle: "ჩემი პროექტები",
    title: "დეველოპერის პანელი",
    subtitle: "პროექტები",
    h1: "პროექტები",
    addProject: "დაამატე პროექტი",
    confirmDelete: (name: string) => `წავშალოთ „${name}“?`,
    confirmDeleteBody: "პროექტი გაქრება დირექტორიიდან. განცხადებები დარჩება.",
    delete: "წაშლა",
    cancel: "გაუქმება",
    deleteProject: "პროექტის წაშლა",
    noProjectsTitle: "პროექტები ჯერ არ გაქვს",
    noProjectsBody:
      "დაამატე სამშენებლო პროექტი — გამოჩნდება დირექტორიაში და რუკაზე. შემდეგ დაამატე გასაყიდი ბინები.",
    thProject: "პროექტი",
    thCity: "ქალაქი",
    thDistrict: "უბანი",
    thStatus: "სტატუსი",
    thReadyBy: "ჩაბარება",
    thPriceFrom: "ფასიდან",
    thUnits: "ბინები",
    gel: (n: number) => `${fmtNum(n, "ka")} ₾`,
    addUnit: "+ ბინა",
    edit: "რედაქტირება",
  },
  en: {
    metaTitle: "My projects",
    title: "Developer dashboard",
    subtitle: "Projects",
    h1: "Projects",
    addProject: "Add project",
    confirmDelete: (name: string) => `Delete "${name}"?`,
    confirmDeleteBody: "The project will disappear from the directory. Listings will remain.",
    delete: "Delete",
    cancel: "Cancel",
    deleteProject: "Delete project",
    noProjectsTitle: "No projects yet",
    noProjectsBody:
      "Add a construction project — it will appear in the directory and on the map. Then add apartments for sale.",
    thProject: "Project",
    thCity: "City",
    thDistrict: "District",
    thStatus: "Status",
    thReadyBy: "Delivery",
    thPriceFrom: "Price from",
    thUnits: "Units",
    gel: (n: number) => `₾${fmtNum(n, "en")}`,
    addUnit: "+ Unit",
    edit: "Edit",
  },
  de: {
    metaTitle: "Meine Projekte",
    title: "Developer-Dashboard",
    subtitle: "Projekte",
    h1: "Projekte",
    addProject: "Projekt hinzufügen",
    confirmDelete: (name: string) => `„${name}“ löschen?`,
    confirmDeleteBody: "Das Projekt verschwindet aus dem Verzeichnis. Die Inserate bleiben erhalten.",
    delete: "Löschen",
    cancel: "Abbrechen",
    deleteProject: "Projekt löschen",
    noProjectsTitle: "Noch keine Projekte",
    noProjectsBody:
      "Füge ein Bauprojekt hinzu — es erscheint im Verzeichnis und auf der Karte. Lege danach Wohnungen zum Verkauf an.",
    thProject: "Projekt",
    thCity: "Stadt",
    thDistrict: "Viertel",
    thStatus: "Status",
    thReadyBy: "Fertigstellung",
    thPriceFrom: "Preis ab",
    thUnits: "Wohnungen",
    gel: (n: number) => `${fmtNum(n, "de")} ₾`,
    addUnit: "+ Wohnung",
    edit: "Bearbeiten",
  },
} as const
type Loc = keyof typeof L

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const loc: Loc = raw === "en" ? "en" : raw === "de" ? "de" : "ka"
  return { title: L[loc].metaTitle, robots: { index: false } }
}

export default async function DeveloperProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ new?: string; edit?: string; confirmDelete?: string; err?: string }>
}) {
  const { lang: rawLang } = await params
  const lang = isValidLang(rawLang) ? rawLang : "ka"
  const loc = lang === "en" ? "en" : lang === "de" ? "de" : "ka"
  const T = L[loc]
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
      nav={developerNav(lang)}
      title={T.title}
      subtitle={T.subtitle}
      userLabel={user.name ?? user.email}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-black tracking-tight text-sv-ink">{T.h1}</h1>
        {showNew || editing ? null : (
          <LocalizedLink
            href="/developer/projects?new=1"
            className="inline-flex items-center gap-1.5 rounded-full bg-sv-orange px-5 py-2.5 text-[13px] font-bold text-sv-ink shadow-glow-orange transition hover:opacity-95"
          >
            <Plus size={15} strokeWidth={2.5} />
            {T.addProject}
          </LocalizedLink>
        )}
      </div>

      {showNew ? <ProjectForm project={null} error={formError} lang={lang} /> : null}
      {editing && confirmDelete ? (
        <section className="mb-6 rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
          <p className="text-[16px] font-extrabold text-sv-ink">{T.confirmDelete(editing.name)}</p>
          <p className="mt-1 text-[13px] font-medium text-sv-ink/60">{T.confirmDeleteBody}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <form action={deleteDeveloperProject}>
              <input type="hidden" name="id" value={editing.id} />
              <button
                type="submit"
                className="rounded-full bg-sv-orange px-5 py-2.5 text-[13px] font-bold text-sv-ink shadow-glow-orange"
              >
                {T.delete}
              </button>
            </form>
            <LocalizedLink
              href={`/developer/projects?edit=${encodeURIComponent(editing.id)}`}
              className="rounded-full border border-sv-ink/12 px-5 py-2.5 text-[13px] font-bold text-sv-ink/70"
            >
              {T.cancel}
            </LocalizedLink>
          </div>
        </section>
      ) : null}
      {editing && !confirmDelete ? (
        <div className="mb-6 space-y-3">
          <ProjectForm
            lang={lang}
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
            className="inline-block text-[12.5px] font-bold text-sv-ink/60 hover:text-sv-orange"
          >
            {T.deleteProject}
          </LocalizedLink>
        </div>
      ) : null}

      {showNew || editing ? null : projects.length === 0 ? (
        <EmptyState
          title={T.noProjectsTitle}
          body={T.noProjectsBody}
          actionHref="/developer/projects?new=1"
          actionLabel={T.addProject}
        />
      ) : (
        <div className="overflow-x-auto rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-sv-ink/8 text-[11px] font-bold uppercase tracking-wide text-sv-ink/60">
                <th className="px-5 py-3.5">{T.thProject}</th>
                <th className="px-5 py-3.5">{T.thCity}</th>
                <th className="px-5 py-3.5">{T.thDistrict}</th>
                <th className="px-5 py-3.5">{T.thStatus}</th>
                <th className="px-5 py-3.5">{T.thReadyBy}</th>
                <th className="px-5 py-3.5">{T.thPriceFrom}</th>
                <th className="px-5 py-3.5">{T.thUnits}</th>
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
                      {isProjectStatus(p.status) ? projectStatusLabel(lang)[p.status] : p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-sv-ink/70">{p.readyBy || "—"}</td>
                  <td className="px-5 py-3.5 font-bold text-sv-ink">
                    {p.priceFrom > 0 ? T.gel(p.priceFrom) : "—"}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-sv-ink/70">{p.units}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-3">
                      <LocalizedLink
                        href={`/add-listing?deal=sale&propType=apartment&projectSlug=${encodeURIComponent(p.slug)}&city=${encodeURIComponent(p.city)}&district=${encodeURIComponent(p.district)}`}
                        className="text-[12px] font-bold text-sv-blue hover:underline"
                      >
                        {T.addUnit}
                      </LocalizedLink>
                      <LocalizedLink
                        href={`/developer/projects?edit=${encodeURIComponent(p.id)}`}
                        className="inline-flex items-center gap-1 text-[12px] font-bold text-sv-ink/60 hover:text-sv-blue"
                      >
                        <Pencil size={12} aria-hidden />
                        {T.edit}
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
