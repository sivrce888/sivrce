"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"

import { saveAvatarImage, saveAvatarStyle } from "@/app/[lang]/settings/actions"
import UserAvatar from "@/components/UserAvatar"
import { avatarInitials, avatarVisual, GRADIENTS } from "@/lib/avatar"

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"])
const MAX_SIZE = 10 * 1024 * 1024 // mirrors /api/upload

const ERR_TYPE = "მხოლოდ JPG, PNG, WebP ან AVIF ფაილი"
const ERR_SIZE = "ფაილი ძალიან დიდია — მაქსიმუმ 10 მბ"
const ERR_UPLOAD = "ატვირთვა ვერ მოხერხდა — სცადე ხელახლა"
const ERR_SAVE = "შენახვა ვერ მოხერხდა — სცადე ხელახლა"

function Swatch({
  checked,
  label,
  onClick,
  children,
}: {
  checked: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`h-9 w-9 overflow-hidden rounded-full transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 focus-visible:ring-offset-sv-surface ${
        checked
          ? "scale-105 ring-2 ring-sv-blue ring-offset-2 ring-offset-sv-surface"
          : "hover:scale-110"
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Profile photo + monogram gradient picker (settings). Gradient taps apply
 * instantly (optimistic, revert on failure); photos go through /api/upload.
 */
export default function AvatarStudio({
  name,
  image,
  style: style0,
}: {
  name: string
  image: string | null
  style: number | null
}) {
  const { update } = useSession()
  const router = useRouter()
  const [style, setStyle] = useState<number | null>(style0)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  // Local object URLs are ours to revoke.
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )

  function pickStyle(next: number | null) {
    if (next === style || busy) return
    setStyle(next)
    setErr(null)
    startTransition(async () => {
      const r = await saveAvatarStyle(next)
      if (!r.ok) {
        setStyle(style0)
        setErr(ERR_SAVE)
        return
      }
      await update()
    })
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || busy) return
    if (!ALLOWED_TYPES.has(file.type)) return setErr(ERR_TYPE)
    if (file.size > MAX_SIZE) return setErr(ERR_SIZE)

    const url = URL.createObjectURL(file)
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old)
      return url
    })
    setBusy(true)
    setErr(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const up = await fetch("/api/upload", { method: "POST", body: fd })
      const j = (await up.json()) as { ok?: boolean; url?: string }
      if (!up.ok || !j.ok || !j.url) throw new Error(j.url === undefined ? "no_url" : "upload")
      const r = await saveAvatarImage(j.url)
      if (!r.ok) throw new Error("save")
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old)
        return null
      })
      await update()
      router.refresh()
    } catch {
      setPreview(null)
      setErr(ERR_UPLOAD)
    } finally {
      setBusy(false)
    }
  }

  function removePhoto() {
    if (busy) return
    setErr(null)
    startTransition(async () => {
      const r = await saveAvatarImage(null)
      if (!r.ok) {
        setErr(ERR_SAVE)
        return
      }
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old)
        return null
      })
      await update()
      router.refresh()
    })
  }

  const auto = avatarVisual(name)
  const shown = preview ?? image
  const hasPhoto = Boolean(shown)

  return (
    <section
      id="avatar"
      className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-blue/10 text-sv-blue">
          <ImagePlus size={18} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-extrabold text-sv-ink">ავატარი</h2>
          <p className="mt-1 text-[13px] font-medium text-sv-ink/55">
            ატვირთე ფოტო ან აირჩიე გრადიენტი — ასე გჩვენებ შენს პროფილზე.
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-5">
        <UserAvatar name={name} image={shown} gradient={style} size={96} />
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-sv-blue px-5 text-[13px] font-extrabold text-white transition hover:bg-sv-blue-deep disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
          >
            {busy ? "იტვირთება…" : "ატვირთე ფოტო"}
          </button>
          {hasPhoto ? (
            <button
              type="button"
              onClick={removePhoto}
              disabled={busy || isPending}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-sv-ink/12 px-5 text-[13px] font-extrabold text-sv-ink/70 transition hover:border-sv-blue hover:text-sv-blue disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              ფოტოს მოცილება
            </button>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={onPick}
            className="sr-only"
            aria-label="პროფილის ფოტოს ატვირთვა"
          />
        </div>
      </div>

      <div className="mt-6 border-t border-sv-ink/6 pt-5">
        <p className="text-[13px] font-extrabold text-sv-ink">გრადიენტი</p>
        <p className="mt-0.5 text-[12.5px] font-medium text-sv-ink/50">
          ავტო — შენს სახელზე გამოთვლილი; არჩევანი ყველა გვერდზე ერთნაირად ჩანს.
        </p>
        <div role="radiogroup" aria-label="ავატარის გრადიენტი" className="mt-3 flex flex-wrap gap-2.5">
          <Swatch checked={style === null} label="ავტო" onClick={() => pickStyle(null)}>
            <span
              aria-hidden
              className="grid h-full w-full place-items-center text-[11px] font-black text-white"
              style={{ background: `linear-gradient(${auto.angle}deg, ${auto.from}, ${auto.to})` }}
            >
              {avatarInitials(name)}
            </span>
          </Swatch>
          {GRADIENTS.map(([from, to], i) => (
            <Swatch
              key={i}
              checked={style === i}
              label={`გრადიენტი ${i + 1}`}
              onClick={() => pickStyle(i)}
            >
              <span
                aria-hidden
                className="h-full w-full"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              />
            </Swatch>
          ))}
        </div>
      </div>

      {err ? (
        <p
          role="alert"
          className="mt-4 rounded-module bg-sv-orange-deep/10 px-3.5 py-2.5 text-center text-[12.5px] font-bold text-sv-orange-deep"
        >
          {err}
        </p>
      ) : null}
    </section>
  )
}
