import { ScrollText, Settings2 } from "lucide-react"

import { deleteConfig } from "@/app/[lang]/admin/system/actions"
import { BroadcastForm } from "@/components/admin/system/BroadcastForm"
import { ConfigForm } from "@/components/admin/system/ConfigForm"
import { SettingsForm } from "@/components/admin/system/SettingsForm"
import { SyncSearchButton } from "@/components/admin/system/SyncSearchButton"
import { SystemTabs } from "@/components/admin/system/SystemTabs"
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { fmtDateTime, timeAgo } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"
import { ADMIN_PAGE_SIZE, param, parsePage, type SearchParams } from "@/lib/admin/query"
import { prettyJson } from "@/lib/admin/system"
import { configFormModel, getAllConfig } from "@/lib/config"
import { db } from "@/lib/db"

export const metadata = { title: "System" }

const TABS = ["settings", "config", "broadcast", "audit"] as const
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
      {tab === "settings" ? <SettingsTab /> : null}
      {tab === "config" ? <ConfigTab /> : null}
      {tab === "broadcast" ? <BroadcastTab /> : null}
      {tab === "audit" ? <AuditTab sp={sp} /> : null}
    </>
  )
}

async function SettingsTab() {
  const sections = configFormModel(await getAllConfig())
  return (
    <div className="max-w-[760px]">
      <p className="mb-4 max-w-[560px] text-[13px] text-sv-ink/55">
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
        <p className="max-w-[520px] text-[13px] text-sv-ink/55">
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
                    <p className="mt-0.5 text-[12.5px] text-sv-ink/50">{row.description}</p>
                  ) : null}
                  <p className="mt-1 text-[12px] text-sv-ink/40">
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
      <p className="mb-4 text-[13px] text-sv-ink/55">
        Pushes an in-app notification to every user account. Use sparingly — there is no undo.
      </p>
      <section className="rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]">
        <BroadcastForm />
      </section>
    </div>
  )
}

async function AuditTab({ sp }: { sp: SearchParams }) {
  const page = parsePage(sp.page)
  const [rows, total] = await Promise.all([
    db.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
    }),
    db.adminAuditLog.count(),
  ])
  return (
    <div>
      {rows.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit entries"
          hint="Admin actions will be recorded here."
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
              const details = JSON.stringify(r.details)
              return (
                <TRow key={r.id}>
                  <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                    {timeAgo(r.createdAt)}
                  </td>
                  <td className={td}>
                    <span className="block font-semibold text-sv-ink">{r.actorName}</span>
                    <span className="block text-[12px] text-sv-ink/45">{r.actorRole}</span>
                  </td>
                  <td className={`${td} font-mono text-[12.5px] whitespace-nowrap`}>{r.action}</td>
                  <td className={td}>
                    <span className="block">{r.targetType}</span>
                    <span
                      className="block max-w-[140px] truncate font-mono text-[12px] text-sv-ink/45"
                      title={r.targetId}
                    >
                      {r.targetId}
                    </span>
                  </td>
                  <td
                    className={`${td} max-w-[320px] truncate font-mono text-[12px] text-sv-ink/45`}
                    title={details}
                  >
                    {details.length > 120 ? `${details.slice(0, 120)}…` : details}
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
