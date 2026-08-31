"use client"

import Link from "next/link"
import { useActionState, useState } from "react"

import { saveAdBanner, type AdsFormState } from "@/app/[lang]/admin/ads/actions"
import {
  AD_AUDIENCES,
  AD_FORMATS,
  AD_SLOTS,
  AD_STATUSES,
  SLOT_META,
} from "@/lib/ads"
import { LANGS, type Lang } from "@/lib/i18n/core"

const labelCls = "mb-1.5 block text-[12.5px] font-bold text-sv-ink/60"
const inputCls =
  "h-11 w-full rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3.5 text-[14px] text-sv-ink outline-none transition-colors placeholder:text-sv-ink/30 focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25"
const panelCls =
  "rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-6 shadow-[var(--shadow-card)]"

const LANG_LABEL: Record<Lang | "all", string> = {
  all: "All languages",
  ka: "ქართული",
  en: "English",
  ru: "Русский",
  he: "עברית",
  ar: "العربية",
  tr: "Türkçe",
  uk: "Українська",
  hy: "Հայերեն",
  az: "Azərbaycan",
}

const AUDIENCE_LABEL: Record<(typeof AD_AUDIENCES)[number], string> = {
  all: "Everyone",
  guest: "Guests",
  buyer: "Buyers",
  seller: "Sellers",
  agent: "Agents",
  agency: "Agencies",
  developer: "Developers",
}

export type AdBannerDefaults = {
  id: string
  slot: string
  format: string
  status: string
  title: string
  subtitle: string
  ctaLabel: string
  href: string
  imageUrl: string
  advertiser: string
  audiences: string[]
  langs: string[]
  weight: number
  startsAt: string
  endsAt: string
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-[12px] font-medium text-sv-ink/40">{hint}</p> : null}
    </div>
  )
}

function toLocalInput(iso: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function AdBannerForm({ defaults }: { defaults: AdBannerDefaults }) {
  const [state, formAction, pending] = useActionState<AdsFormState, FormData>(saveAdBanner, {
    error: null,
  })
  const [imageUrl, setImageUrl] = useState(defaults.imageUrl)
  const [uploading, setUploading] = useState(false)
  const [slot, setSlot] = useState(defaults.slot)
  const [format, setFormat] = useState(defaults.format)

  async function onFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const r = await fetch("/api/upload", { method: "POST", body: fd })
      const j = (await r.json()) as { ok?: boolean; url?: string }
      if (j.ok && j.url) setImageUrl(j.url)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={defaults.id} />
      <input type="hidden" name="imageUrl" value={imageUrl} />

      {state.error ? (
        <p className="rounded-control bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700">
          {state.error}
        </p>
      ) : null}

      <section className={panelCls}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field id="slot" label="Slot">
            <select
              id="slot"
              name="slot"
              value={slot}
              onChange={(e) => {
                const next = e.target.value
                setSlot(next)
                const meta = SLOT_META[next as keyof typeof SLOT_META]
                if (meta && defaults.id === "") setFormat(meta.format)
              }}
              className={inputCls}
            >
              {AD_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {SLOT_META[s].label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[12px] font-medium text-sv-ink/40">
              {SLOT_META[slot as keyof typeof SLOT_META]?.hint}
            </p>
          </Field>
          <Field id="format" label="Format">
            <select
              id="format"
              name="format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className={inputCls}
            >
              {AD_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field id="status" label="Status">
            <select id="status" name="status" defaultValue={defaults.status} className={inputCls}>
              {AD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field id="weight" label="Weight" hint="Higher = shown more often in the same slot.">
            <input
              id="weight"
              name="weight"
              type="number"
              min={1}
              max={100}
              defaultValue={defaults.weight}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <section className={panelCls}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="title" label="Title">
            <input id="title" name="title" required defaultValue={defaults.title} className={inputCls} />
          </Field>
          <Field id="advertiser" label="Advertiser">
            <input
              id="advertiser"
              name="advertiser"
              defaultValue={defaults.advertiser}
              placeholder="TBC Bank"
              className={inputCls}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field id="subtitle" label="Subtitle">
              <input
                id="subtitle"
                name="subtitle"
                defaultValue={defaults.subtitle}
                className={inputCls}
              />
            </Field>
          </div>
          <Field id="ctaLabel" label="Button">
            <input
              id="ctaLabel"
              name="ctaLabel"
              defaultValue={defaults.ctaLabel}
              placeholder="ნახვა"
              className={inputCls}
            />
          </Field>
          <Field id="href" label="Link" hint="Internal path (/projects/…) or https://…">
            <input
              id="href"
              name="href"
              required
              defaultValue={defaults.href}
              placeholder="/advertise"
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <section className={panelCls}>
        <Field id="imageFile" label="Creative" hint="JPG / PNG / WebP · uploaded to storage.">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              id="imageFile"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(e) => void onFile(e.target.files?.[0])}
              className="text-[13px] font-semibold text-sv-ink/60 file:mr-3 file:h-10 file:rounded-full file:border-0 file:bg-sv-blue file:px-4 file:text-[13px] file:font-bold file:text-white"
            />
            {uploading ? <span className="text-[13px] font-bold text-sv-blue">Uploading…</span> : null}
          </div>
          <input
            className={`${inputCls} mt-3`}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="or paste image URL"
          />
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="mt-4 h-36 w-full rounded-module object-cover sm:w-80"
            />
          ) : null}
        </Field>
      </section>

      <section className={panelCls}>
        <p className={labelCls}>Audience</p>
        <div className="flex flex-wrap gap-3">
          {AD_AUDIENCES.map((a) => (
            <label key={a} className="flex items-center gap-2 text-[13px] font-bold text-sv-ink/70">
              <input
                type="checkbox"
                name="audiences"
                value={a}
                defaultChecked={defaults.audiences.includes(a) || (a === "all" && defaults.audiences.length === 0)}
                className="h-4 w-4 accent-sv-blue"
              />
              {AUDIENCE_LABEL[a]}
            </label>
          ))}
        </div>
        <p className={`${labelCls} mt-6`}>Languages</p>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-[13px] font-bold text-sv-ink/70">
            <input
              type="checkbox"
              name="langs"
              value="all"
              defaultChecked={defaults.langs.includes("all") || defaults.langs.length === 0}
              className="h-4 w-4 accent-sv-blue"
            />
            {LANG_LABEL.all}
          </label>
          {LANGS.map((l) => (
            <label key={l} className="flex items-center gap-2 text-[13px] font-bold text-sv-ink/70">
              <input
                type="checkbox"
                name="langs"
                value={l}
                defaultChecked={defaults.langs.includes(l)}
                className="h-4 w-4 accent-sv-blue"
              />
              {LANG_LABEL[l]}
            </label>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field id="startsAt" label="Starts" hint="Empty = immediately.">
            <input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              defaultValue={toLocalInput(defaults.startsAt)}
              className={inputCls}
            />
          </Field>
          <Field id="endsAt" label="Ends" hint="Empty = until paused.">
            <input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              defaultValue={toLocalInput(defaults.endsAt)}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || uploading}
          className="inline-flex h-11 items-center rounded-full bg-sv-blue px-6 text-[14px] font-extrabold text-white transition hover:bg-sv-blue-deep disabled:opacity-40"
        >
          {pending ? "Saving…" : defaults.id ? "Save banner" : "Create banner"}
        </button>
        <Link href="/admin/ads" className="text-[13px] font-bold text-sv-ink/45 hover:text-sv-ink">
          Cancel
        </Link>
      </div>
    </form>
  )
}
