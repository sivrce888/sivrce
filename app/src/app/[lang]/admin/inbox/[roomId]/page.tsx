import { ArrowLeft, MessagesSquare } from "lucide-react"
import Link from "next/link"

import { addLeadNote, assignLead, setLeadStage } from "../actions"
import { AiAssist } from "@/components/admin/inbox/AiAssist"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { requireAdmin } from "@/lib/admin/guard"
import { fmtDate } from "@/lib/admin/format"
import { INQUIRY_STATUSES, INQUIRY_STATUS_LABELS } from "@/lib/admin/inquiries"
import { userLabel } from "@/lib/admin/moderation"
import { db } from "@/lib/db"
import { inquiryMetaOf } from "@/lib/chat"

export const metadata = { title: "Thread" }

function formatFacts(facts: Record<string, unknown>): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = []
  if (typeof facts.budgetGEL === "number") out.push({ label: "Budget", value: `${facts.budgetGEL.toLocaleString("en-US")} ₾` })
  if (typeof facts.rooms === "number") out.push({ label: "Rooms", value: String(facts.rooms) })
  if (typeof facts.areaM2 === "number") out.push({ label: "Area", value: `${facts.areaM2} m²` })
  if (typeof facts.timeframe === "string") out.push({ label: "Timeframe", value: facts.timeframe })
  if (facts.urgency === "high") out.push({ label: "Urgency", value: "High" })
  if (typeof facts.intent === "string") out.push({ label: "Intent", value: facts.intent })
  return out
}

export default async function AdminThreadPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  await requireAdmin()
  const { roomId } = await params

  const room = await db.chatRoom.findUnique({
    where: { id: roomId },
    include: {
      listing: { select: { id: true, title: true } },
      participants: { select: { userId: true, role: true } },
    },
  })
  if (!room) {
    return (
      <div>
        <PageHeader title="Thread" description="Not found" />
        <Link href="/admin/inbox?tab=rooms" className="text-[13px] font-bold text-sv-blue hover:underline">
          ← Back to inbox
        </Link>
      </div>
    )
  }

  const [messages, lead, project] = await Promise.all([
    db.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
      take: 300,
      select: { id: true, senderId: true, content: true, kind: true, createdAt: true, deletedAt: true },
    }),
    db.inquiry.findFirst({
      where: { roomId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    room.projectSlug
      ? db.projectDirectory.findFirst({
          where: { slug: room.projectSlug },
          select: { name: true, slug: true },
        })
      : Promise.resolve(null),
  ])

  // Participant rows carry bare ids — resolve identities in one batched read.
  const partIds = room.participants.map((p) => p.userId)
  const [partUsers, admins] = await Promise.all([
    db.user.findMany({
      where: { id: { in: partIds } },
      select: { id: true, name: true, email: true },
    }),
    db.user.findMany({ where: { role: "admin" }, select: { id: true, name: true, email: true } }),
  ])
  const partById = new Map(partUsers.map((u) => [u.id, u]))
  const seatLabel = (userId: string) => {
    const s = room.participants.find((p) => p.userId === userId)
    if (!s) return "unknown"
    const u = partById.get(userId)
    const name = u?.name ?? u?.email ?? "user"
    return s.role === "member" ? name : s.role === "support" ? `staff · ${name}` : `seller · ${name}`
  }
  const buyerUser = partById.get(
    room.participants.find((p) => p.role === "member")?.userId ?? "",
  )

  const meta = lead ? inquiryMetaOf(lead.meta) : null
  const notes = (meta?.notes ?? []) as { at: string; by: string; text: string }[]
  const facts = formatFacts((meta?.facts ?? {}) as Record<string, unknown>)

  return (
    <div>
      <Link
        href="/admin/inbox?tab=rooms"
        className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-sv-ink/60 transition-colors hover:text-sv-blue"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Inbox
      </Link>
      <PageHeader
        title={room.title}
        description={[
          room.listing ? `Listing: ${room.listing.title}` : project ? `Project: ${project.name}` : "Direct / support thread",
          `${messages.length} messages`,
          buyerUser ? `Buyer: ${buyerUser.name ?? buyerUser.email}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Transcript — read-only: staff work the lead, the seller owns the thread */}
        <div className="rounded-module border border-sv-ink/10 bg-sv-surface p-4">
          <ol className="space-y-3">
            {messages.length === 0 && (
              <li className="text-[13px] font-semibold text-sv-ink/50">No messages yet.</li>
            )}
            {messages.map((m) => (
              <li key={m.id} className="text-[13.5px] leading-relaxed">
                <div className="text-[11.5px] font-bold text-sv-ink/50">
                  {seatLabel(m.senderId)} · {fmtDate(m.createdAt)}
                </div>
                <div className={m.deletedAt ? "text-sv-ink/35 italic" : "text-sv-ink"}>
                  {m.deletedAt ? "message unsent by author" : m.content}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Lead panel */}
        <div className="space-y-4">
          {lead ? (
            <div className="rounded-module border border-sv-ink/10 bg-sv-surface p-4">
              <h2 className="mb-3 text-[13.5px] font-black text-sv-ink">Lead</h2>
              <dl className="space-y-1.5 text-[12.5px]">
                <div className="flex justify-between gap-2">
                  <dt className="font-bold text-sv-ink/50">Buyer</dt>
                  <dd className="truncate text-right text-sv-ink">{lead.buyerName}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-bold text-sv-ink/50">Email</dt>
                  <dd className="truncate text-right text-sv-ink">{lead.buyerEmail}</dd>
                </div>
                {lead.buyerPhone && (
                  <div className="flex justify-between gap-2">
                    <dt className="font-bold text-sv-ink/50">Phone</dt>
                    <dd className="text-right text-sv-ink">{lead.buyerPhone}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="font-bold text-sv-ink/50">Source</dt>
                  <dd className="text-sv-ink">{lead.source}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-bold text-sv-ink/50">Created</dt>
                  <dd className="text-sv-ink">{fmtDate(lead.createdAt)}</dd>
                </div>
                {meta?.firstResponseAt && (
                  <div className="flex justify-between gap-2">
                    <dt className="font-bold text-sv-ink/50">First response</dt>
                    <dd className="text-sv-ink">{fmtDate(new Date(meta.firstResponseAt))}</dd>
                  </div>
                )}
              </dl>

              {facts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {facts.map((f) => (
                    <span key={f.label} className="rounded-full bg-sv-blue/10 px-2 py-0.5 text-[11px] font-black text-sv-blue">
                      {f.label}: {f.value}
                    </span>
                  ))}
                </div>
              )}

              <form action={setLeadStage} className="mt-4 flex items-center gap-1.5">
                <input type="hidden" name="id" value={lead.id} />
                <select
                  name="status"
                  defaultValue={lead.status}
                  aria-label="Lead stage"
                  className="flex-1 rounded-control border border-sv-ink/10 bg-sv-surface px-2 py-1.5 text-[12.5px] font-bold text-sv-ink"
                >
                  {INQUIRY_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {INQUIRY_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <button type="submit" className="rounded-control bg-sv-blue px-3 py-1.5 text-[12px] font-bold text-white hover:bg-sv-blue-deep">
                  Set stage
                </button>
              </form>

              <form action={assignLead} className="mt-2 flex items-center gap-1.5">
                <input type="hidden" name="id" value={lead.id} />
                <select
                  name="assignedTo"
                  defaultValue={lead.assignedToId ?? ""}
                  aria-label="Assigned staff"
                  className="flex-1 rounded-control border border-sv-ink/10 bg-sv-surface px-2 py-1.5 text-[12.5px] font-bold text-sv-ink"
                >
                  <option value="">Unassigned</option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {userLabel(a)}
                    </option>
                  ))}
                </select>
                <button type="submit" className="rounded-control bg-sv-blue px-3 py-1.5 text-[12px] font-bold text-white hover:bg-sv-blue-deep">
                  Assign
                </button>
              </form>

              <div className="mt-4">
                <h3 className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-sv-ink/50">
                  Internal notes
                </h3>
                {notes.length === 0 && <p className="text-[12px] text-sv-ink/45">None yet.</p>}
                <ul className="space-y-1.5">
                  {notes.map((n, i) => (
                    <li key={i} className="rounded-control bg-sv-ink/[0.04] px-2.5 py-1.5 text-[12px] text-sv-ink">
                      <span className="font-bold text-sv-ink/60">{n.by} · {fmtDate(new Date(n.at))}</span>
                      <br />
                      {n.text}
                    </li>
                  ))}
                </ul>
                <form action={addLeadNote} className="mt-2 space-y-1.5">
                  <input type="hidden" name="id" value={lead.id} />
                  <textarea
                    name="note"
                    rows={2}
                    maxLength={500}
                    required
                    placeholder="Internal note (never shown to the buyer)…"
                    className="w-full rounded-control border border-sv-ink/10 bg-sv-surface px-2.5 py-1.5 text-[12.5px] text-sv-ink outline-none focus:ring-2 focus:ring-sv-blue"
                  />
                  <button type="submit" className="text-[12px] font-bold text-sv-blue hover:underline">
                    Add note
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="rounded-module border border-sv-ink/10 bg-sv-surface p-4 text-[12.5px] font-semibold text-sv-ink/55">
              <MessagesSquare className="mb-1.5 h-4 w-4 text-sv-ink/40" aria-hidden />
              No lead attached to this thread.
            </div>
          )}

          <AiAssist roomId={roomId} />
        </div>
      </div>
    </div>
  )
}
