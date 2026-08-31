"use client"

import { useEffect, type ReactNode } from "react"
import { Copy, MessageCircle, Share2 } from "lucide-react"
import { toast } from "sonner"

import { useI18n } from "@/lib/i18n/context"
import { localizedHref, type Lang } from "@/lib/i18n/core"
import {
  listingPriceLabel,
  listingShareLines,
  listingShareText,
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
        text: listingShareLines(input).join("\n"),
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
            className="flex h-12 items-center gap-3 rounded-control bg-sv-orange px-4 text-[14px] font-extrabold text-white shadow-glow-orange transition hover:opacity-95"
          >
            <MessageCircle className="h-5 w-5" />
            WhatsApp
          </a>
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
      className="inline-flex items-center gap-1.5 rounded-full bg-sv-orange px-3 py-1.5 text-[11px] font-extrabold text-white shadow-glow-orange transition hover:opacity-95"
    >
      <MessageCircle size={13} strokeWidth={2.4} />
      {t("detail.sendToClient")}
    </button>
  )
}

