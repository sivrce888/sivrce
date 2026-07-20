/**
 * SIVRCE — payment result card (server component).
 * Renders from the DB order row, not the URL: paid only when the verified
 * server-to-server flip already happened; otherwise a processing/failed state.
 * Order details are shown only to the order's owner.
 */

import { CheckCircle2, Clock, XCircle } from "lucide-react"

import { auth } from "@/auth"
import LocalizedLink from "@/components/LocalizedLink"
import { db } from "@/lib/db"
import { formatGel } from "@/lib/promo-pricing"
import type { Lang } from "@/lib/i18n/core"
import { getServerT } from "@/lib/i18n/server"

interface PaymentResultProps {
  lang: Lang
  orderId?: string
}

export default async function PaymentResult({ lang, orderId }: PaymentResultProps) {
  const t = getServerT(lang)

  const [session, order] = await Promise.all([
    auth(),
    orderId
      ? db.georgianPaymentOrder.findUnique({
          where: { id: orderId },
          select: { id: true, userId: true, status: true, amountTetri: true, tier: true },
        })
      : null,
  ])

  // Details are private to the buyer; anyone else gets the generic card.
  const own = order && (!order.userId || order.userId === session?.user?.id) ? order : null

  const state: "paid" | "pending" | "failed" =
    own?.status === "paid" ? "paid" : !own || own.status === "pending" ? "pending" : "failed"

  const Icon = state === "paid" ? CheckCircle2 : state === "pending" ? Clock : XCircle
  const iconClass =
    state === "paid" ? "text-sv-blue" : state === "pending" ? "text-sv-ink/40" : "text-sv-orange"
  const titleKey =
    state === "paid" ? "pay.paid.title" : state === "pending" ? "pay.pending.title" : "pay.failed.title"
  const descKey =
    state === "paid" ? "pay.paid.desc" : state === "pending" ? "pay.pending.desc" : "pay.failed.desc"

  return (
    <div className="mx-auto max-w-md rounded-card border border-sv-ink/[0.08] bg-sv-surface p-8 text-center shadow-panel-dark">
      <Icon className={`mx-auto h-14 w-14 ${iconClass}`} strokeWidth={1.6} />
      <h1 className="mt-5 text-2xl font-black tracking-[-0.02em] text-sv-ink">
        {t(titleKey)}
      </h1>
      <p className="mt-2 text-[14px] font-medium text-sv-ink/60">{t(descKey)}</p>

      {own && (
        <p className="mt-4 rounded-control bg-sv-cloud px-3 py-2 text-[13px] font-extrabold text-sv-ink">
          {t("pay.order")} · {formatGel(own.amountTetri)}
        </p>
      )}

      <LocalizedLink
        href="/seller/listings"
        className="mt-6 inline-flex items-center justify-center rounded-control bg-gradient-to-r from-sv-blue to-sv-violet px-6 py-3 text-[14px] font-extrabold text-white shadow-glow-blue-sm transition-all hover:shadow-glow-blue active:scale-95"
      >
        {t("pay.back")}
      </LocalizedLink>
    </div>
  )
}
