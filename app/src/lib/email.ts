/**
 * Email adapter: thin wrapper around Resend.
 *
 * ponytail: fire-and-forget send — callers don't await, errors are logged
 * but never thrown to the request handler. If RESEND_API_KEY is missing,
 * emails are logged to the console instead (graceful degradation).
 */

import { Resend } from "resend"

const FROM = "Sivrce <noreply@sivrce.ge>"

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  /** React email component (optional, not yet wired). */
  react?: unknown
}

export async function sendEmail(params: SendEmailParams): Promise<{ ok: boolean }> {
  const resend = client()
  if (!resend) {
    console.log("[email] RESEND_API_KEY not set — logged instead of sent:", {
      to: params.to,
      subject: params.subject,
    })
    return { ok: true }
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    if (error) {
      console.error("[email] Resend error:", error.message)
      return { ok: false }
    }
    return { ok: true }
  } catch (err) {
    const e = err as { message?: string }
    console.error("[email] send failed:", e?.message)
    return { ok: false }
  }
}

/* ------------------------------------------------------------------ */
/*  Pre-built notification helpers                                    */
/* ------------------------------------------------------------------ */

export interface InquiryNotificationParams {
  agentEmail: string
  agentName: string
  buyerName: string
  buyerPhone?: string | null
  buyerEmail?: string | null
  message: string
  listingTitle?: string
}

/**
 * Fire-and-forget: notify the listing agent about a new inquiry.
 * Callers should NOT await this — it must never block the API response.
 */
export function sendInquiryNotification(params: InquiryNotificationParams): void {
  const listingLine = params.listingTitle
    ? `<p><strong>Listing:</strong> ${escapeHtml(params.listingTitle)}</p>`
    : ""

  void sendEmail({
    to: params.agentEmail,
    subject: `New inquiry from ${params.buyerName}`,
    html: `
      <h2>New Inquiry</h2>
      <p><strong>From:</strong> ${escapeHtml(params.buyerName)}</p>
      ${params.buyerEmail ? `<p><strong>Email:</strong> ${escapeHtml(params.buyerEmail)}</p>` : ""}
      ${params.buyerPhone ? `<p><strong>Phone:</strong> ${escapeHtml(params.buyerPhone)}</p>` : ""}
      ${listingLine}
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(params.message)}</p>
      <hr />
      <p style="color:#888;font-size:12px">
        This inquiry was sent via Sivrce. Reply directly to the buyer's email or phone.
      </p>
    `,
  })
}

export interface WelcomeEmailParams {
  to: string
  name: string
}

/** Fire-and-forget: welcome email for new user signups. */
export function sendWelcomeEmail(params: WelcomeEmailParams): void {
  void sendEmail({
    to: params.to,
    subject: "Welcome to Sivrce!",
    html: `
      <h2>Welcome to Sivrce, ${escapeHtml(params.name)}!</h2>
      <p>Your account has been created successfully.</p>
      <p>Start browsing listings, save your favorites, and connect with agents across Georgia.</p>
      <p>
        <a href="https://sivrce.ge" style="color:#1a56db;font-weight:600">
          Explore listings &rarr;
        </a>
      </p>
    `,
  })
}

export interface AuctionOutbidParams {
  to: string
  userName: string
  listingTitle: string
  outbidAmount: number
  currency?: string
  listingUrl: string
}

/** Fire-and-forget: notify an auction participant they've been outbid. */
export function sendAuctionOutbidNotification(params: AuctionOutbidParams): void {
  const currency = params.currency ?? "GEL"
  void sendEmail({
    to: params.to,
    subject: `You've been outbid on ${params.listingTitle}`,
    html: `
      <h2>Outbid Alert</h2>
      <p>Hi ${escapeHtml(params.userName)},</p>
      <p>
        Someone has placed a higher bid of
        <strong>${escapeHtml(String(params.outbidAmount))} ${escapeHtml(currency)}</strong>
        on <strong>${escapeHtml(params.listingTitle)}</strong>.
      </p>
      <p>
        <a href="${escapeHtml(params.listingUrl)}" style="color:#1a56db;font-weight:600">
          View listing & place a new bid &rarr;
        </a>
      </p>
    `,
  })
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                  */
/* ------------------------------------------------------------------ */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
