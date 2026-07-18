import { Layers } from "lucide-react"

import { th, td } from "@/components/admin/ui/DataTable"
import type { Building3D, BuildingFloor } from "@/generated/prisma/client"

import { enableFloorInventory, saveFloorInventory, setFloorCount } from "./actions"
import { inputCls, labelCls } from "./form"

const btnCls =
  "inline-flex items-center gap-1.5 rounded-full bg-sv-blue px-4 py-2 text-[13px] font-extrabold text-white transition hover:bg-sv-blue-deep"
const cellCls =
  "w-full min-w-[64px] rounded-[10px] border border-sv-ink/10 bg-white px-2 py-1.5 text-[13px] font-semibold tabular-nums text-sv-ink focus:border-sv-blue focus:outline-none focus:ring-2 focus:ring-sv-blue/20"

/** Floor-by-floor availability editor — Building3D/BuildingFloor sellable inventory. */
export function FloorInventory({
  mapBuildingId,
  defaultFloors,
  building3D,
}: {
  mapBuildingId: string
  defaultFloors: number
  building3D: (Building3D & { floors: BuildingFloor[] }) | null
}) {
  if (!building3D) {
    return (
      <section className="rounded-module border border-sv-ink/8 bg-white p-6">
        <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-sv-ink">
          <Layers className="h-4.5 w-4.5 text-sv-blue" /> Floor inventory
        </h2>
        <p className="mt-1 text-[13px] text-sv-ink/55">
          No floor inventory yet. Enable it to edit per-floor availability — the map&apos;s floor
          stacks then show real sellable stock instead of listing-derived counts.
        </p>
        <form action={enableFloorInventory} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={mapBuildingId} />
          <div className="w-32">
            <label htmlFor="floorCount" className={labelCls}>
              Floors
            </label>
            <input
              id="floorCount"
              name="floorCount"
              type="number"
              min={1}
              max={60}
              defaultValue={defaultFloors > 0 ? defaultFloors : 10}
              required
              className={inputCls}
            />
          </div>
          <button type="submit" className={btnCls}>
            Enable floor inventory
          </button>
        </form>
      </section>
    )
  }

  const floors = building3D.floors
  const totalUnits = floors.reduce((s, f) => s + f.totalUnits, 0)
  const availableUnits = floors.reduce((s, f) => s + f.availableUnits, 0)

  return (
    <section className="rounded-module border border-sv-ink/8 bg-white p-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-sv-ink">
            <Layers className="h-4.5 w-4.5 text-sv-blue" /> Floor inventory
          </h2>
          <p className="mt-1 text-[13px] text-sv-ink/55">
            {floors.length} floors · {totalUnits} units · {availableUnits} available — live on the
            map&apos;s floor stacks
          </p>
        </div>
        <form action={setFloorCount} className="flex items-end gap-2">
          <input type="hidden" name="id" value={mapBuildingId} />
          <input type="hidden" name="building3DId" value={building3D.id} />
          <div className="w-24">
            <label htmlFor="resizeFloorCount" className={labelCls}>
              Floors
            </label>
            <input
              id="resizeFloorCount"
              name="floorCount"
              type="number"
              min={1}
              max={60}
              defaultValue={floors.length}
              required
              className={cellCls}
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center rounded-full border border-sv-ink/12 px-4 py-2 text-[13px] font-extrabold text-sv-ink/70 transition hover:border-sv-blue/40 hover:text-sv-blue"
          >
            Resize
          </button>
        </form>
      </div>

      <form action={saveFloorInventory} className="mt-4">
        <input type="hidden" name="id" value={mapBuildingId} />
        <input type="hidden" name="building3DId" value={building3D.id} />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>Floor</th>
                <th className={th}>Units</th>
                <th className={th}>Available</th>
                <th className={th}>Sale</th>
                <th className={th}>Rent</th>
                <th className={th}>Daily</th>
                <th className={th}>₾/m² min</th>
                <th className={th}>₾/m² max</th>
              </tr>
            </thead>
            <tbody>
              {floors.map((f) => (
                <tr key={f.id} className="border-t border-sv-ink/6">
                  <td className={`${td} font-extrabold whitespace-nowrap`}>
                    <input type="hidden" name="n" value={f.floorNumber} />
                    {f.displayLabel ?? f.floorNumber}
                  </td>
                  <td className={td}>
                    <input
                      name="total"
                      type="number"
                      min={0}
                      defaultValue={f.totalUnits}
                      className={cellCls}
                      aria-label={`Floor ${f.floorNumber} total units`}
                    />
                  </td>
                  <td className={td}>
                    <input
                      name="avail"
                      type="number"
                      min={0}
                      defaultValue={f.availableUnits}
                      className={cellCls}
                      aria-label={`Floor ${f.floorNumber} available units`}
                    />
                  </td>
                  <td className={td}>
                    <input
                      name="sale"
                      type="number"
                      min={0}
                      defaultValue={f.forSaleCount}
                      className={cellCls}
                      aria-label={`Floor ${f.floorNumber} for sale`}
                    />
                  </td>
                  <td className={td}>
                    <input
                      name="rent"
                      type="number"
                      min={0}
                      defaultValue={f.forRentCount}
                      className={cellCls}
                      aria-label={`Floor ${f.floorNumber} for rent`}
                    />
                  </td>
                  <td className={td}>
                    <input
                      name="daily"
                      type="number"
                      min={0}
                      defaultValue={f.forDailyCount}
                      className={cellCls}
                      aria-label={`Floor ${f.floorNumber} for daily rent`}
                    />
                  </td>
                  <td className={td}>
                    <input
                      name="pmin"
                      type="number"
                      min={0}
                      step="any"
                      defaultValue={f.pricePerSqmMin ?? ""}
                      placeholder="—"
                      className={cellCls}
                      aria-label={`Floor ${f.floorNumber} min price per m²`}
                    />
                  </td>
                  <td className={td}>
                    <input
                      name="pmax"
                      type="number"
                      min={0}
                      step="any"
                      defaultValue={f.pricePerSqmMax ?? ""}
                      placeholder="—"
                      className={cellCls}
                      aria-label={`Floor ${f.floorNumber} max price per m²`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" className={btnCls}>
            Save availability
          </button>
        </div>
      </form>
    </section>
  )
}
