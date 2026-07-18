import { Ban, ClipboardList, Copy, Flag, ShieldAlert } from "lucide-react"
import Link from "next/link"

import {
  addBlocklistEntry,
  assignComplaint,
  createShadowBan,
  decideQueueItem,
  liftShadowBan,
  removeBlocklistEntry,
  resolveFraudSignal,
  setComplaintStatus,
} from "@/app/[lang]/admin/moderation/actions"
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { FilterSelect } from "@/components/admin/ui/FilterSelect"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { SearchForm } from "@/components/admin/ui/SearchForm"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import { TabLinks } from "@/components/admin/ui/TabLinks"
import { fmtDate, timeAgo } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"
import {
  COMPLAINT_KIND_OPTIONS,
  COMPLAINT_PRIORITY_OPTIONS,
  COMPLAINT_STATUS_OPTIONS,
  fmtDecimal,
  getModerationCounts,
  isModerationTab,
  listActiveShadowBans,
  listBlocklists,
  listComplaints,
  listDuplicateClusters,
  listQueueItems,
  listSuspiciousActivity,
  listUnresolvedFraudSignals,
  MODERATION_TABS,
  QUEUE_STATUS_OPTIONS,
  SHADOW_BAN_SCOPE_OPTIONS,
  shortRef,
  subjectHref,
  userLabel,
  type BlocklistKind,
} from "@/lib/admin/moderation"
import {
  ADMIN_PAGE_SIZE,
  hrefWithParams,
  mergeParams,
  param,
  parsePage,
  type SearchParams,
} from "@/lib/admin/query"

export const metadata = { title: "Moderation" }

/* Local form classes — mirror the kit's ConfirmButton/control density. */
const rowInputCls =
  "h-9 rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-2.5 text-[12.5px] text-sv-ink outline-none placeholder:text-sv-ink/35 focus:border-sv-blue"
const rowBtnPrimary =
  "inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] bg-sv-blue px-3.5 text-[12.5px] font-bold whitespace-nowrap text-white transition-colors hover:bg-sv-blue-deep"
const rowBtnGhost =
  "inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] border border-sv-ink/12 bg-white px-3.5 text-[12.5px] font-bold whitespace-nowrap text-sv-ink/75 transition-colors hover:border-sv-ink/25 hover:text-sv-ink"
const formInputCls =
  "mt-1 h-10 w-full rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 text-[13.5px] text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25"
const formLabelCls = "block text-[12px] font-bold text-sv-ink/50"
const formSubmitCls =
  "inline-flex h-10 items-center justify-center rounded-[var(--radius-control)] bg-sv-navy px-4 text-[13px] font-bold whitespace-nowrap text-white transition-colors hover:bg-sv-navy-soft"

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-[15px] font-extrabold text-sv-ink">{title}</h2>
      {hint ? <p className="mt-0.5 text-[12.5px] text-sv-ink/50">{hint}</p> : null}
    </div>
  )
}

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()
  const sp = await searchParams
  const tabRaw = param(sp.tab)
  const tab = isModerationTab(tabRaw) ? tabRaw : "queue"
  const page = parsePage(sp.page)
  const counts = await getModerationCounts()

  const tabs = MODERATION_TABS.map((t, i) => ({
    href: hrefWithParams(
      "/admin/moderation",
      mergeParams(sp, {
        tab: t.value === "queue" ? undefined : t.value,
        page: undefined,
        status: undefined,
        kind: undefined,
        priority: undefined,
        q: undefined,
      }),
    ),
    label: t.label,
    active: tab === t.value,
    count: counts[i],
  }))

  return (
    <div>
      <PageHeader
        title="Moderation"
        description="Review queue, complaints, fraud signals, bans and duplicate clusters"
      />

      <TabLinks items={tabs} />

      {tab === "queue" ? <QueueTab page={page} sp={sp} /> : null}
      {tab === "complaints" ? <ComplaintsTab page={page} sp={sp} /> : null}
      {tab === "fraud" ? <FraudTab page={page} sp={sp} /> : null}
      {tab === "bans" ? <BansTab page={page} sp={sp} /> : null}
      {tab === "duplicates" ? <DuplicatesTab page={page} sp={sp} /> : null}
    </div>
  )
}

/* ---------------------------------- queue --------------------------------- */

async function QueueTab({ page, sp }: { page: number; sp: SearchParams }) {
  const status = param(sp.status)
  const [rows, total] = await listQueueItems(status, page)
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <FilterSelect name="status" label="Status" options={QUEUE_STATUS_OPTIONS} value={status} />
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Queue is clear"
          hint="Flagged listings, reviews and users will appear here for review."
        />
      ) : (
        <>
          <DataTable>
            <THeadRow>
              <th className={th}>Subject</th>
              <th className={th}>Reason</th>
              <th className={`${th} text-right`}>Fraud score</th>
              <th className={th}>Priority</th>
              <th className={th}>Status</th>
              <th className={th}>Assigned</th>
              <th className={th}>Created</th>
              <th className={th}>Actions</th>
            </THeadRow>
            <tbody>
              {rows.map((r) => {
                const actionable = r.status === "pending" || r.status === "in_review"
                const href = subjectHref(r.subjectKind, r.subjectId)
                return (
                  <TRow key={r.id}>
                    <td className={`${td} whitespace-nowrap`}>
                      <span className="font-bold text-sv-ink">
                        {r.subjectKind.replaceAll("_", " ")}
                      </span>
                      {href ? (
                        <Link
                          href={href}
                          className="mt-0.5 block font-mono text-[12px] text-sv-ink/45 transition-colors hover:text-sv-blue"
                        >
                          {shortRef(r.subjectId)}
                        </Link>
                      ) : (
                        <span className="mt-0.5 block font-mono text-[12px] text-sv-ink/45">
                          {shortRef(r.subjectId)}
                        </span>
                      )}
                    </td>
                    <td className={td}>
                      <span className="block max-w-[260px] truncate" title={r.reason}>
                        {r.reason}
                      </span>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{fmtDecimal(r.fraudScore)}</td>
                    <td className={td}>
                      <StatusPill status={r.priority} />
                    </td>
                    <td className={td}>
                      <StatusPill status={r.status} />
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{userLabel(r.assignedTo)}</td>
                    <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                      {fmtDate(r.createdAt)}
                    </td>
                    <td className={td}>
                      {actionable ? (
                        <div className="flex flex-wrap gap-1.5">
                          <ConfirmButton
                            action={decideQueueItem}
                            fields={{ id: r.id, decision: "approve" }}
                            label="Approve"
                            tone="primary"
                          />
                          <ConfirmButton
                            action={decideQueueItem}
                            fields={{ id: r.id, decision: "reject" }}
                            label="Reject"
                            tone="danger"
                            confirm="Reject this item?"
                          />
                          <ConfirmButton
                            action={decideQueueItem}
                            fields={{ id: r.id, decision: "hide" }}
                            label="Hide"
                            tone="warning"
                            confirm="Hide this content from the platform?"
                          />
                          <ConfirmButton
                            action={decideQueueItem}
                            fields={{ id: r.id, decision: "delete" }}
                            label="Delete"
                            tone="danger"
                            confirm="Delete this content? This cannot be undone."
                          />
                          <ConfirmButton
                            action={decideQueueItem}
                            fields={{ id: r.id, decision: "escalate" }}
                            label="Escalate"
                          />
                        </div>
                      ) : (
                        <span className="text-[12px] text-sv-ink/30">—</span>
                      )}
                    </td>
                  </TRow>
                )
              })}
            </tbody>
          </DataTable>
          <Pagination
            basePath="/admin/moderation"
            page={page}
            pageSize={ADMIN_PAGE_SIZE}
            total={total}
            params={sp}
          />
        </>
      )}
    </div>
  )
}

/* -------------------------------- complaints ------------------------------- */

async function ComplaintsTab({ page, sp }: { page: number; sp: SearchParams }) {
  const filters = {
    kind: param(sp.kind),
    status: param(sp.status),
    priority: param(sp.priority),
    q: param(sp.q),
  }
  const [rows, total] = await listComplaints(filters, page)
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-3">
        <SearchForm
          action="/admin/moderation"
          params={sp}
          placeholder="Search ID, subject, reporter…"
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FilterSelect name="kind" label="Kind" options={COMPLAINT_KIND_OPTIONS} value={filters.kind} />
          <FilterSelect name="status" label="Status" options={COMPLAINT_STATUS_OPTIONS} value={filters.status} />
          <FilterSelect name="priority" label="Priority" options={COMPLAINT_PRIORITY_OPTIONS} value={filters.priority} />
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No complaints found"
          hint="User reports about listings, reviews or other users will appear here."
        />
      ) : (
        <>
          <DataTable>
            <THeadRow>
              <th className={th}>ID</th>
              <th className={th}>Kind</th>
              <th className={th}>Subject</th>
              <th className={th}>Description</th>
              <th className={th}>Reporter</th>
              <th className={th}>Priority</th>
              <th className={th}>Status</th>
              <th className={th}>Assigned</th>
              <th className={th}>Created</th>
              <th className={th}>Actions</th>
            </THeadRow>
            <tbody>
              {rows.map((r) => {
                const open = r.status === "open" || r.status === "under_review"
                const href = subjectHref(r.subjectKind, r.subjectId)
                return (
                  <TRow key={r.id}>
                    <td className={`${td} font-mono text-[12.5px] whitespace-nowrap`}>
                      {shortRef(r.shortId)}
                    </td>
                    <td className={td}>
                      <StatusPill status={r.kind} />
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      <span className="font-bold text-sv-ink">
                        {r.subjectKind.replaceAll("_", " ")}
                      </span>
                      {href ? (
                        <Link
                          href={href}
                          className="mt-0.5 block font-mono text-[12px] text-sv-ink/45 transition-colors hover:text-sv-blue"
                        >
                          {shortRef(r.subjectId)}
                        </Link>
                      ) : (
                        <span className="mt-0.5 block font-mono text-[12px] text-sv-ink/45">
                          {shortRef(r.subjectId)}
                        </span>
                      )}
                    </td>
                    <td className={td}>
                      {r.description ? (
                        <span
                          className="line-clamp-2 block max-w-[260px] text-[12.5px] text-sv-ink/70"
                          title={r.description}
                        >
                          {r.description}
                        </span>
                      ) : (
                        <span className="text-[12px] text-sv-ink/30">—</span>
                      )}
                    </td>
                    <td className={`${td} max-w-[200px] truncate`}>
                      {r.reporter ? userLabel(r.reporter) : (r.reporterEmail ?? "—")}
                    </td>
                    <td className={td}>
                      <StatusPill status={r.priority} />
                    </td>
                    <td className={td}>
                      <StatusPill status={r.status} />
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{userLabel(r.assignedTo)}</td>
                    <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                      {fmtDate(r.createdAt)}
                    </td>
                    <td className={td}>
                      {open ? (
                        <div className="flex flex-col gap-1.5">
                          <div>
                            <ConfirmButton
                              action={assignComplaint}
                              fields={{ id: r.id }}
                              label="Assign to me"
                            />
                          </div>
                          <form action={setComplaintStatus} className="flex items-center gap-1.5">
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="status" value="resolved" />
                            <input
                              name="resolution"
                              placeholder="Resolution note…"
                              className={`${rowInputCls} w-[140px]`}
                            />
                            <button type="submit" className={rowBtnPrimary}>
                              Resolve
                            </button>
                          </form>
                          <form action={setComplaintStatus} className="flex items-center gap-1.5">
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="status" value="dismissed" />
                            <input
                              name="resolution"
                              placeholder="Dismissal note…"
                              className={`${rowInputCls} w-[140px]`}
                            />
                            <button type="submit" className={rowBtnGhost}>
                              Dismiss
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-[12px] text-sv-ink/30">—</span>
                      )}
                    </td>
                  </TRow>
                )
              })}
            </tbody>
          </DataTable>
          <Pagination
            basePath="/admin/moderation"
            page={page}
            pageSize={ADMIN_PAGE_SIZE}
            total={total}
            params={sp}
          />
        </>
      )}
    </div>
  )
}

/* ---------------------------------- fraud --------------------------------- */

async function FraudTab({ page, sp }: { page: number; sp: SearchParams }) {
  const [[signals, total], activity] = await Promise.all([
    listUnresolvedFraudSignals(page),
    listSuspiciousActivity(),
  ])
  return (
    <div className="space-y-8">
      <section>
        <SectionHeading
          title="Unresolved signals"
          hint="Active fraud signals ordered by severity — resolve once reviewed"
        />
        {signals.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="No unresolved signals"
            hint="Signals raised by the fraud detector will appear here."
          />
        ) : (
          <>
            <DataTable>
              <THeadRow>
                <th className={`${th} text-right`}>Severity</th>
                <th className={th}>Signal</th>
                <th className={th}>Subject</th>
                <th className={`${th} text-right`}>Confidence</th>
                <th className={th}>Detected</th>
                <th className={th}>Actions</th>
              </THeadRow>
              <tbody>
                {signals.map((s) => (
                  <TRow key={s.id.toString()}>
                    <td className={`${td} text-right`}>
                      <span
                        className={`font-bold tabular-nums ${s.severity >= 4 ? "text-rose-600" : "text-sv-ink"}`}
                      >
                        {s.severity}
                      </span>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      {s.signalKind.replaceAll("_", " ")}
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      <span className="font-bold text-sv-ink">
                        {s.subjectKind.replaceAll("_", " ")}
                      </span>
                      <span className="mt-0.5 block font-mono text-[12px] text-sv-ink/45">
                        {shortRef(s.subjectId)}
                      </span>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>
                      {fmtDecimal(s.confidence, 3)}
                    </td>
                    <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                      {fmtDate(s.detectedAt)}
                    </td>
                    <td className={td}>
                      <form action={resolveFraudSignal} className="flex items-center gap-1.5">
                        <input type="hidden" name="id" value={s.id.toString()} />
                        <input
                          name="resolution"
                          placeholder="Resolution note…"
                          className={`${rowInputCls} w-[140px]`}
                        />
                        <button type="submit" className={rowBtnPrimary}>
                          Resolve
                        </button>
                      </form>
                    </td>
                  </TRow>
                ))}
              </tbody>
            </DataTable>
            <Pagination
              basePath="/admin/moderation"
              page={page}
              pageSize={ADMIN_PAGE_SIZE}
              total={total}
              params={sp}
            />
          </>
        )}
      </section>

      <section>
        <SectionHeading
          title="Suspicious activity"
          hint="Most recent 25 events — read-only audit tail"
        />
        {activity.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="No suspicious activity"
            hint="Rate-limit hits, session anomalies and similar events will appear here."
          />
        ) : (
          <DataTable>
            <THeadRow>
              <th className={th}>User</th>
              <th className={th}>Kind</th>
              <th className={th}>IP</th>
              <th className={th}>Device</th>
              <th className={th}>Occurred</th>
            </THeadRow>
            <tbody>
              {activity.map((a) => (
                <TRow key={a.id.toString()}>
                  <td className={`${td} max-w-[200px] truncate`}>{userLabel(a.user)}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    {a.activityKind.replaceAll("_", " ")}
                  </td>
                  <td className={`${td} font-mono text-[12.5px] whitespace-nowrap`}>
                    {a.ipAddress ?? "—"}
                  </td>
                  <td className={`${td} font-mono text-[12.5px] whitespace-nowrap`}>
                    {a.deviceFingerprint ? shortRef(a.deviceFingerprint) : "—"}
                  </td>
                  <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                    {timeAgo(a.occurredAt)}
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

/* ---------------------------------- bans ---------------------------------- */

type BlocklistRow = {
  reason: string | null
  blockedAt: Date
  blockedBy: { name: string | null; email: string } | null
}

function blockRows<T extends BlocklistRow>(rows: readonly T[], keyOf: (r: T) => string) {
  return rows.map((r) => ({
    key: keyOf(r),
    reason: r.reason,
    blockedBy: userLabel(r.blockedBy),
    blockedAt: r.blockedAt,
  }))
}

function BlocklistPanel({
  title,
  kind,
  values,
  hashDisplay,
}: {
  title: string
  kind: BlocklistKind
  values: { key: string; reason: string | null; blockedBy: string; blockedAt: Date }[]
  /** Hashed/fingerprint values are shown truncated. */
  hashDisplay?: boolean
}) {
  return (
    <div className="rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-4 shadow-[var(--shadow-card)]">
      <h3 className="mb-3 text-[13.5px] font-extrabold text-sv-ink">{title}</h3>
      <form action={addBlocklistEntry} className="mb-3 flex flex-wrap items-center gap-2">
        <input type="hidden" name="kind" value={kind} />
        <input
          name="value"
          required
          placeholder={kind === "email" ? "Email (stored hashed)" : "Value"}
          className={`${rowInputCls} min-w-[140px] flex-1`}
        />
        <input name="reason" placeholder="Reason (optional)" className={`${rowInputCls} flex-1`} />
        <button type="submit" className={rowBtnGhost}>
          Add
        </button>
      </form>
      {values.length === 0 ? (
        <p className="text-[12.5px] text-sv-ink/40">No entries.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-sv-ink/8">
                <th className={th}>Value</th>
                <th className={th}>Reason</th>
                <th className={th}>Blocked by</th>
                <th className={th}>Blocked at</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {values.map((v) => (
                <tr key={v.key} className="border-b border-sv-ink/5 last:border-0">
                  <td className={`${td} font-mono text-[12.5px] whitespace-nowrap`}>
                    {hashDisplay ? shortRef(v.key) : v.key}
                  </td>
                  <td className={td}>
                    <span className="block max-w-[140px] truncate">{v.reason ?? "—"}</span>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{v.blockedBy}</td>
                  <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                    {fmtDate(v.blockedAt)}
                  </td>
                  <td className={td}>
                    <ConfirmButton
                      action={removeBlocklistEntry}
                      fields={{ kind, value: v.key }}
                      label="Remove"
                      confirm={`Remove this ${kind} from the blocklist?`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

async function BansTab({ page, sp }: { page: number; sp: SearchParams }) {
  const [[bans, total], [phones, emails, ips, devices]] = await Promise.all([
    listActiveShadowBans(page),
    listBlocklists(),
  ])
  return (
    <div className="space-y-8">
      <section>
        <SectionHeading
          title="Active shadow bans"
          hint="Banned users keep a normal-looking session but their actions are muted"
        />
        <form
          action={createShadowBan}
          className="mb-4 flex flex-wrap items-end gap-4 rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-4 shadow-[var(--shadow-card)]"
        >
          <label className={formLabelCls}>
            User ID
            <input name="userId" required maxLength={120} className={formInputCls} />
          </label>
          <label className={`${formLabelCls} min-w-[220px] flex-1`}>
            Reason
            <input name="reason" required className={formInputCls} />
          </label>
          <label className={formLabelCls}>
            Scope
            <select name="scope" className={formInputCls}>
              {SHADOW_BAN_SCOPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={formSubmitCls}>
            Create shadow ban
          </button>
        </form>
        {bans.length === 0 ? (
          <EmptyState
            icon={Ban}
            title="No active shadow bans"
            hint="Shadow bans created above will appear here."
          />
        ) : (
          <>
            <DataTable>
              <THeadRow>
                <th className={th}>User</th>
                <th className={th}>Scope</th>
                <th className={th}>Reason</th>
                <th className={th}>Banned by</th>
                <th className={th}>Banned at</th>
                <th className={th}>Actions</th>
              </THeadRow>
              <tbody>
                {bans.map((b) => (
                  <TRow key={b.id}>
                    <td className={`${td} max-w-[200px] truncate font-bold text-sv-ink`}>
                      {userLabel(b.user)}
                    </td>
                    <td className={td}>
                      <StatusPill status={b.scope} />
                    </td>
                    <td className={td}>
                      <span className="block max-w-[240px] truncate" title={b.reason}>
                        {b.reason}
                      </span>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{userLabel(b.bannedBy)}</td>
                    <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                      {fmtDate(b.bannedAt)}
                    </td>
                    <td className={td}>
                      <ConfirmButton
                        action={liftShadowBan}
                        fields={{ id: b.id }}
                        label="Lift ban"
                        tone="danger"
                        confirm={`Lift the shadow ban for ${userLabel(b.user)}?`}
                      />
                    </td>
                  </TRow>
                ))}
              </tbody>
            </DataTable>
            <Pagination
              basePath="/admin/moderation"
              page={page}
              pageSize={ADMIN_PAGE_SIZE}
              total={total}
              params={sp}
            />
          </>
        )}
      </section>

      <section>
        <SectionHeading
          title="Blocklists"
          hint="Phones, emails (hashed), IPs and devices blocked from the platform"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <BlocklistPanel title="Phones" kind="phone" values={blockRows(phones, (r) => r.phone)} />
          <BlocklistPanel
            title="Emails"
            kind="email"
            values={blockRows(emails, (r) => r.emailHash)}
            hashDisplay
          />
          <BlocklistPanel title="IPs" kind="ip" values={blockRows(ips, (r) => r.ipAddress)} />
          <BlocklistPanel
            title="Devices"
            kind="device"
            values={blockRows(devices, (r) => r.deviceFingerprint)}
            hashDisplay
          />
        </div>
      </section>
    </div>
  )
}

/* -------------------------------- duplicates ------------------------------- */

async function DuplicatesTab({ page, sp }: { page: number; sp: SearchParams }) {
  const [rows, total] = await listDuplicateClusters(page)
  return (
    <div>
      {rows.length === 0 ? (
        <EmptyState
          icon={Copy}
          title="No duplicate clusters"
          hint="Listings detected as duplicates of each other will be grouped here."
        />
      ) : (
        <>
          <DataTable>
            <THeadRow>
              <th className={th}>Representative listing</th>
              <th className={`${th} text-right`}>Members</th>
              <th className={th}>Method</th>
              <th className={`${th} text-right`}>Confidence</th>
              <th className={th}>Created</th>
            </THeadRow>
            <tbody>
              {rows.map((c) => (
                <TRow key={c.id}>
                  <td className={`${td} max-w-[280px]`}>
                    {c.representativeListing ? (
                      <Link
                        href={`/admin/listings/${c.representativeListing.id}`}
                        className="block truncate font-bold text-sv-ink transition-colors hover:text-sv-blue"
                      >
                        {c.representativeListing.title}
                      </Link>
                    ) : (
                      <span className="text-sv-ink/30">—</span>
                    )}
                  </td>
                  <td className={`${td} text-right tabular-nums`}>{c.memberCount}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    {c.detectionMethod.replaceAll("_", " ")}
                  </td>
                  <td className={`${td} text-right tabular-nums`}>
                    {fmtDecimal(c.confidence, 3)}
                  </td>
                  <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                    {fmtDate(c.createdAt)}
                  </td>
                </TRow>
              ))}
            </tbody>
          </DataTable>
          <Pagination
            basePath="/admin/moderation"
            page={page}
            pageSize={ADMIN_PAGE_SIZE}
            total={total}
            params={sp}
          />
        </>
      )}
    </div>
  )
}
