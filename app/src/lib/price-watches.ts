/**
 * Per-listing price-drop watches.
 * Stored as SavedSearch rows named `__price__:{listingId}` so we reuse
 * notification + email + push fan-out without a new table.
 * ponytail: ceiling = MAX_PER_USER saved searches; dedicated table if watchers explode.
 */

import { randomUUID } from "node:crypto"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { sendPushToUser } from "@/lib/push"
import { isPriceWatchName, PRICE_WATCH_PREFIX, priceWatchName } from "@/lib/price-watch-name"
import type { Prisma } from "@/generated/prisma/client"

export { isPriceWatchName, priceWatchName } from "@/lib/price-watch-name"

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sivrce.ge"

type AlertLang = "ka" | "en" | "ru"

const COPY: Record<
  AlertLang,
  { subject: (title: string) => string; body: (title: string, oldP: string, newP: string) => string; cta: string }
> = {
  ka: {
    subject: (t) => `ფასი დაეცა: ${t}`,
    body: (t, o, n) => `${t} — ფასი ${o} → ${n}`,
    cta: "განცხადების ნახვა →",
  },
  en: {
    subject: (t) => `Price drop: ${t}`,
    body: (t, o, n) => `${t} — ${o} → ${n}`,
    cta: "View listing →",
  },
  ru: {
    subject: (t) => `Цена снижена: ${t}`,
    body: (t, o, n) => `${t} — ${o} → ${n}`,
    cta: "Смотреть объявление →",
  },
}

const alertLang = (lang: string | undefined): AlertLang =>
  !lang || lang === "ka" ? "ka" : lang === "ru" ? "ru" : "en"

const escapeHtml = (t: string): string =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const fmt = (price: number, currency: string) =>
  currency === "GEL" ? `${price.toLocaleString("en-US")}₾` : `$${price.toLocaleString("en-US")}`

/** Upsert a price watch for the user. Returns watch id or null if unauthorized path. */
export async function upsertPriceWatch(
  userId: string,
  listingId: string,
  lang: string,
): Promise<"ok" | "not_found" | "limit"> {
  const listing = await db.listing.findFirst({
    where: { id: listingId, deletedAt: null, status: "active" },
    select: { id: true, title: true },
  })
  if (!listing) return "not_found"

  const name = priceWatchName(listingId)
  const existing = await db.savedSearch.findFirst({
    where: { userId, name, deletedAt: null },
    select: { id: true },
  })
  if (existing) {
    await db.savedSearch.update({
      where: { id: existing.id },
      data: { alertEnabled: true, params: { kind: "price_watch", listingId, lang } },
    })
    return "ok"
  }

  const count = await db.savedSearch.count({ where: { userId, deletedAt: null } })
  if (count >= 20) return "limit"

  await db.savedSearch.create({
    data: {
      id: randomUUID(),
      userId,
      name,
      alertEnabled: true,
      params: { kind: "price_watch", listingId, lang } as Prisma.InputJsonValue,
    },
  })
  return "ok"
}

export async function removePriceWatch(userId: string, listingId: string): Promise<boolean> {
  const name = priceWatchName(listingId)
  const row = await db.savedSearch.findFirst({
    where: { userId, name, deletedAt: null },
    select: { id: true },
  })
  if (!row) return false
  await db.savedSearch.update({ where: { id: row.id }, data: { deletedAt: new Date(), alertEnabled: false } })
  return true
}

export async function listPriceWatchIds(userId: string): Promise<string[]> {
  const rows = await db.savedSearch.findMany({
    where: { userId, deletedAt: null, alertEnabled: true, name: { startsWith: PRICE_WATCH_PREFIX } },
    select: { name: true },
    take: 40,
  })
  return rows.map((r) => r.name.slice(PRICE_WATCH_PREFIX.length)).filter(Boolean)
}

/** Fan-out when a listing price drops. Call after PATCH when newPrice < oldPrice. */
export async function runPriceWatchAlerts(
  listingId: string,
  previousPrice: number,
  newPrice: number,
  currency: string,
): Promise<void> {
  if (!(newPrice < previousPrice)) return

  const listing = await db.listing.findFirst({
    where: { id: listingId, deletedAt: null, status: "active" },
    select: { id: true, title: true, city: true, district: true },
  })
  if (!listing) return

  const name = priceWatchName(listingId)
  const watches = await db.savedSearch.findMany({
    where: { name, alertEnabled: true, deletedAt: null },
    select: { id: true, userId: true, params: true },
  })
  if (watches.length === 0) return

  const oldLabel = fmt(previousPrice, currency)
  const newLabel = fmt(newPrice, currency)

  for (const w of watches) {
    try {
      const params = (w.params ?? {}) as { lang?: string }
      const lang = alertLang(params.lang)
      const copy = COPY[lang]
      const title = copy.subject(listing.title).slice(0, 240)
      const body = copy.body(listing.title, oldLabel, newLabel)
      const path = lang === "ka" ? `/listing/${listingId}` : `/${lang}/listing/${listingId}`
      const url = `${SITE}${path}`

      await db.notification.create({
        data: {
          userId: w.userId,
          kind: "price_drop",
          title,
          body,
          actionUrl: path,
          metadata: { listingId, previousPrice, newPrice, currency },
        },
      })

      const user = await db.user.findUnique({
        where: { id: w.userId },
        select: { email: true },
      })
      if (user?.email) {
        const sub = await db.listingAlertSubscription.findFirst({
          where: { email: user.email, unsubscribedAt: null },
          select: { id: true },
        })
        if (sub) {
          void sendEmail({
            to: user.email,
            subject: title,
            html: `
              <h2>${escapeHtml(title)}</h2>
              <p>${escapeHtml(body)}</p>
              <p>${escapeHtml(listing.district)}, ${escapeHtml(listing.city)}</p>
              <p><a href="${escapeHtml(url)}" style="color:#1a56db;font-weight:600">${escapeHtml(copy.cta)}</a></p>
            `,
          })
        }
      }

      await sendPushToUser(w.userId, { title, body, url: path })
      await db.savedSearch.update({ where: { id: w.id }, data: { lastAlertAt: new Date() } })
    } catch (e) {
      console.error("[price-watches] fan-out failed:", (e as Error).message)
    }
  }
}
