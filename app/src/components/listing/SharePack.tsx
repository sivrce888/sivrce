"use client"

import { useEffect, type ReactNode } from "react"
import { Copy, MessageCircle, Phone, Send, Share2 } from "lucide-react"
import { toast } from "sonner"

import { useI18n } from "@/lib/i18n/context"
import { localizedHref, type Lang } from "@/lib/i18n/core"
import {
  fbShareHref,
  listingPriceLabel,
  listingShareLines,
  listingShareText,
  tgShareHref,
  viberShareHref,
  waSendHref,
  type ListingShareInput,
} from "@/lib/listing-share"

function absUrl(path: string, lang: Lang): string {
  return `${window.location.origin}${localizedHref(path, lang)}`
}

export function openWhatsAppShare(input: ListingShareInput, path: string, lang: Lang) {
  const url = absUrl(path, lang)
  const a = document.createElement("a")
  a.href = waSendHref(listingShareText(input, url))
  a.target = "_blank"
  a.rel = "noopener noreferrer"
  a.click()
}

export function ShareSheet({
  open,
  onClose,
  input,
  path,
  agent,
}: {
  open: boolean
  onClose: () => void
  input: ListingShareInput
  path: string
  agent?: boolean
}) {
  const { lang, t } = useI18n()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const url = absUrl(path, lang)
  const text = listingShareText(input, url)
  const lines = listingShareLines(input).join("\n")
  const canNative = typeof navigator !== "undefined" && typeof navigator.share === "function"

  const copy = () => {
    navigator.clipboard
      ?.writeText(text)
      .then(() => toast.success(t("detail.linkCopied")))
      .catch(() => toast.error(t("detail.share")))
    onClose()
  }

  const nativeShare = async () => {
    try {
      await navigator.share({
        title: input.title,
        text: lines,
        url,
      })
    } catch {
      /* dismissed */
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={t("detail.shareSheet")}>
      <button type="button" className="absolute inset-0 bg-sv-navy/50" onClick={onClose} aria-label={t("detail.close")} />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-card bg-sv-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-panel-dark">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-sv-ink/15" />
        <p className="mb-3 text-[15px] font-extrabold tracking-[-0.02em] text-sv-ink">
          {agent ? t("detail.sendToClient") : t("detail.share")}
        </p>
        <div className="grid gap-2">
          <a
            href={waSendHref(text)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex h-12 items-center gap-3 rounded-control bg-sv-orange px-4 text-[14px] font-extrabold text-sv-ink shadow-glow-orange transition hover:opacity-95"
          >
            <MessageCircle className="h-5 w-5" />
            WhatsApp
          </a>
          <SheetAnchor href={tgShareHref(url, lines)} target="_blank" onClick={onClose} icon={<Send className="h-5 w-5" />}>
            Telegram
          </SheetAnchor>
          <SheetAnchor href={viberShareHref(text)} onClick={onClose} icon={<Phone className="h-5 w-5" />}>
            Viber
          </SheetAnchor>
          <SheetAnchor href={fbShareHref(url)} target="_blank" rel="noopener noreferrer" onClick={onClose} icon={<FacebookGlyph />}>
            Facebook
          </SheetAnchor>
          <SheetBtn onClick={copy} icon={<Copy className="h-5 w-5" />}>
            {t("detail.copyLink")}
          </SheetBtn>
          {canNative ? (
            <SheetBtn onClick={() => void nativeShare()} icon={<Share2 className="h-5 w-5" />}>
              {t("detail.shareMore")}
            </SheetBtn>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function SheetBtn({
  children,
  icon,
  onClick,
}: {
  children: ReactNode
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 items-center gap-3 rounded-control bg-sv-cloud px-4 text-[14px] font-extrabold text-sv-ink ring-1 ring-sv-ink/8 transition hover:text-sv-blue"
    >
      {icon}
      {children}
    </button>
  )
}

function SheetAnchor({
  children,
  icon,
  href,
  target,
  rel,
  onClick,
}: {
  children: ReactNode
  icon: ReactNode
  href: string
  target?: string
  rel?: string
  onClick: () => void
}) {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      onClick={onClick}
      className="flex h-12 items-center gap-3 rounded-control bg-sv-cloud px-4 text-[14px] font-extrabold text-sv-ink ring-1 ring-sv-ink/8 transition hover:text-sv-blue"
    >
      {icon}
      {children}
    </a>
  )
}

/** lucide dropped brand marks — one inline path keeps the FB row recognizable. */
function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7.1h2.39l.36-2.77H13.5V9.35c0-.8.22-1.35 1.37-1.35h1.47V5.53c-.25-.03-1.12-.11-2.13-.11-2.1 0-3.55 1.28-3.55 3.65v2.04H8.26v2.77h2.4V21h2.84Z" />
    </svg>
  )
}

export function SendToClientButton({
  title,
  district,
  city,
  price,
  currency,
  listingId,
  area,
}: {
  title: string
  district: string
  city: string
  price: number
  currency: string
  listingId: string
  area?: number
}) {
  const { lang, t } = useI18n()
  return (
    <button
      type="button"
      onClick={() =>
        openWhatsAppShare(
          {
            title,
            district,
            city,
            area,
            priceLabel: listingPriceLabel(price, currency),
          },
          `/listing/${listingId}`,
          lang,
        )
      }
      className="inline-flex items-center gap-1.5 rounded-full bg-sv-orange px-3 py-1.5 text-[11px] font-extrabold text-sv-ink shadow-glow-orange transition hover:opacity-95"
    >
      <MessageCircle size={13} strokeWidth={2.4} />
      {t("detail.sendToClient")}
    </button>
  )
}

