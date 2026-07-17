"use client"

import { useState } from "react"
import { Calendar, Clock, User, Phone, Mail, MessageSquare } from "lucide-react"
import { toast } from "sonner"

interface TourBookingProps {
  listingId: string
  listingTitle: string
}

/** Minimal tour booking form embedded on listing detail. */
export function TourBooking({ listingId, listingTitle }: TourBookingProps) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const today = new Date().toISOString().split("T")[0]
  const max = new Date()
  max.setDate(max.getDate() + 30)
  const maxDate = max.toISOString().split("T")[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !time || !name || !phone) {
      toast.error("გთხოვთ შეავსოთ ყველა სავალდებულო ველი")
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
        const err = await res.json()
        throw new Error(err.error ?? "დაფიქსირდა შეცდომა")
      }
      toast.success("ტური წარმატებით დაჯავშნილია! აგენტი დაგიკავშირდებათ.")
      setOpen(false)
      setDate(""); setTime(""); setName(""); setPhone(""); setEmail(""); setNotes("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "დაფიქსირდა შეცდომა")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-sv-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-glow-blue-sm"
      >
        <Calendar className="h-4 w-4" />
        ტურის დაჯავშნა
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sv-navy/60 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-card bg-sv-surface p-6 shadow-panel-dark"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 font-black text-lg text-sv-ink">ტურის დაჯავშნა</h3>
            <p className="mb-4 text-sm text-sv-ink/50">{listingTitle}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-sv-ink/70">თარიღი *</label>
                <div className="flex items-center gap-2 rounded-control border border-sv-ink/10 bg-sv-cloud px-3 py-2">
                  <Calendar className="h-4 w-4 text-sv-ink/30" />
                  <input type="date" min={today} max={maxDate} value={date} onChange={(e) => setDate(e.target.value)} required
                    className="w-full bg-transparent text-sm text-sv-ink outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-sv-ink/70">დრო *</label>
                <div className="flex items-center gap-2 rounded-control border border-sv-ink/10 bg-sv-cloud px-3 py-2">
                  <Clock className="h-4 w-4 text-sv-ink/30" />
                  <select value={time} onChange={(e) => setTime(e.target.value)} required
                    className="w-full bg-transparent text-sm text-sv-ink outline-none">
                    <option value="">აირჩიეთ დრო</option>
                    {["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-sv-ink/70">სახელი *</label>
                <div className="flex items-center gap-2 rounded-control border border-sv-ink/10 bg-sv-cloud px-3 py-2">
                  <User className="h-4 w-4 text-sv-ink/30" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="თქვენი სახელი"
                    className="w-full bg-transparent text-sm text-sv-ink outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-sv-ink/70">ტელეფონი *</label>
                <div className="flex items-center gap-2 rounded-control border border-sv-ink/10 bg-sv-cloud px-3 py-2">
                  <Phone className="h-4 w-4 text-sv-ink/30" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+995 5XX XX XX XX"
                    className="w-full bg-transparent text-sm text-sv-ink outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-sv-ink/70">ელ. ფოსტა</label>
                <div className="flex items-center gap-2 rounded-control border border-sv-ink/10 bg-sv-cloud px-3 py-2">
                  <Mail className="h-4 w-4 text-sv-ink/30" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="თქვენი ელ. ფოსტა"
                    className="w-full bg-transparent text-sm text-sv-ink outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-sv-ink/70">შენიშვნები</label>
                <div className="flex items-start gap-2 rounded-control border border-sv-ink/10 bg-sv-cloud px-3 py-2">
                  <MessageSquare className="mt-0.5 h-4 w-4 text-sv-ink/30" />
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="დამატებითი ინფორმაცია..."
                    className="w-full bg-transparent text-sm text-sv-ink outline-none resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 rounded-control border border-sv-ink/10 px-4 py-2.5 text-sm font-semibold text-sv-ink/60 transition hover:bg-sv-cloud">
                  გაუქმება
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 rounded-control bg-sv-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-glow-blue-sm disabled:opacity-50">
                  {loading ? "იგზავნება..." : "დაჯავშნა"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
