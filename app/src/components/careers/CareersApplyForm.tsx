'use client'

import { useState, type FormEvent } from 'react'
import { Send, CheckCircle2, Loader2, AlertCircle, FileUp, X } from 'lucide-react'
import { formatPhone, PHONE_RE } from '@/lib/inquiries/phone'

const CITIES = ['თბილისი', 'ბათუმი'] as const
const MAX_CV_BYTES = 5 * 1024 * 1024

export default function CareersApplyForm() {
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [cv, setCv] = useState<File | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') ?? '').trim()
    const email = String(fd.get('email') ?? '').trim()
    const city = String(fd.get('city') ?? '')
    const note = String(fd.get('message') ?? '').trim()
    if (!PHONE_RE.test(phone)) {
      setError('ნომერი არასწორია. მაგ.: +995 555 12 34 56')
      return
    }
    if (!cv) {
      setError('აირჩიე CV (PDF, DOC ან DOCX).')
      return
    }
    if (cv.size > MAX_CV_BYTES) {
      setError('CV max 5 MB.')
      return
    }

    setSending(true)
    try {
      const up = new FormData()
      up.set('file', cv)
      const upRes = await fetch('/api/careers/cv', { method: 'POST', body: up })
      if (!upRes.ok) {
        const code = upRes.status
        setError(
          code === 429
            ? 'ცოტა დაიცადე და თავიდან სცადე.'
            : code === 400
              ? 'PDF, DOC ან DOCX — max 5 MB.'
              : 'CV ვერ აიტვირთა. თავიდან სცადე.',
        )
        setSending(false)
        return
      }
      const upJson = (await upRes.json()) as { ok?: boolean; url?: string }
      if (!upJson.url) {
        setError('CV ვერ აიტვირთა. თავიდან სცადე.')
        setSending(false)
        return
      }

      // API requires message ≥10 chars — city + CV line cover it.
      const message = [`[კარიერა · ${city}]`, note || 'განაცხადი.', `CV: ${upJson.url}`].join('\n')

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'general',
          targetId: 'careers',
          name,
          email,
          phone,
          message,
          website,
        }),
      })
      if (!res.ok) {
        setError(res.status === 429 ? 'ცოტა დაიცადე და თავიდან სცადე.' : 'ვერ გაიგზავნა. თავიდან სცადე.')
        setSending(false)
        return
      }
      setSent(true)
      setCv(null)
    } catch {
      setError('ვერ გაიგზავნა. თავიდან სცადე.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-card bg-sv-surface p-8 text-center shadow-card ring-1 ring-sv-ink/5">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-module bg-sv-blue/10">
          <CheckCircle2 className="h-7 w-7 text-sv-blue" />
        </div>
        <h2 className="mt-5 text-xl font-black tracking-[-0.02em] text-sv-ink text-balance">
          მივიღეთ
        </h2>
        <p className="mt-2 text-[15px] font-medium text-sv-ink/60">
          მალე დაგიკავშირდებით.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 rounded-full bg-sv-orange px-6 py-3 text-sm font-bold text-white shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
        >
          კიდევ ერთი
        </button>
      </div>
    )
  }

  const inputCls =
    'w-full rounded-control bg-sv-cloud px-4 py-3 text-[15px] font-medium text-sv-ink ring-1 ring-sv-ink/5 outline-none transition placeholder:text-sv-ink/35 focus:ring-2 focus:ring-sv-blue/40'

  return (
    <form onSubmit={onSubmit} className="rounded-card bg-sv-surface p-6 shadow-card ring-1 ring-sv-ink/5 md:p-8">
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <div className="grid gap-5">
        <div>
          <label htmlFor="careers-name" className="mb-2 block text-sm font-bold text-sv-ink">
            სახელი და გვარი
          </label>
          <input id="careers-name" name="name" type="text" required autoComplete="name" placeholder="შენი სახელი" className={inputCls} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="careers-email" className="mb-2 block text-sm font-bold text-sv-ink">
              ელ. ფოსტა
            </label>
            <input id="careers-email" name="email" type="email" required autoComplete="email" placeholder="name@example.com" className={inputCls} />
          </div>
          <div>
            <label htmlFor="careers-phone" className="mb-2 block text-sm font-bold text-sv-ink">
              ტელეფონი
            </label>
            <input
              id="careers-phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              placeholder="+995 5XX XX XX XX"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 block text-sm font-bold text-sv-ink">ქალაქი</legend>
          <div className="flex flex-wrap gap-3">
            {CITIES.map((city, i) => (
              <label
                key={city}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-sv-cloud px-4 py-2.5 text-sm font-bold text-sv-ink ring-1 ring-sv-ink/5 has-[:checked]:bg-sv-blue has-[:checked]:text-white has-[:checked]:ring-sv-blue"
              >
                <input type="radio" name="city" value={city} required defaultChecked={i === 0} className="sr-only" />
                {city}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="careers-message" className="mb-2 block text-sm font-bold text-sv-ink">
            მოკლე შეტყობინება
          </label>
          <textarea
            id="careers-message"
            name="message"
            rows={4}
            placeholder="მოკლედ შენს შესახებ…"
            className={`${inputCls} resize-none`}
          />
        </div>
        <div>
          <label htmlFor="careers-cv" className="mb-2 block text-sm font-bold text-sv-ink">
            CV (PDF, DOC, DOCX)
          </label>
          {cv ? (
            <div className="flex items-center gap-3 rounded-control bg-sv-cloud px-4 py-3 ring-1 ring-sv-ink/5">
              <FileUp className="h-5 w-5 shrink-0 text-sv-blue" />
              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-sv-ink">{cv.name}</span>
              <span className="shrink-0 text-[12px] font-medium text-sv-ink/45">
                {(cv.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={() => setCv(null)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-control text-sv-ink/50 transition hover:bg-sv-surface hover:text-sv-ink"
                aria-label="წაშლა"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="careers-cv"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-control border border-dashed border-sv-ink/15 bg-sv-cloud px-4 py-6 text-center transition hover:border-sv-blue/40 hover:bg-sv-blue/[0.03]"
            >
              <FileUp className="h-6 w-6 text-sv-blue" />
              <span className="text-[14px] font-bold text-sv-ink">აირჩიე ფაილი</span>
              <span className="text-[12px] font-medium text-sv-ink/45">PDF, DOC, DOCX · max 5 MB</span>
              <input
                id="careers-cv"
                name="cv"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                required
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  e.target.value = ''
                  if (!f) return
                  const ok = /\.(pdf|docx?)$/i.test(f.name)
                  if (!ok) {
                    setError('PDF, DOC ან DOCX.')
                    return
                  }
                  if (f.size > MAX_CV_BYTES) {
                    setError('CV max 5 MB.')
                    return
                  }
                  setError(null)
                  setCv(f)
                }}
              />
            </label>
          )}
        </div>
        {error ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-sv-orange" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-sv-orange px-6 py-3.5 text-sm font-bold text-white shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg disabled:opacity-60"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? 'იგზავნება…' : 'გაგზავნა'}
        </button>
      </div>
    </form>
  )
}
