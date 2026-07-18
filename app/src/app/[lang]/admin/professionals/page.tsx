import { Building, Building2, Check, HardHat, Users } from "lucide-react"

import {
  activateDraftProjects,
  restoreProfessional,
  setProfessionalVerified,
  softDeleteProfessional,
  type ProfessionalKind,
} from "@/app/[lang]/admin/professionals/actions"
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { FilterSelect } from "@/components/admin/ui/FilterSelect"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { SearchForm } from "@/components/admin/ui/SearchForm"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import { TabLinks } from "@/components/admin/ui/TabLinks"
import { fmtDate, fmtMoney, fmtNum } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"
import {
  ADMIN_PAGE_SIZE,
  hrefWithParams,
  mergeParams,
  param,
  parsePage,
  type SearchParams,
} from "@/lib/admin/query"
import { db } from "@/lib/db"

export const metadata = { title: "Professionals" }

const KIND_TABS = [
  { value: "agents", label: "Agents" },
  { value: "agencies", label: "Agencies" },
  { value: "developers", label: "Developers" },
  { value: "projects", label: "Projects" },
] as const

const STATE_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "deleted", label: "Deleted" },
  { value: "all", label: "All" },
] as const

/** Project-directory workflow status (korter imports land as draft). */
const PROJECT_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
] as const

function isKind(v: string): v is ProfessionalKind {
  return (KIND_TABS as readonly { value: string }[]).some((t) => t.value === v)
}

/** deletedAt filter shared by all four kinds. */
function stateWhere(state: string) {
  if (state === "deleted") return { deletedAt: { not: null } } as const
  if (state === "all") return {} as const
  return { deletedAt: null } as const
}

function RowActions({
  kind,
  id,
  deleted,
  verified,
}: {
  kind: ProfessionalKind
  id: string
  deleted: boolean
  /** Verify/Unverify is only rendered when a boolean is passed (agents, agencies). */
  verified?: boolean
}) {
  if (deleted) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusPill status="archived" />
        <ConfirmButton action={restoreProfessional} fields={{ kind, id }} label="Restore" />
      </div>
    )
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {typeof verified === "boolean" ? (
        <ConfirmButton
          action={setProfessionalVerified}
          fields={{ kind, id, verified: verified ? "false" : "true" }}
          label={verified ? "Unverify" : "Verify"}
          tone={verified ? "ghost" : "primary"}
        />
      ) : null}
      <ConfirmButton
        action={softDeleteProfessional}
        fields={{ kind, id }}
        label="Delete"
        tone="danger"
        confirm="Soft-delete this record?"
      />
    </div>
  )
}

export default async function AdminProfessionalsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()
  const sp = await searchParams
  const kindRaw = param(sp.kind)
  const kind: ProfessionalKind = isKind(kindRaw) ? kindRaw : "agents"
  const page = parsePage(sp.page)
  const q = param(sp.q)
  const state = param(sp.state) || "active"
  const status = kind === "projects" ? param(sp.status) : ""

  const tabs = KIND_TABS.map((t) => ({
    href: hrefWithParams(
      "/admin/professionals",
      mergeParams(sp, {
        kind: t.value === "agents" ? undefined : t.value,
        page: undefined,
        q: undefined,
        state: undefined,
      }),
    ),
    label: t.label,
    active: kind === t.value,
  }))

  return (
    <div>
      <PageHeader
        title="Professionals"
        description="Agents, agencies, developers and new-build projects"
      />

      <TabLinks items={tabs} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchForm
          action="/admin/professionals"
          params={sp}
          placeholder="Search name…"
        />
        <FilterSelect name="state" label="State" options={STATE_OPTIONS} value={state} />
        {kind === "projects" ? (
          <FilterSelect
            name="status"
            label="Status"
            options={PROJECT_STATUS_OPTIONS}
            value={status}
          />
        ) : null}
      </div>

      {kind === "agents" ? <AgentsTab page={page} q={q} state={state} sp={sp} /> : null}
      {kind === "agencies" ? <AgenciesTab page={page} q={q} state={state} sp={sp} /> : null}
      {kind === "developers" ? <DevelopersTab page={page} q={q} state={state} sp={sp} /> : null}
      {kind === "projects" ? (
        <ProjectsTab page={page} q={q} state={state} status={status} sp={sp} />
      ) : null}
    </div>
  )
}

type TabProps = { page: number; q: string; state: string; status?: string; sp: SearchParams }

/* ---------------------------------- agents --------------------------------- */

async function AgentsTab({ page, q, state, sp }: TabProps) {
  const where = {
    ...stateWhere(state),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  }
  const [rows, total] = await Promise.all([
    db.agentProfile.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.agentProfile.count({ where }),
  ])
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No agents found"
        hint="Try widening the search or switching the state filter."
      />
    )
  }
  return (
    <>
      <DataTable>
        <THeadRow>
          <th className={th}>Name</th>
          <th className={`${th} text-right`}>Listings</th>
          <th className={th}>Rating</th>
          <th className={th}>Verified</th>
          <th className={th}>Created</th>
          <th className={th}>Actions</th>
        </THeadRow>
        <tbody>
          {rows.map((a) => (
            <TRow key={a.id}>
              <td className={td}>
                <span className="block font-bold text-sv-ink">{a.name}</span>
                <span className="mt-0.5 block text-[12px] text-sv-ink/45">{a.agency}</span>
              </td>
              <td className={`${td} text-right tabular-nums`}>{fmtNum(a.listingsCount)}</td>
              <td className={`${td} whitespace-nowrap`}>
                <span className="block font-bold text-sv-ink tabular-nums">
                  ★ {a.rating.toFixed(1)}
                </span>
                <span className="mt-0.5 block text-[12px] text-sv-ink/45 tabular-nums">
                  {fmtNum(a.reviewsCount)} reviews
                </span>
              </td>
              <td className={td}>
                <VerifiedMark verified={a.verified} />
              </td>
              <td className={`${td} whitespace-nowrap text-sv-ink/55`}>{fmtDate(a.createdAt)}</td>
              <td className={td}>
                <RowActions kind="agents" id={a.id} deleted={!!a.deletedAt} verified={a.verified} />
              </td>
            </TRow>
          ))}
        </tbody>
      </DataTable>
      <Pagination
        basePath="/admin/professionals"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        params={sp}
      />
    </>
  )
}

/* --------------------------------- agencies -------------------------------- */

async function AgenciesTab({ page, q, state, sp }: TabProps) {
  const where = {
    ...stateWhere(state),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  }
  const [rows, total] = await Promise.all([
    db.agencyProfile.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.agencyProfile.count({ where }),
  ])
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No agencies found"
        hint="Try widening the search or switching the state filter."
      />
    )
  }
  return (
    <>
      <DataTable>
        <THeadRow>
          <th className={th}>Name</th>
          <th className={th}>Rating</th>
          <th className={th}>Verified</th>
          <th className={th}>Created</th>
          <th className={th}>Actions</th>
        </THeadRow>
        <tbody>
          {rows.map((a) => (
            <TRow key={a.id}>
              <td className={td}>
                <span className="block font-bold text-sv-ink">{a.name}</span>
                <span className="mt-0.5 block text-[12px] text-sv-ink/45">{a.city}</span>
              </td>
              <td className={`${td} whitespace-nowrap`}>
                <span className="block font-bold text-sv-ink tabular-nums">
                  ★ {a.rating.toFixed(1)}
                </span>
                <span className="mt-0.5 block text-[12px] text-sv-ink/45 tabular-nums">
                  {fmtNum(a.reviewsCount)} reviews
                </span>
              </td>
              <td className={td}>
                <VerifiedMark verified={a.verified} />
              </td>
              <td className={`${td} whitespace-nowrap text-sv-ink/55`}>{fmtDate(a.createdAt)}</td>
              <td className={td}>
                <RowActions
                  kind="agencies"
                  id={a.id}
                  deleted={!!a.deletedAt}
                  verified={a.verified}
                />
              </td>
            </TRow>
          ))}
        </tbody>
      </DataTable>
      <Pagination
        basePath="/admin/professionals"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        params={sp}
      />
    </>
  )
}

/* -------------------------------- developers ------------------------------- */

async function DevelopersTab({ page, q, state, sp }: TabProps) {
  const where = {
    ...stateWhere(state),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  }
  const [rows, total] = await Promise.all([
    db.developerProfile.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.developerProfile.count({ where }),
  ])
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={HardHat}
        title="No developers found"
        hint="Try widening the search or switching the state filter."
      />
    )
  }
  return (
    <>
      <DataTable>
        <THeadRow>
          <th className={th}>Name</th>
          <th className={`${th} text-right`}>Projects</th>
          <th className={`${th} text-right`}>Completed</th>
          <th className={th}>Rating</th>
          <th className={th}>Created</th>
          <th className={th}>Actions</th>
        </THeadRow>
        <tbody>
          {rows.map((d) => (
            <TRow key={d.id}>
              <td className={td}>
                <span className="block font-bold text-sv-ink">{d.name}</span>
                <span className="mt-0.5 block text-[12px] text-sv-ink/45">{d.headquarters}</span>
              </td>
              <td className={`${td} text-right tabular-nums`}>{fmtNum(d.projectsCount)}</td>
              <td className={`${td} text-right tabular-nums`}>{fmtNum(d.completedCount)}</td>
              <td className={`${td} whitespace-nowrap font-bold text-sv-ink tabular-nums`}>
                ★ {d.rating.toFixed(1)}
              </td>
              <td className={`${td} whitespace-nowrap text-sv-ink/55`}>{fmtDate(d.createdAt)}</td>
              <td className={td}>
                <RowActions kind="developers" id={d.id} deleted={!!d.deletedAt} />
              </td>
            </TRow>
          ))}
        </tbody>
      </DataTable>
      <Pagination
        basePath="/admin/professionals"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        params={sp}
      />
    </>
  )
}

/* --------------------------------- projects -------------------------------- */

async function ProjectsTab({ page, q, state, status = "", sp }: TabProps) {
  const where = {
    ...stateWhere(state),
    ...(status ? { status } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  }
  const [rows, total] = await Promise.all([
    db.projectDirectory.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.projectDirectory.count({ where }),
  ])
  return (
    <>
      {status === "draft" && total > 0 ? (
        <div className="mb-3 flex items-center gap-3 rounded-[var(--radius-card)] border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[13px] font-semibold text-amber-800">
            {fmtNum(total)} draft projects from the korter import
            {q ? ` matching “${q}”` : ""} — hidden from the public site.
          </p>
          <ConfirmButton
            action={activateDraftProjects}
            fields={{ q }}
            label={`Activate all (${fmtNum(total)})`}
            tone="primary"
            confirm={`Activate ALL ${total} draft projects${q ? ` matching “${q}”` : ""}? They go live on /projects.`}
          />
        </div>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No projects found"
          hint="Try widening the search or switching the state filter."
        />
      ) : (
        <>
          <DataTable>
        <THeadRow>
          <th className={th}>Name</th>
          <th className={th}>City</th>
          <th className={th}>Status</th>
          <th className={`${th} text-right`}>Price from</th>
          <th className={`${th} text-right`}>Units</th>
          <th className={th}>Created</th>
          <th className={th}>Actions</th>
        </THeadRow>
        <tbody>
          {rows.map((p) => (
            <TRow key={p.id}>
              <td className={td}>
                <span className="block max-w-[240px] truncate font-bold text-sv-ink">
                  {p.name}
                </span>
                <span className="mt-0.5 block text-[12px] text-sv-ink/45">{p.developer}</span>
              </td>
              <td className={`${td} whitespace-nowrap`}>
                <span className="block">{p.city}</span>
                <span className="mt-0.5 block text-[12px] text-sv-ink/45">{p.district}</span>
              </td>
              <td className={td}>
                <StatusPill status={p.status} />
              </td>
              <td className={`${td} text-right whitespace-nowrap tabular-nums`}>
                {fmtMoney(p.priceFrom)}
              </td>
              <td className={`${td} text-right tabular-nums`}>{fmtNum(p.units)}</td>
              <td className={`${td} whitespace-nowrap text-sv-ink/55`}>{fmtDate(p.createdAt)}</td>
              <td className={td}>
                <RowActions kind="projects" id={p.id} deleted={!!p.deletedAt} />
              </td>
            </TRow>
          ))}
        </tbody>
      </DataTable>
      <Pagination
        basePath="/admin/professionals"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        params={sp}
      />
        </>
      )}
    </>
  )
}

/* --------------------------------- shared --------------------------------- */

function VerifiedMark({ verified }: { verified: boolean }) {
  return verified ? (
    <Check className="h-4.5 w-4.5 text-emerald-600" aria-label="Verified" />
  ) : (
    <span className="text-sv-ink/30">—</span>
  )
}
