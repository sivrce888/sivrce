"use client"

import { useRef, useState } from "react"
import { Calendar, Clock, User, Phone, Mail, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/context"

interface TourBookingProps {
  listingId: string
  listingTitle: string
}

type Slots =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; times: string[] }

/** Tour booking form on listing detail — slots come from the agent's real availability. */
export function TourBooking({ listingId, listingTitle }: TourBookingProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [slots, setSlots] = useState<Slots>({ status: "idle" })
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const today = new Date().toISOString().split("T")[0]
  const max = new Date()
  max.setDate(max.getDate() + 30)
  const maxDate = max.toISOString().split("T")[0]

  // Load the agent's real availability whenever the date changes.
  useEffect(() => {
    if (!date) {
      setSlots({ status: "idle" })
      return
    }
    let stale = false
    setSlots({ status: "loading" })
    setTime("")
    fetch(`/api/tours/availability?listingId=${encodeURIComponent(listingId)}&date=${date}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status))
        const data = (await r.json()) as { slots?: unknown }
        const times = Array.isArray(data.slots)
          ? data.slots.filter((s): s is string => typeof s === "string")
          : []
        if (!stale) setSlots({ status: "ready", times })
      })
      .catch(() => {
        if (!stale) setSlots({ status: "ready", times: [] })
      })
    return () => {
      stale = true
    }
  }, [date, listingId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !time || !name || !phone) {
      toast.error(t("tour.required"))
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, tourDate: date, tourTime: time, guestName: name, guestPhone: phone, guestEmail: email || undefined, guestNotes: notes || undefined }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        if (res.status === 409) throw new Error(t("tour.slotTaken"))
        throw new Error(err?.error ?? t("tour.error"))
      }
      toast.success(t("tour.success"))
      setOpen(false)
      setDate(""); setTime(""); setName(""); setPhone(""); setEmail(""); setNotes("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("tour.error"))
    } finally {
      setLoading(false)
    }
  }

  const noSlots = slots.status === "ready" && slots.times.length === 0

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-sv-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-glow-blue-sm"
      >
        <Calendar className="h-4 w-4" />
        {t("detail.tourTitle")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sv-navy/60 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-card bg-sv-surface p-6 shadow-panel-dark"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 font-black text-lg text-sv-ink">{t("detail.tourTitle")}</h3>
            <p className="mb-4 text-sm text-sv-ink/50">{listingTitle}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-sv-ink/70">{t("tour.date")} *</label>
                <div className="flex items-center gap-2 rounded-control border border-sv-ink/10 bg-sv-cloud px-3 py-2">
                  <Calendar className="h-4 w-4 text-sv-ink/30" />
                  <input type="date" min={today} max={maxDate} value={date} onChange={(e) => setDate(e.target.value)} required
                    className="w-full bg-transparent text-sm text-sv-ink outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-sv-ink/70">{t("tour.time")} *</label>
                <div className="flex items-center gap-2 rounded-control border border-sv-ink/10 bg-sv-cloud px-3 py-2">
                  <Clock className="h-4 w-4 text-sv-ink/30" />
                  <select value={time} onChange={(e) => setTime(e.target.value)} required
                    disabled={slots.status !== "ready" || noSlots}
                    className="w-full bg-transparent text-sm text-sv-ink outline-none disabled:opacity-50">
                    <option value="">
                      {slots.status === "loading" ? t("tour.loadingSlots") : t("tour.pickTime")}
                    </option>
                    {slots.status === "ready" &&
                      slots.times.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                  </select>
                </div>
                {noSlots && (
                  <p className="mt-1 text-xs font-semibold text-sv-ink/45">{t("tour.noSlots")}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-sv-ink/70">{t("tour.name")} *</label>
                <div className="flex items-center gap-2 rounded-control border border-sv-ink/10 bg-sv-cloud px-3 py-2">
                  <User className="h-4 w-4 text-sv-ink/30" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder={t("tour.namePh")}
                    className="w-full bg-transparent text-sm text-sv-ink outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-sv-ink/70">{t("tour.phone")} *</label>
                <div className="flex items-center gap-2 rounded-control border border-sv-ink/10 bg-sv-cloud px-3 py-2">
                  <Phone className="h-4 w-4 text-sv-ink/30" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder={t("tour.phonePh")}
                    className="w-full bg-transparent text-sm text-sv-ink outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-sv-ink/70">{t("tour.email")}</label>
                <div className="flex items-center gap-2 rounded-control border border-sv-ink/10 bg-sv-cloud px-3 py-2">
                  <Mail className="h-4 w-4 text-sv-ink/30" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("tour.emailPh")}
                    className="w-full bg-transparent text-sm text-sv-ink outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-sv-ink/70">{t("tour.notes")}</label>
                <div className="flex items-start gap-2 rounded-control border border-sv-ink/10 bg-sv-cloud px-3 py-2">
                  <MessageSquare className="mt-0.5 h-4 w-4 text-sv-ink/30" />
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder={t("tour.notesPh")}
                    className="w-full bg-transparent text-sm text-sv-ink outline-none resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 rounded-control border border-sv-ink/10 px-4 py-2.5 text-sm font-semibold text-sv-ink/60 transition hover:bg-sv-cloud">
                  {t("tour.cancel")}
                </button>
                <button type="submit" disabled={loading || noSlots}
                  className="flex-1 rounded-control bg-sv-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-glow-blue-sm disabled:opacity-50">
                  {loading ? t("tour.sending") : t("tour.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
