/**
 * Saved-search alert match engine + notification fan-out.
 *
 * Triggered (fire-and-forget) when a listing becomes active — publish via
 * POST /api/listings, or admin setStatus → active. For every alert-enabled
 * SavedSearch we re-run the SHARED search where-builder (buildDbWhere from
 * @/lib/search-filters — the exact /api/search semantics) with
 * `AND id = <listingId>`, then fan out to the owner:
 *   1. in-app Notification row (always)
 *   2. email — only when the user has an active ListingAlertSubscription
 *   3. web push — sendPushToUser no-ops without subscriptions/keys
 *
 * Dedupe: SavedSearchAlertLog @@unique([savedSearchId, listingId]) — one
 * alert per saved search per listing, ever. createMany skipDuplicates
 * count===0 → already alerted.
 *
 * ponytail: lazy per-search query (1 findFirst per saved search) — fine at
 * current scale (hundreds of saved searches, dozens of daily publishes).
 * Upgrade path: pre-filter candidates by deal/city columns, or a dedicated
 * matcher worker on a queue (BullMQ/pg-boss) when publishes × searches
 * cross ~1k matches/day.
 */

import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { sendPushToUser } from "@/lib/push"
import { buildDbWhere } from "@/lib/search-filters"
import type { SearchFilters } from "@/lib/search"

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sivrce.ge"

/** Shape stored in SavedSearch.params by POST /api/saved-searches. */
export interface SavedSearchParams {
  /** Page-URL query string (short grammar) — for "run this search" links. */
  q: string
  /** UI lang at save time — picks email/notification copy. */
  lang?: string
  /** Parsed filters — fed straight into buildDbWhere. */
  filters?: SearchFilters
}

/* ------------------------------------------------------------------ */
/*  Copy (ka/en/ru; other langs → en)                                  */
/* ------------------------------------------------------------------ */

type AlertLang = "ka" | "en" | "ru"

const COPY: Record<AlertLang, { subject: (name: string) => string; newMatch: string; cta: string }> = {
  ka: {
    subject: (n) => `ახალი განცხადება შენი ძიებით: ${n}`,
    newMatch: "შენს შენახულ ძიებას ახალი განცხადება დაემთხვა:",
    cta: "განცხადების ნახვა →",
  },
  en: {
    subject: (n) => `New listing for your search: ${n}`,
    newMatch: "A new listing matches your saved search:",
    cta: "View listing →",
  },
  ru: {
    subject: (n) => `Новое объявление по вашему поиску: ${n}`,
    newMatch: "Вашему сохранённому поиску соответствует новое объявление:",
    cta: "Смотреть объявление →",
  },
}

const alertLang = (lang: string | undefined): AlertLang =>
  !lang || lang === "ka" ? "ka" : lang === "ru" ? "ru" : "en"

/** ka canonical is unprefixed; other langs get /{lang} prefix (i18n core rule). */
const listingUrl = (id: string, lang: AlertLang): string =>
  lang === "ka" ? `${SITE}/listing/${id}` : `${SITE}/${lang}/listing/${id}`

const escapeHtml = (t: string): string =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/* ------------------------------------------------------------------ */
/*  Engine                                                             */
/* ------------------------------------------------------------------ */

export async function runSavedSearchAlerts(listingId: string): Promise<void> {
  const listing = await db.listing.findFirst({
    where: { id: listingId, deletedAt: null, status: "active" },
    select: { id: true, title: true, city: true, district: true },
  })
  if (!listing) return

  const searches = await db.savedSearch.findMany({
    where: { alertEnabled: true, deletedAt: null },
    select: { id: true, userId: true, name: true, params: true },
  })
  if (searches.length === 0) return

  for (const s of searches) {
    try {
      const stored = (s.params ?? {}) as unknown as SavedSearchParams
      if (!stored.filters) continue

      const hit = await db.listing.findFirst({
        where: { AND: [buildDbWhere(stored.filters), { id: listingId }] },
        select: { id: true },
      })
      if (!hit) continue

      // Dedupe first: losing the unique race means another run already fanned out.
      const log = await db.savedSearchAlertLog.createMany({
        data: { savedSearchId: s.id, listingId },
        skipDuplicates: true,
      })
      if (log.count === 0) continue

      const lang = alertLang(stored.lang)
      const copy = COPY[lang]
      const url = listingUrl(listingId, lang)
      const title = copy.subject(s.name).slice(0, 240)
      const body = `${copy.newMatch} ${listing.title} — ${listing.district}, ${listing.city}`
      const path = url.slice(SITE.length)

      const user = await db.user.findUnique({
        where: { id: s.userId },
        select: { id: true, email: true },
      })
      if (!user) continue

      await db.notification.create({
        data: {
          userId: user.id,
          kind: "saved_search_match",
          title,
          body,
          actionUrl: path,
          metadata: { savedSearchId: s.id, listingId },
        },
      })

      // Email only when the user opted in via the settings toggle
      // (ListingAlertSubscription with unsubscribedAt = null).
      const sub = await db.listingAlertSubscription.findFirst({
        where: { email: user.email, unsubscribedAt: null },
        select: { id: true },
      })
      if (sub) {
        void sendEmail({
          to: user.email,
          subject: title,
          html: `
            <h2>${escapeHtml(copy.subject(s.name))}</h2>
            <p>${escapeHtml(copy.newMatch)}</p>
            <p><strong>${escapeHtml(listing.title)}</strong><br />
              ${escapeHtml(listing.district)}, ${escapeHtml(listing.city)}</p>
            <p><a href="${escapeHtml(url)}" style="color:#1a56db;font-weight:600">${escapeHtml(copy.cta)}</a></p>
          `,
        })
      }

      await sendPushToUser(user.id, { title, body, url: path })
      await db.savedSearch.update({ where: { id: s.id }, data: { lastAlertAt: new Date() } })
    } catch (e) {
      // One bad search must not kill the batch; the trigger is fire-and-forget.
      console.error("[saved-search-alerts] match failed:", (e as Error).message)
    }
  }
}
