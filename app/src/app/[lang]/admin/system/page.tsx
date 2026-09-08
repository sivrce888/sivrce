import { Activity, ScrollText, Settings2 } from "lucide-react"
import Link from "next/link"

import { deleteConfig } from "@/app/[lang]/admin/system/actions"
import { BroadcastForm } from "@/components/admin/system/BroadcastForm"
import { ConfigForm } from "@/components/admin/system/ConfigForm"
import { SettingsForm } from "@/components/admin/system/SettingsForm"
import { SyncSearchButton } from "@/components/admin/system/SyncSearchButton"
import { SystemTabs } from "@/components/admin/system/SystemTabs"
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { FilterSelect } from "@/components/admin/ui/FilterSelect"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { SearchForm } from "@/components/admin/ui/SearchForm"
import { fmtDateTime, timeAgo } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"
import { ADMIN_PAGE_SIZE, param, parsePage, type SearchParams } from "@/lib/admin/query"
import { getJobHealth, prettyJson } from "@/lib/admin/system"
import type { JobHealthRow } from "@/lib/admin/job-cadence"
import { configFormModel, getAllConfig } from "@/lib/config"
import { db } from "@/lib/db"

export const metadata = { title: "System" }

const TABS = ["health", "settings", "config", "broadcast", "audit"] as const
type SystemTab = (typeof TABS)[number]

function isTab(v: string): v is SystemTab {
  return (TABS as readonly string[]).includes(v)
}

export default async function AdminSystemPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()
  const sp = await searchParams
  const tabRaw = param(sp.tab)
  const tab: SystemTab = isTab(tabRaw) ? tabRaw : "settings"

  return (
    <>
      <PageHeader
        title="System"
        description="Platform settings, broadcasts and audit trail"
      />
      <SystemTabs active={tab} />
      {tab === "health" ? <HealthTab /> : null}
      {tab === "settings" ? <SettingsTab /> : null}
      {tab === "config" ? <ConfigTab /> : null}
      {tab === "broadcast" ? <BroadcastTab /> : null}
      {tab === "audit" ? <AuditTab sp={sp} /> : null}
    </>
  )
}

function fmtMs(ms: number | null): string {
  if (ms === null) return "—"
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

function HealthPill({ row }: { row: JobHealthRow }) {
  if (!row.tracked || row.ok === null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sv-ink/6 px-2.5 py-1 text-[12px] font-bold text-sv-ink/60">
        <span className="h-1.5 w-1.5 rounded-full bg-sv-ink/30" />
        No runs yet
      </span>
    )
  }
  if (row.stale) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-bold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Overdue
      </span>
    )
  }
  return row.ok ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      OK
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[12px] font-bold text-rose-700">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
      Failed
    </span>
  )
}

/** Cron job runs — failures and missed daily schedules surface here. */
async function HealthTab() {
  const health = await getJobHealth()
  const anyTrouble = health.failed48h > 0 || health.overdue > 0

  return (
    <div>
      <p className="mb-4 max-w-[560px] text-[13px] text-sv-ink/60">
        Nightly cron jobs. A job that failed in the last 48h or missed its daily
        schedule (26h) shows here — the dashboard flags the same conditions.
      </p>
      {anyTrouble ? (
        <div
          role="status"
          className="mb-4 rounded-[var(--radius-control)] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-800"
        >
          {health.overdue > 0 ? `${health.overdue} job(s) overdue · ` : ""}
          {health.failed48h > 0 ? `${health.failed48h} failure(s) in the last 48h` : ""}
        </div>
      ) : null}
      {health.jobs.some((j) => j.tracked) ? (
        <DataTable>
          <THeadRow>
            <th className={th}>Job</th>
            <th className={th}>Last run</th>
            <th className={th}>Status</th>
            <th className={th}>Items</th>
            <th className={th}>Duration</th>
            <th className={th}>Error</th>
          </THeadRow>
          <tbody>
            {health.jobs.map((row) => (
              <TRow key={row.job}>
                <td className={`${td} font-mono text-[12.5px] whitespace-nowrap`}>{row.job}</td>
                <td
                  className={`${td} whitespace-nowrap text-sv-ink/60`}
                  title={row.lastRanAt ? fmtDateTime(row.lastRanAt) : undefined}
                >
                  {row.lastRanAt ? timeAgo(row.lastRanAt) : "—"}
                </td>
                <td className={td}>
                  <HealthPill row={row} />
                </td>
                <td className={`${td} tabular-nums`}>{row.tracked ? row.count ?? 0 : "—"}</td>
                <td className={`${td} tabular-nums text-sv-ink/60`}>{fmtMs(row.ms)}</td>
                <td className={`${td} max-w-[320px]`}>
                  {row.error ? (
                    <span
                      className="block truncate font-mono text-[12px] text-rose-600"
                      title={row.error}
                    >
                      {row.error}
                    </span>
                  ) : (
                    <span className="text-sv-ink/30">—</span>
                  )}
                </td>
              </TRow>
            ))}
          </tbody>
        </DataTable>
      ) : (
        <EmptyState
          icon={Activity}
          title="No job runs recorded yet"
          hint="Rows appear after the next nightly cron window (02:15–04:30 UTC)."
        />
      )}
    </div>
  )
}

async function SettingsTab() {
  const sections = configFormModel(await getAllConfig())
  return (
    <div className="max-w-[760px]">
      <p className="mb-4 max-w-[560px] text-[13px] text-sv-ink/60">
        Live platform settings — these values are read across the site and apply on save.
        Leave a field blank to revert it to the default.
      </p>
      <SettingsForm sections={sections} />
    </div>
  )
}

async function ConfigTab() {
  const rows = await db.systemConfig.findMany({
    include: { updatedBy: { select: { name: true, email: true } } },
    orderBy: { id: "asc" },
  })
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[520px] text-[13px] text-sv-ink/60">
          Advanced: raw JSON keys. Prefer the Settings tab for supported values.
        </p>
        <SyncSearchButton />
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={Settings2}
          title="No config keys"
          hint="Create the first key with the form below."
        />
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <section
              key={row.id}
              className="rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[13.5px] font-bold text-sv-ink">{row.id}</p>
                  {row.description ? (
                    <p className="mt-0.5 text-[12.5px] text-sv-ink/60">{row.description}</p>
                  ) : null}
                  <p className="mt-1 text-[12px] text-sv-ink/60">
                    Updated {fmtDateTime(row.updatedAt)}
                    {row.updatedBy ? ` by ${row.updatedBy.name ?? row.updatedBy.email}` : ""}
                  </p>
                </div>
                <ConfirmButton
                  action={deleteConfig}
                  fields={{ id: row.id }}
                  label="Delete"
                  tone="danger"
                  confirm={`Delete config key "${row.id}"?`}
                />
              </div>
              <ConfigForm row={{ id: row.id, value: prettyJson(row.value) }} />
            </section>
          ))}
        </div>
      )}
      <section className="mt-6 rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="mb-4 text-[15px] font-extrabold text-sv-ink">New config</h2>
        <ConfigForm />
      </section>
    </div>
  )
}

function BroadcastTab() {
  return (
    <div className="max-w-[640px]">
      <p className="mb-4 text-[13px] text-sv-ink/60">
        Pushes an in-app notification to every user account. Use sparingly — there is no undo.
      </p>
      <section className="rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]">
        <BroadcastForm />
      </section>
    </div>
  )
}

/** Audit target types that map to an admin detail surface; everything else stays plain text. */
function targetHref(targetType: string, targetId: string): string | undefined {
  if (targetType === "listing") return `/admin/listings/${targetId}`
  if (targetType === "user") return `/admin/users/${targetId}`
  if (targetType === "map_building") return `/admin/buildings/${targetId}`
  if (targetType === "project" || targetType === "projects") {
    return `/admin/professionals?q=${encodeURIComponent(targetId)}`
  }
  return undefined
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

async function AuditTab({ sp }: { sp: SearchParams }) {
  const page = parsePage(sp.page)
  const q = param(sp.q)
  const type = param(sp.type)
  const ns = param(sp.ns)
  const from = DATE_RE.test(param(sp.from)) ? param(sp.from) : ""
  const to = DATE_RE.test(param(sp.to)) ? param(sp.to) : ""

  const where = {
    AND: [
      q
        ? {
            OR: [
              { action: { contains: q, mode: "insensitive" as const } },
              { targetId: { contains: q } },
              { actorName: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
      type ? { targetType: type } : {},
      ns ? { action: { startsWith: `${ns}.` } } : {},
      from ? { createdAt: { gte: new Date(`${from}T00:00:00`) } } : {},
      to ? { createdAt: { lte: new Date(`${to}T23:59:59.999`) } } : {},
    ],
  }

  const [rows, total, typeRows, actionRows] = await Promise.all([
    db.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
    }),
    db.adminAuditLog.count({ where }),
    db.adminAuditLog.findMany({
      distinct: ["targetType"],
      select: { targetType: true },
      orderBy: { targetType: "asc" },
    }),
    db.adminAuditLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    }),
  ])
  // Top-level action namespaces (listing., moderation., …) for the prefix filter.
  const namespaces = [...new Set(actionRows.map((r) => r.action.split(".")[0]!))].sort()
  const filtered = Boolean(q || type || ns || from || to)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchForm
          action="/admin/system"
          params={sp}
          placeholder="Search action, target ID, actor…"
        />
        <FilterSelect
          name="type"
          label="Target"
          value={type}
          options={typeRows.map((r) => ({ value: r.targetType, label: r.targetType }))}
        />
        <FilterSelect
          name="ns"
          label="Namespace"
          value={ns}
          options={namespaces.map((n) => ({ value: n, label: n }))}
        />
        <form action="/admin/system" method="get" className="flex items-center gap-2">
          <input type="hidden" name="tab" value="audit" />
          {q ? <input type="hidden" name="q" value={q} /> : null}
          {type ? <input type="hidden" name="type" value={type} /> : null}
          {ns ? <input type="hidden" name="ns" value={ns} /> : null}
          <input
            type="date"
            name="from"
            defaultValue={from}
            aria-label="From date"
            className="h-10 rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-2.5 text-[13px] font-semibold text-sv-ink shadow-[var(--shadow-card)] outline-none focus:border-sv-blue"
          />
          <span className="text-[12.5px] font-semibold text-sv-ink/35">–</span>
          <input
            type="date"
            name="to"
            defaultValue={to}
            aria-label="To date"
            className="h-10 rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-2.5 text-[13px] font-semibold text-sv-ink shadow-[var(--shadow-card)] outline-none focus:border-sv-blue"
          />
          <button
            type="submit"
            className="h-10 rounded-[var(--radius-control)] bg-sv-navy px-4 text-[13px] font-bold text-white transition-colors hover:bg-sv-navy-soft"
          >
            Apply
          </button>
        </form>
        {filtered ? (
          <Link
            href="/admin/system?tab=audit"
            className="text-[12.5px] font-bold text-sv-blue hover:underline"
          >
            Clear
          </Link>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={filtered ? "No entries match these filters" : "No audit entries"}
          hint={
            filtered
              ? "Widen the date range or clear a filter."
              : "Admin actions will be recorded here."
          }
        />
      ) : (
        <DataTable>
          <THeadRow>
            <th className={th}>Time</th>
            <th className={th}>Actor</th>
            <th className={th}>Action</th>
            <th className={th}>Target</th>
            <th className={th}>Details</th>
          </THeadRow>
          <tbody>
            {rows.map((r) => {
              const details = prettyJson(r.details)
              const href = targetHref(r.targetType, r.targetId)
              return (
                <TRow key={r.id}>
                  <td className={`${td} whitespace-nowrap text-sv-ink/60`} title={fmtDateTime(r.createdAt)}>
                    {timeAgo(r.createdAt)}
                  </td>
                  <td className={td}>
                    <span className="block font-semibold text-sv-ink">{r.actorName}</span>
                    <span className="block text-[12px] text-sv-ink/60">{r.actorRole}</span>
                  </td>
                  <td className={`${td} font-mono text-[12.5px] whitespace-nowrap`}>{r.action}</td>
                  <td className={td}>
                    {href ? (
                      <Link
                        href={href}
                        className="block font-semibold text-sv-blue hover:underline"
                      >
                        {r.targetType}
                      </Link>
                    ) : (
                      <span className="block">{r.targetType}</span>
                    )}
                    <span
                      className="block max-w-[140px] truncate font-mono text-[12px] text-sv-ink/60"
                      title={r.targetId}
                    >
                      {r.targetId}
                    </span>
                  </td>
                  <td className={`${td} max-w-[320px]`}>
                    <details>
                      <summary
                        className="cursor-pointer list-none truncate font-mono text-[12px] text-sv-ink/60 [&::-webkit-details-marker]:hidden"
                        title={details}
                      >
                        {details === "{}"
                          ? "—"
                          : details.length > 120
                            ? `${details.slice(0, 120)}…`
                            : details}
                      </summary>
                      {details !== "{}" ? (
                        <pre className="mt-1 max-h-[220px] max-w-[320px] overflow-auto rounded-[8px] bg-sv-cloud p-2 font-mono text-[11.5px] whitespace-pre-wrap text-sv-ink/60">
                          {details}
                        </pre>
                      ) : null}
                    </details>
                  </td>
                </TRow>
              )
            })}
          </tbody>
        </DataTable>
      )}
      <Pagination
        basePath="/admin/system"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        params={sp}
      />
    </div>
  )
}
