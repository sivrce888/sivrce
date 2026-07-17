import {
  ComplaintKind,
  ComplaintPriority,
  ComplaintStatus,
  ModerationQueueStatus,
  ShadowBanScope,
} from "@/generated/prisma/enums"
import type { Prisma } from "@/generated/prisma/client"
import { ADMIN_PAGE_SIZE } from "@/lib/admin/query"
import { db } from "@/lib/db"

/* ---------------------------------- tabs --------------------------------- */

export const MODERATION_TABS = [
  { value: "queue", label: "Queue" },
  { value: "complaints", label: "Complaints" },
  { value: "fraud", label: "Fraud" },
  { value: "bans", label: "Bans" },
  { value: "duplicates", label: "Duplicates" },
] as const

export type ModerationTab = (typeof MODERATION_TABS)[number]["value"]

export function isModerationTab(v: string): v is ModerationTab {
  return (MODERATION_TABS as readonly { value: string }[]).some((t) => t.value === v)
}

/* ------------------------------ enum options ------------------------------ */

function enumOptions<T extends string>(values: readonly T[]) {
  return values.map((v) => ({
    value: v,
    label: v.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  }))
}

export const QUEUE_STATUS_OPTIONS = enumOptions(Object.values(ModerationQueueStatus))
export const COMPLAINT_KIND_OPTIONS = enumOptions(Object.values(ComplaintKind))
export const COMPLAINT_STATUS_OPTIONS = enumOptions(Object.values(ComplaintStatus))
export const COMPLAINT_PRIORITY_OPTIONS = enumOptions(Object.values(ComplaintPriority))
export const SHADOW_BAN_SCOPE_OPTIONS = enumOptions(Object.values(ShadowBanScope))

const queueStatusValues = Object.values(ModerationQueueStatus) as string[]
const complaintKindValues = Object.values(ComplaintKind) as string[]
const complaintStatusValues = Object.values(ComplaintStatus) as string[]
const complaintPriorityValues = Object.values(ComplaintPriority) as string[]

export function isQueueStatus(v: string): v is ModerationQueueStatus {
  return queueStatusValues.includes(v)
}
export function isComplaintKind(v: string): v is ComplaintKind {
  return complaintKindValues.includes(v)
}
export function isComplaintStatus(v: string): v is ComplaintStatus {
  return complaintStatusValues.includes(v)
}
export function isComplaintPriority(v: string): v is ComplaintPriority {
  return complaintPriorityValues.includes(v)
}

/* --------------------------------- helpers -------------------------------- */

export const BLOCKLIST_KINDS = ["phone", "email", "ip", "device"] as const
export type BlocklistKind = (typeof BLOCKLIST_KINDS)[number]

export function userLabel(u: { name: string | null; email: string } | null): string {
  if (!u) return "—"
  return u.name ?? u.email
}

/** Truncate long opaque ids for table display. */
export function shortRef(id: string): string {
  return id.length <= 14 ? id : `${id.slice(0, 10)}…`
}

/** Prisma Decimal → fixed string (structural type keeps Decimal out of imports). */
export function fmtDecimal(d: { toString(): string } | null, digits = 2): string {
  if (!d) return "—"
  const n = Number(d.toString())
  return Number.isFinite(n) ? n.toFixed(digits) : "—"
}

/* --------------------------------- queries -------------------------------- */

const USER_SELECT = { select: { name: true, email: true } } as const

export function getModerationCounts() {
  return Promise.all([
    db.moderationQueue.count({ where: { status: ModerationQueueStatus.pending } }),
    db.complaint.count({
      where: { status: { in: [ComplaintStatus.open, ComplaintStatus.under_review] } },
    }),
    db.fraudSignal.count({ where: { isActive: true, resolvedAt: null } }),
    db.shadowBan.count({ where: { active: true } }),
    db.duplicateCluster.count(),
  ])
}

export function listQueueItems(status: string, page: number) {
  const where = isQueueStatus(status) ? { status } : {}
  return Promise.all([
    db.moderationQueue.findMany({
      where,
      include: { assignedTo: USER_SELECT, reviewedBy: USER_SELECT },
      // Enum declaration order: pending → in_review → decided, so the open
      // work always surfaces first; within it, urgent + oldest on top.
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.moderationQueue.count({ where }),
  ])
}

export function listComplaints(
  filters: { kind: string; status: string; priority: string; q: string },
  page: number,
) {
  const where: Prisma.ComplaintWhereInput = {}
  if (isComplaintKind(filters.kind)) where.kind = filters.kind
  if (isComplaintStatus(filters.status)) where.status = filters.status
  if (isComplaintPriority(filters.priority)) where.priority = filters.priority
  if (filters.q) {
    where.OR = [
      { shortId: { contains: filters.q, mode: "insensitive" } },
      { subjectId: { contains: filters.q, mode: "insensitive" } },
      { reporterEmail: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ]
  }
  return Promise.all([
    db.complaint.findMany({
      where,
      include: { reporter: USER_SELECT, assignedTo: USER_SELECT },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.complaint.count({ where }),
  ])
}

export function listUnresolvedFraudSignals(page: number) {
  const where = { isActive: true, resolvedAt: null }
  return Promise.all([
    db.fraudSignal.findMany({
      where,
      orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.fraudSignal.count({ where }),
  ])
}

/** Read-only tail of the activity log — capped, not paginated. */
export function listSuspiciousActivity() {
  return db.suspiciousActivityLog.findMany({
    include: { user: USER_SELECT },
    orderBy: { occurredAt: "desc" },
    take: 25,
  })
}

export function listActiveShadowBans(page: number) {
  const where = { active: true }
  return Promise.all([
    db.shadowBan.findMany({
      where,
      include: { user: USER_SELECT, bannedBy: USER_SELECT },
      orderBy: { bannedAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.shadowBan.count({ where }),
  ])
}

/** Blocklists are small reference tables — cap each at the 100 most recent. */
export function listBlocklists() {
  return Promise.all([
    db.blocklistPhone.findMany({
      include: { blockedBy: USER_SELECT },
      orderBy: { blockedAt: "desc" },
      take: 100,
    }),
    db.blocklistEmail.findMany({
      include: { blockedBy: USER_SELECT },
      orderBy: { blockedAt: "desc" },
      take: 100,
    }),
    db.blocklistIp.findMany({
      include: { blockedBy: USER_SELECT },
      orderBy: { blockedAt: "desc" },
      take: 100,
    }),
    db.blocklistDevice.findMany({
      include: { blockedBy: USER_SELECT },
      orderBy: { blockedAt: "desc" },
      take: 100,
    }),
  ])
}

export function listDuplicateClusters(page: number) {
  return Promise.all([
    db.duplicateCluster.findMany({
      include: {
        representativeListing: { select: { id: true, title: true } },
        members: { select: { listingId: true } },
      },
      orderBy: [{ memberCount: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.duplicateCluster.count(),
  ])
}
