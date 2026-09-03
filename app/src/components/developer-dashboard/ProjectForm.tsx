import LocalizedLink from "@/components/LocalizedLink"

import { saveDeveloperProject } from "@/app/[lang]/developer/projects/actions"
import {
  PROJECT_PLACEHOLDER_IMG,
  PROJECT_STATUSES,
  PROJECT_STATUS_KA,
} from "@/lib/developer-project"

const field =
  "h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
const label = "text-[12px] font-bold text-sv-ink/55"

export type ProjectFormRow = {
  id: string
  name: string
  city: string
  district: string
  address: string | null
  status: string
  readyBy: string
  priceFrom: number
  pricePerSqmFrom: number
  units: number
  body: string | null
  lat: number | null
  lng: number | null
  image: string
}

export default function ProjectForm({
  project,
  error,
}: {
  project: ProjectFormRow | null
  error?: boolean
}) {
  return (
    <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[18px] font-extrabold tracking-tight text-sv-ink">
          {project ? "პროექტის რედაქტირება" : "ახალი პროექტი"}
        </h2>
        <LocalizedLink
          href="/developer/projects"
          className="text-[12.5px] font-bold text-sv-ink/50 hover:text-sv-blue"
        >
          გაუქმება
        </LocalizedLink>
      </div>
      {error ? (
        <p className="mb-4 rounded-control bg-sv-orange/10 px-4 py-2.5 text-[13px] font-semibold text-sv-orange">
          შეავსე სახელი, ქალაქი და უბანი.
        </p>
      ) : null}
      <form action={saveDeveloperProject} className="grid gap-4 sm:grid-cols-2">
        {project ? <input type="hidden" name="id" value={project.id} /> : null}
        <input type="hidden" name="image" value={project?.image ?? PROJECT_PLACEHOLDER_IMG} />
        <label className="grid gap-1.5 sm:col-span-2">
          <span className={label}>პროექტის სახელი</span>
          <input name="name" required maxLength={180} defaultValue={project?.name ?? ""} className={field} />
        </label>
        <label className="grid gap-1.5">
          <span className={label}>ქალაქი</span>
          <input
            name="city"
            required
            maxLength={100}
            defaultValue={project?.city ?? "თბილისი"}
            className={field}
          />
        </label>
        <label className="grid gap-1.5">
          <span className={label}>უბანი</span>
          <input name="district" required maxLength={120} defaultValue={project?.district ?? ""} className={field} />
        </label>
        <label className="grid gap-1.5 sm:col-span-2">
          <span className={label}>მისამართი</span>
          <input name="address" maxLength={240} defaultValue={project?.address ?? ""} className={field} />
        </label>
        <label className="grid gap-1.5">
          <span className={label}>სტატუსი</span>
          <select name="status" defaultValue={project?.status ?? "construction"} className={field}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_KA[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className={label}>ჩაბარება</span>
          <input
            name="readyBy"
            maxLength={80}
            defaultValue={project?.readyBy ?? ""}
            placeholder="2027"
            className={field}
          />
        </label>
        <label className="grid gap-1.5">
          <span className={label}>ფასი-დან (₾)</span>
          <input
            name="priceFrom"
            type="number"
            min={0}
            step={1}
            defaultValue={project?.priceFrom || ""}
            className={field}
          />
        </label>
        <label className="grid gap-1.5">
          <span className={label}>ფასი მ²-დან (₾)</span>
          <input
            name="pricePerSqmFrom"
            type="number"
            min={0}
            step={1}
            defaultValue={project?.pricePerSqmFrom || ""}
            className={field}
          />
        </label>
        <label className="grid gap-1.5">
          <span className={label}>ბინები</span>
          <input
            name="units"
            type="number"
            min={1}
            step={1}
            defaultValue={project?.units ?? 1}
            className={field}
          />
        </label>
        <label className="grid gap-1.5">
          <span className={label}>განედი</span>
          <input
            name="lat"
            inputMode="decimal"
            defaultValue={project?.lat ?? ""}
            placeholder="41.71"
            className={field}
          />
        </label>
        <label className="grid gap-1.5">
          <span className={label}>გრძედი</span>
          <input
            name="lng"
            inputMode="decimal"
            defaultValue={project?.lng ?? ""}
            placeholder="44.79"
            className={field}
          />
        </label>
        <label className="grid gap-1.5 sm:col-span-2">
          <span className={label}>რენდერი</span>
          <input name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="text-[13px] font-medium text-sv-ink/70 file:mr-3 file:rounded-full file:border-0 file:bg-sv-blue file:px-4 file:py-2 file:text-[12px] file:font-bold file:text-white" />
        </label>
        <label className="grid gap-1.5 sm:col-span-2">
          <span className={label}>აღწერა</span>
          <textarea
            name="body"
            maxLength={4000}
            rows={4}
            defaultValue={project?.body ?? ""}
            className="rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 py-3 text-[14px] font-medium leading-relaxed text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="inline-flex rounded-full bg-sv-orange px-6 py-2.5 text-[13px] font-bold text-white shadow-glow-orange transition hover:opacity-95"
          >
            შენახვა
          </button>
        </div>
      </form>
    </section>
  )
}
