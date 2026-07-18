import Link from "next/link"

import type { MapBuilding } from "@/generated/prisma/client"

import { upsertBuilding } from "./actions"
import { BuildingMapPicker } from "./BuildingMapPicker"

export const inputCls =
  "w-full rounded-[12px] border border-sv-ink/10 bg-white px-3.5 py-2.5 text-[14px] font-semibold text-sv-ink placeholder:text-sv-ink/30 focus:border-sv-blue focus:outline-none focus:ring-2 focus:ring-sv-blue/20"
export const labelCls = "mb-1.5 block text-[12px] font-extrabold text-sv-ink/55"

function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
  step,
  placeholder,
}: {
  label: string
  name: string
  defaultValue?: string | number | null
  required?: boolean
  type?: string
  step?: string
  placeholder?: string
}) {
  return (
    <div>
      <label htmlFor={name} className={labelCls}>
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  )
}

export function BuildingForm({
  building,
  developers,
}: {
  building?: MapBuilding
  developers: Array<{ id: string; name: string }>
}) {
  const polygon = building?.polygonCoords
    ? JSON.stringify(building.polygonCoords)
    : ""
  return (
    <form action={upsertBuilding} className="flex flex-col gap-5">
      {building ? <input type="hidden" name="id" value={building.id} /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Slug" name="slug" required defaultValue={building?.slug} placeholder="axis-towers" />
        <Field label="Code" name="code" defaultValue={building?.code} placeholder="SV-TB-0013" />
        <Field label="Year built" name="yearBuilt" type="number" defaultValue={building?.yearBuilt} placeholder="2024" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name (KA)" name="title" required defaultValue={building?.title} />
        <Field label="Name (EN)" name="titleEn" defaultValue={building?.titleEn} />
      </div>

      <div>
        <label htmlFor="address" className={labelCls}>Address *</label>
        <input
          id="address"
          name="address"
          required
          defaultValue={building?.address ?? ""}
          placeholder="ჩავჭავაძის გამზ. 37, ვაკე, თბილისი"
          className={inputCls}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="City" name="city" defaultValue={building?.city} placeholder="თბილისი" />
        <Field label="District" name="district" defaultValue={building?.district} placeholder="ვაკე" />
        <Field label="Building №" name="buildingNumber" defaultValue={building?.buildingNumber} placeholder="37" />
      </div>

      <BuildingMapPicker lat={building?.lat} lng={building?.lng} />

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Floors" name="floors" type="number" defaultValue={building?.floors ?? 0} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="developerId" className={labelCls}>Developer</label>
          <select id="developerId" name="developerId" defaultValue={building?.developerId ?? ""} className={inputCls}>
            <option value="">— none —</option>
            {developers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className={labelCls}>Status *</label>
          <select id="status" name="status" required defaultValue={building?.status ?? "active"} className={inputCls}>
            <option value="active">active (on map)</option>
            <option value="construction">construction (ghost)</option>
            <option value="completed">completed project</option>
            <option value="hidden">hidden (off map)</option>
          </select>
        </div>
        <Field label="Project slug" name="projectSlug" defaultValue={building?.projectSlug} placeholder="optional /projects link" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Image path" name="img" defaultValue={building?.img} placeholder="/images/p1.webp" />
        <div className="flex items-end pb-1">
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[14px] font-bold text-sv-ink">
            <input
              type="checkbox"
              name="popular"
              defaultChecked={building?.popular ?? false}
              className="h-4.5 w-4.5 accent-sv-blue"
            />
            Popular building (featured on map)
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelCls}>Description</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={building?.description ?? ""}
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="polygonCoords" className={labelCls}>
          Footprint ring (OSM, optional) — {'{"ring":[[lng,lat],…]}'}
        </label>
        <textarea
          id="polygonCoords"
          name="polygonCoords"
          rows={2}
          defaultValue={polygon}
          placeholder='{"ring":[[44.7730,41.7086],[44.7734,41.7086],[44.7734,41.7090],[44.7730,41.7086]]}'
          className={`${inputCls} font-mono text-[12px]`}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-full bg-sv-blue px-6 py-2.5 text-[14px] font-extrabold text-white transition hover:bg-sv-blue-deep"
        >
          {building ? "Save changes" : "Add building to map"}
        </button>
        <Link href="/admin/buildings" className="text-[13px] font-bold text-sv-ink/50 hover:text-sv-ink">
          Cancel
        </Link>
      </div>
    </form>
  )
}
