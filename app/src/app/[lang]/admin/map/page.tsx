import { readFile } from "fs/promises"
import path from "path"
import { Layers, Map as MapIcon } from "lucide-react"

import { saveMapSettings } from "@/app/[lang]/admin/map/actions"
import { RenderUploadForm } from "@/components/admin/map/RenderUploadForm"
import { SettingsForm } from "@/components/admin/system/SettingsForm"
import { TabLinks } from "@/components/admin/ui/TabLinks"
import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { requireAdmin } from "@/lib/admin/guard"
import { param, type SearchParams } from "@/lib/admin/query"
import { configFormModel, getAllConfig } from "@/lib/config"
import { PROJECTS } from "@/data/professionals"
import { OFM_ORIGIN, MAP_JSON_CACHE_VER, MAP_PROXY_PREFIX } from "@/lib/map/map-proxy"
import { getMapPlatformConfig } from "@/lib/map/platform-config"
import { FLOOR_STACKS_ENV } from "@/lib/map/floors"

export const metadata = { title: "Map / OSM" }

const TABS = ["settings", "renders", "diagnostics"] as const
type MapTab = (typeof TABS)[number]

function isTab(v: string): v is MapTab {
  return (TABS as readonly string[]).includes(v)
}

type ManifestRow = {
  slug: string
  status: string
  source: string | null
  sourceUrl: string | null
  batch?: number
}

async function loadManifest(): Promise<ManifestRow[]> {
  try {
    const raw = await readFile(
      path.join(process.cwd(), "..", "research", "renders-manifest-2026-07.json"),
      "utf8",
    )
    const data = JSON.parse(raw) as ManifestRow[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default async function AdminMapPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()
  const sp = await searchParams
  const tabRaw = param(sp.tab)
  const tab: MapTab = isTab(tabRaw) ? tabRaw : "settings"
  const focusSlug = param(sp.slug) ?? undefined

  return (
    <>
      <PageHeader
        title="Map / OSM"
        description="Basemap, zoom, floor stacks, project renders — live without redeploy"
      />
      <TabLinks
        items={[
          { href: "/admin/map", label: "OSM settings", active: tab === "settings" },
          { href: "/admin/map?tab=renders", label: "Renders", active: tab === "renders" },
          {
            href: "/admin/map?tab=diagnostics",
            label: "Diagnostics",
            active: tab === "diagnostics",
          },
        ]}
      />
      {tab === "settings" ? <SettingsTab /> : null}
      {tab === "renders" ? <RendersTab focusSlug={focusSlug} /> : null}
      {tab === "diagnostics" ? <DiagnosticsTab /> : null}
    </>
  )
}

async function SettingsTab() {
  const sections = configFormModel(await getAllConfig(), ["map"])
  return (
    <div className="max-w-[860px]">
      <p className="mb-4 max-w-[640px] text-[13px] text-sv-ink/55">
        OpenFreeMap / OSM vector styles are proxied same-origin (
        <code className="font-mono text-[12px]">{MAP_PROXY_PREFIX}</code>
        ). Style paths must stay under <code className="font-mono text-[12px]">/api/map/styles/…</code>{" "}
        — no external tile hosts from admin.
      </p>
      <SettingsForm sections={sections} action={saveMapSettings} />
    </div>
  )
}

async function RendersTab({ focusSlug }: { focusSlug?: string }) {
  const [manifest] = await Promise.all([loadManifest()])
  const failed = manifest.filter((r) => r.status === "failed" || r.status === "placeholder")
  const slugs = PROJECTS.map((p) => p.slug).sort()

  return (
    <div className="space-y-6">
      <RenderUploadForm slugs={slugs} defaultSlug={focusSlug} />
      <section>
        <h2 className="mb-3 text-[15px] font-extrabold text-sv-ink">
          Manifest gaps ({failed.length} need hand-in)
        </h2>
        {failed.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No failed renders in manifest"
            hint="research/renders-manifest-2026-07.json is clean, or missing locally."
          />
        ) : (
          <DataTable>
            <THeadRow>
              <th className={th}>Slug</th>
              <th className={th}>Status</th>
              <th className={th}>Source</th>
              <th className={th}>Action</th>
            </THeadRow>
            <tbody>
              {failed.slice(0, 80).map((r) => (
                <TRow key={r.slug}>
                  <td className={`${td} font-mono text-[12.5px]`}>{r.slug}</td>
                  <td className={td}>{r.status}</td>
                  <td className={`${td} max-w-[240px] truncate text-sv-ink/50`}>
                    {r.sourceUrl ?? r.source ?? "—"}
                  </td>
                  <td className={td}>
                    <a
                      href={`/admin/map?tab=renders&slug=${encodeURIComponent(r.slug)}`}
                      className="text-[12.5px] font-bold text-sv-blue hover:underline"
                    >
                      Hand-in
                    </a>
                  </td>
                </TRow>
              ))}
            </tbody>
          </DataTable>
        )}
      </section>
    </div>
  )
}

async function DiagnosticsTab() {
  const platform = await getMapPlatformConfig()
  const rows: { label: string; value: string }[] = [
    { label: "OFM origin (server proxy only)", value: OFM_ORIGIN },
    { label: "Proxy prefix", value: MAP_PROXY_PREFIX },
    { label: "JSON cache ver", value: MAP_JSON_CACHE_VER },
    { label: "Floor stacks (env)", value: FLOOR_STACKS_ENV ? "on" : "off" },
    {
      label: "Floor stacks (effective)",
      value: platform.floorStacksEnabled ? "on" : "off",
    },
    { label: "Default terrain", value: platform.defaultTerrain },
    {
      label: "Center",
      value: `${platform.center.lat.toFixed(4)}, ${platform.center.lng.toFixed(4)}`,
    },
    { label: "Min / detail / cluster zoom", value: `${platform.minZoom} / ${platform.detailZoom} / ${platform.clusterMaxZoom}` },
    { label: "Style light", value: platform.styleUrlLight },
    { label: "Style clean", value: platform.styleUrlClean },
    { label: "Style dark", value: platform.styleUrlDark },
    { label: "JSON cache ver", value: platform.jsonCacheVer },
    { label: "Geocode API", value: platform.geocodeEnabled ? "on" : "off" },
    { label: "Satellite toggle", value: platform.satelliteEnabled ? "on" : "off" },
  ]

  return (
    <div className="max-w-[720px]">
      <p className="mb-4 text-[13px] text-sv-ink/55">
        Read-only snapshot of live map platform config. Browser never talks to OpenFreeMap
        directly — tiles go through the same-origin proxy.
      </p>
      <section className="rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="mb-3 flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-sv-blue" />
          <h2 className="text-[15px] font-extrabold text-sv-ink">Live platform</h2>
        </div>
        <dl className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.label} className="grid gap-0.5 sm:grid-cols-[220px_1fr]">
              <dt className="text-[12.5px] font-bold text-sv-ink/55">{r.label}</dt>
              <dd className="break-all font-mono text-[12.5px] text-sv-ink">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
