import webpush from "web-push"

import { db } from "@/lib/db"

/**
 * Web Push send path (VAPID). Keys come from env:
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT.
 * When keys are missing every send is a no-op (skipped) so dev machines
 * without keys never crash.
 */

export interface PushPayload {
  title: string
  body?: string
  /** In-app path to open on click, e.g. "/listing/123". */
  url?: string
}

export interface PushSendResult {
  sent: number
  /** Subscriptions removed because the push service says they are gone (404/410). */
  pruned: number
  /** True when VAPID keys are not configured — nothing was attempted. */
  skipped?: boolean
}

let vapidReady = false

function ensureVapid(): boolean {
  if (vapidReady) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:hi@sivrce.ge",
    publicKey,
    privateKey,
  )
  vapidReady = true
  return true
}

async function deliver(
  subs: { id: string; endpoint: string; p256dh: string; auth: string }[],
  payload: PushPayload,
): Promise<PushSendResult> {
  const body = JSON.stringify(payload)
  const dead: string[] = []
  let sent = 0

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        )
        sent += 1
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          dead.push(sub.id)
        } else {
          console.error("[push] send failed", { status, endpoint: sub.endpoint.slice(0, 60) })
        }
      }
    }),
  )

  if (dead.length > 0) {
    await db.pushSubscription.deleteMany({ where: { id: { in: dead } } })
  }
  return { sent, pruned: dead.length }
}

/** Send a push to every active subscription of one user. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<PushSendResult> {
  if (!ensureVapid()) return { sent: 0, pruned: 0, skipped: true }
  const subs = await db.pushSubscription.findMany({ where: { userId, isActive: true } })
  return deliver(subs, payload)
}

/** Send a push to every active subscription (admin broadcast). */
export async function sendPushToAll(payload: PushPayload): Promise<PushSendResult> {
  if (!ensureVapid()) return { sent: 0, pruned: 0, skipped: true }
  const subs = await db.pushSubscription.findMany({ where: { isActive: true } })
  return deliver(subs, payload)
}
