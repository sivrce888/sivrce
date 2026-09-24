"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"

import { saveAvatarColor, saveAvatarIcon, saveAvatarImage, saveAvatarStyle } from "@/app/[lang]/settings/actions"
import UserAvatar from "@/components/UserAvatar"
import { avatarInitials, avatarVisual, GRADIENTS, ICONS, isPlaceholderImage } from "@/lib/avatar"
import { useI18n } from "@/lib/i18n/context"
import type { AvatarIcon } from "@/lib/avatar"
import type { LucideIcon } from "lucide-react"
import { panelLang } from "@/lib/i18n/core"

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"])
const MAX_SIZE = 10 * 1024 * 1024 // mirrors /api/upload

const L = {
  ka: {
    errType: "მხოლოდ JPG, PNG, WebP ან AVIF ფაილი",
    errSize: "ფაილი ძალიან დიდია — მაქსიმუმ 10 მბ",
    errUpload: "ატვირთვა ვერ მოხერხდა — სცადე ხელახლა",
    errSave: "შენახვა ვერ მოხერხდა — სცადე ხელახლა",
    avatarTitle: "ავატარი",
    avatarDesc: "ატვირთე ფოტო ან აირჩიე გრადიენტი — ასე გამოჩნდები შენს პროფილზე.",
    uploading: "იტვირთება…",
    uploadPhoto: "ატვირთე ფოტო",
    removePhoto: "ფოტოს მოცილება",
    uploadAria: "პროფილის ფოტოს ატვირთვა",
    gradient: "გრადიენტი",
    gradientDesc:
      "ავტო — შენს სახელზე გამოთვლილი; ბოლო ბეჭედი — შენივე ფერი, ყველა გვერდზე ერთნაირად.",
    gradientGroup: "ავატარის გრადიენტი",
    auto: "ავტო",
    gradientN: (n: number) => `გრადიენტი ${n}`,
    yourColor: "შენი ფერი",
    yourColorAria: "შენი ფერის არჩევა",
    symbol: "სიმბოლო",
    symbolDesc: "ავტო — შენი ინიციალებია; არჩეული სიმბოლო იმუშავებს ყველა გვერდზე.",
    symbolGroup: "ავატარის სიმბოლო",
    autoInitials: "ავტო — ინიციალები",
    symbolLabel: (name: string) => `სიმბოლო — ${name}`,
    iconNames: {
      house: "სახლი",
      building: "შენობა",
      key: "გასაღები",
      star: "ვარსკვლავი",
      heart: "გული",
      sun: "მზე",
      mountain: "მთა",
      trees: "ბუნება",
      sofa: "დივანი",
      paw: "ცხოველი",
    },
  },
  en: {
    errType: "Only JPG, PNG, WebP or AVIF files",
    errSize: "File is too large — 10 MB max",
    errUpload: "Upload failed — try again",
    errSave: "Couldn’t save — try again",
    avatarTitle: "Avatar",
    avatarDesc: "Upload a photo or pick a gradient — that’s how you appear on your profile.",
    uploading: "Uploading…",
    uploadPhoto: "Upload photo",
    removePhoto: "Remove photo",
    uploadAria: "Upload profile photo",
    gradient: "Gradient",
    gradientDesc:
      "Auto — computed from your name; the last swatch is your own color, the same on every page.",
    gradientGroup: "Avatar gradient",
    auto: "Auto",
    gradientN: (n: number) => `Gradient ${n}`,
    yourColor: "Your color",
    yourColorAria: "Pick your color",
    symbol: "Symbol",
    symbolDesc: "Auto — your initials; a chosen symbol works on every page.",
    symbolGroup: "Avatar symbol",
    autoInitials: "Auto — initials",
    symbolLabel: (name: string) => `Symbol — ${name}`,
    iconNames: {
      house: "House",
      building: "Building",
      key: "Key",
      star: "Star",
      heart: "Heart",
      sun: "Sun",
      mountain: "Mountain",
      trees: "Nature",
      sofa: "Sofa",
      paw: "Animal",
    },
  },
  de: {
    errType: "Nur JPG-, PNG-, WebP- oder AVIF-Dateien",
    errSize: "Die Datei ist zu groß – maximal 10 MB",
    errUpload: "Upload fehlgeschlagen – bitte erneut versuchen",
    errSave: "Speichern nicht möglich – bitte erneut versuchen",
    avatarTitle: "Avatar",
    avatarDesc:
      "Laden Sie ein Foto hoch oder wählen Sie einen Farbverlauf – so erscheinen Sie in Ihrem Profil.",
    uploading: "Wird hochgeladen…",
    uploadPhoto: "Foto hochladen",
    removePhoto: "Foto entfernen",
    uploadAria: "Profilfoto hochladen",
    gradient: "Farbverlauf",
    gradientDesc:
      "Auto – aus Ihrem Namen berechnet; das letzte Feld ist Ihre eigene Farbe, auf allen Seiten identisch.",
    gradientGroup: "Avatar-Farbverlauf",
    auto: "Auto",
    gradientN: (n: number) => `Farbverlauf ${n}`,
    yourColor: "Ihre Farbe",
    yourColorAria: "Ihre Farbe wählen",
    symbol: "Symbol",
    symbolDesc: "Auto – Ihre Initialen; ein gewähltes Symbol funktioniert auf allen Seiten.",
    symbolGroup: "Avatar-Symbol",
    autoInitials: "Auto – Initialen",
    symbolLabel: (name: string) => `Symbol – ${name}`,
    iconNames: {
      house: "Haus",
      building: "Gebäude",
      key: "Schlüssel",
      star: "Stern",
      heart: "Herz",
      sun: "Sonne",
      mountain: "Berg",
      trees: "Natur",
      sofa: "Sofa",
      paw: "Tier",
    },
  },
} as const

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
 * Profile photo + monogram gradient/glyph picker (settings). Taps apply
 * instantly (optimistic, revert on failure); photos go through /api/upload.
 */
export default function AvatarStudio({
  name,
  image,
  style: style0,
  color: color0,
  icon: icon0,
}: {
  name: string
  image: string | null
  style: number | null
  color?: string | null
  icon: string | null
}) {
  const { update } = useSession()
  const router = useRouter()
  const { lang } = useI18n()
  const loc = panelLang(lang)
  const t = L[loc]
  const [style, setStyle] = useState<number | null>(style0)
  const [color, setColor] = useState<string | null>(color0 ?? null)
  const [icon, setIcon] = useState<string | null>(icon0)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const colorRef = useRef<HTMLInputElement>(null)

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
    setColor(null)
    setErr(null)
    startTransition(async () => {
      const r = await saveAvatarStyle(next)
      if (!r.ok) {
        setStyle(style0)
        setColor(color0 ?? null)
        setErr(t.errSave)
        return
      }
      await update()
    })
  }

  function pickColor(next: string | null) {
    if (next === color || busy) return
    setColor(next)
    setStyle(null)
    setErr(null)
    startTransition(async () => {
      const r = await saveAvatarColor(next)
      if (!r.ok) {
        setColor(color0 ?? null)
        setStyle(style0)
        setErr(t.errSave)
        return
      }
      await update()
    })
  }

  function pickIcon(next: string | null) {
    if (next === icon || busy) return
    setIcon(next)
    setErr(null)
    startTransition(async () => {
      const r = await saveAvatarIcon(next)
      if (!r.ok) {
        setIcon(icon0)
        setErr(t.errSave)
        return
      }
      await update()
    })
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || busy) return
    if (!ALLOWED_TYPES.has(file.type)) return setErr(t.errType)
    if (file.size > MAX_SIZE) return setErr(t.errSize)

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
      setErr(t.errUpload)
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
        setErr(t.errSave)
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
  const hasPhoto = Boolean(shown) && !isPlaceholderImage(shown)

  return (
    <section
      id="avatar"
      className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-blue/10 text-sv-blue-deep">
          <ImagePlus size={18} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-extrabold text-sv-ink">{t.avatarTitle}</h2>
          <p className="mt-1 text-[13px] font-medium text-sv-ink/60">{t.avatarDesc}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-5">
        <UserAvatar name={name} image={shown} gradient={style} color={color} icon={icon} size={96} />
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-sv-blue px-5 text-[13px] font-extrabold text-white transition hover:bg-sv-blue-deep disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
          >
            {busy ? t.uploading : t.uploadPhoto}
          </button>
          {hasPhoto ? (
            <button
              type="button"
              onClick={removePhoto}
              disabled={busy || isPending}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-sv-ink/12 px-5 text-[13px] font-extrabold text-sv-ink/70 transition hover:border-sv-blue hover:text-sv-blue disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              {t.removePhoto}
            </button>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={onPick}
            className="sr-only"
            aria-label={t.uploadAria}
          />
        </div>
      </div>

      <div className="mt-6 border-t border-sv-ink/6 pt-5">
        <p className="text-[13px] font-extrabold text-sv-ink">{t.gradient}</p>
        <p className="mt-0.5 text-[12.5px] font-medium text-sv-ink/60">{t.gradientDesc}</p>
        <div role="radiogroup" aria-label={t.gradientGroup} className="mt-3 flex flex-wrap gap-2.5">
          <Swatch checked={style === null && color === null} label={t.auto} onClick={() => pickStyle(null)}>
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
              label={t.gradientN(i + 1)}
              onClick={() => pickStyle(i)}
            >
              {/* block: h/w don't apply to inline spans — bare h-full collapses to 0×0 */}
              <span
                aria-hidden
                className="block h-full w-full"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              />
            </Swatch>
          ))}
          <Swatch
            checked={color !== null}
            label={t.yourColor}
            onClick={() => colorRef.current?.click()}
          >
            <span
              aria-hidden
              className="block h-full w-full"
              style={
                color
                  ? { background: color }
                  : {
                      background:
                        "conic-gradient(from 220deg, #FFB25E, #FF6A2D, #FF4D6D, #7A5CFF, #2a5fef, #8FB4FF, #FFB25E)",
                    }
              }
            />
          </Swatch>
        </div>
        {/* Native color well — platform picker, no custom UI to maintain. */}
        <input
          ref={colorRef}
          type="color"
          value={color ?? "#2a5fef"}
          onChange={(e) => pickColor(e.target.value)}
          className="sr-only"
          aria-label={t.yourColorAria}
        />
      </div>

      <div className="mt-6 border-t border-sv-ink/6 pt-5">
        <p className="text-[13px] font-extrabold text-sv-ink">{t.symbol}</p>
        <p className="mt-0.5 text-[12.5px] font-medium text-sv-ink/60">{t.symbolDesc}</p>
        <div role="radiogroup" aria-label={t.symbolGroup} className="mt-3 flex flex-wrap gap-2.5">
          <Swatch checked={icon === null} label={t.autoInitials} onClick={() => pickIcon(null)}>
            <span
              aria-hidden
              className="grid h-full w-full place-items-center text-[11px] font-black text-white"
              style={{ background: `linear-gradient(${auto.angle}deg, ${auto.from}, ${auto.to})` }}
            >
              {avatarInitials(name)}
            </span>
          </Swatch>
          {(Object.entries(ICONS) as [AvatarIcon, LucideIcon][]).map(([key, Glyph]) => (
            <Swatch
              key={key}
              checked={icon === key}
              label={t.symbolLabel(t.iconNames[key])}
              onClick={() => pickIcon(key)}
            >
              <span
                aria-hidden
                className="grid h-full w-full place-items-center bg-sv-ink/[0.05] text-sv-ink/70"
              >
                <Glyph size={15} />
              </span>
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
