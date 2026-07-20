/**
 * Twilio WhatsApp Messages API (REST, no SDK).
 * Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 * FROM example: whatsapp:+14155238886 (sandbox) or whatsapp:+995…
 *
 * ponytail: freeform Body for sandbox / 24h session. Content templates
 * (TWILIO_WA_CONTENT_SID) when Meta-approved outbound alerts are required.
 */

import { toE164 } from "@/lib/sms/twilio-verify"

function creds(): { sid: string; token: string; from: string } | null {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM
  if (!sid || !token || !from) return null
  return { sid, token, from }
}

function authHeader(sid: string, token: string): string {
  return `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`
}

export type WhatsAppResult = { ok: true } | { ok: false; error: string }

export async function sendWhatsApp(params: {
  phone: string
  body: string
}): Promise<WhatsAppResult> {
  const c = creds()
  if (!c) return { ok: false, error: "wa_unconfigured" }
  const e164 = toE164(params.phone)
  if (!e164) return { ok: false, error: "bad_phone" }
  const text = params.body.trim().slice(0, 1500)
  if (!text) return { ok: false, error: "empty_body" }

  const to = params.phone.startsWith("whatsapp:") ? params.phone : `whatsapp:${e164}`
  const from = c.from.startsWith("whatsapp:") ? c.from : `whatsapp:${c.from}`

  const form = new URLSearchParams({ From: from, To: to })
  const contentSid = process.env.TWILIO_WA_CONTENT_SID
  if (contentSid) {
    form.set("ContentSid", contentSid)
    form.set("ContentVariables", JSON.stringify({ 1: text.slice(0, 200) }))
  } else {
    form.set("Body", text)
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${c.sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader(c.sid, c.token),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    },
  )
  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    console.error("[whatsapp] send failed", res.status, errText.slice(0, 200))
    return { ok: false, error: "send_failed" }
  }
  return { ok: true }
}
