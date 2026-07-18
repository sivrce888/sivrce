/**
 * Twilio Verify via REST (no SDK).
 * Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID
 */

function creds(): { sid: string; token: string; service: string } | null {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const service = process.env.TWILIO_VERIFY_SERVICE_SID
  if (!sid || !token || !service) return null
  return { sid, token, service }
}

function authHeader(sid: string, token: string): string {
  return `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`
}

/** E.164 for Twilio — accept "+995 555 12 34 56" or "+995555123456". */
export function toE164(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "")
  if (/^\+995\d{9}$/.test(digits)) return digits
  const spaced = phone.trim()
  if (/^\+995 \d{3} \d{2} \d{2} \d{2}$/.test(spaced)) {
    return spaced.replace(/\s/g, "")
  }
  return null
}

export async function sendVerifySms(phone: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = creds()
  if (!c) return { ok: false, error: "sms_unconfigured" }
  const to = toE164(phone)
  if (!to) return { ok: false, error: "bad_phone" }

  const body = new URLSearchParams({ To: to, Channel: "sms" })
  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${c.service}/Verifications`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader(c.sid, c.token),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  )
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    console.error("[twilio-verify] send failed", res.status, text.slice(0, 200))
    return { ok: false, error: "send_failed" }
  }
  return { ok: true }
}

export async function checkVerifySms(
  phone: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = creds()
  if (!c) return { ok: false, error: "sms_unconfigured" }
  const to = toE164(phone)
  if (!to) return { ok: false, error: "bad_phone" }
  if (!/^\d{4,8}$/.test(code.trim())) return { ok: false, error: "bad_code" }

  const body = new URLSearchParams({ To: to, Code: code.trim() })
  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${c.service}/VerificationCheck`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader(c.sid, c.token),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  )
  if (!res.ok) {
    console.error("[twilio-verify] check http", res.status)
    return { ok: false, error: "check_failed" }
  }
  const json = (await res.json()) as { status?: string }
  if (json.status !== "approved") return { ok: false, error: "invalid_code" }
  return { ok: true }
}
