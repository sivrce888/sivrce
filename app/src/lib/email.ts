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
    // Error level: a prod deploy without RESEND_API_KEY silently drops leads.
    console.error("[email] RESEND_API_KEY not set — logged instead of sent:", {
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
  /** Override default "ახალი მოთხოვნა — …" subject. */
  subject?: string
}

/**
 * Fire-and-forget: notify the listing agent about a new inquiry.
 * Callers should NOT await this — it must never block the API response.
 */
export function sendInquiryNotification(params: InquiryNotificationParams): void {
  const listingLine = params.listingTitle
    ? `<p><strong>განცხადება:</strong> ${escapeHtml(params.listingTitle)}</p>`
    : ""

  void sendEmail({
    to: params.agentEmail,
    subject: params.subject ?? `ახალი მოთხოვნა — ${params.buyerName}`,
    html: `
      <h2>${params.subject?.startsWith("კარიერა") ? "კარიერა" : "ახალი მოთხოვნა"}</h2>
      <p><strong>ავტორი:</strong> ${escapeHtml(params.buyerName)}</p>
      ${params.buyerEmail ? `<p><strong>ელფოსტა:</strong> ${escapeHtml(params.buyerEmail)}</p>` : ""}
      ${params.buyerPhone ? `<p><strong>ტელეფონი:</strong> ${escapeHtml(params.buyerPhone)}</p>` : ""}
      ${listingLine}
      <p><strong>მესიჯი:</strong></p>
      <p>${escapeHtml(params.message)}</p>
      <hr />
      <p style="color:#888;font-size:12px">
        ეს მოთხოვნა Sivrce-ის საშუალებით გამოიგზავნა. უპასუხე პირდაპირ მყიდველის ელფოსტაზე ან ტელეფონზე.
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
    subject: "მოგესალმებით Sivrce-ში!",
    html: `
      <h2>მოგესალმებით Sivrce-ში, ${escapeHtml(params.name)}!</h2>
      <p>შენი ანგარიში წარმატებით შეიქმნა.</p>
      <p>დაიწყე განცხადების ძიება, შეინახე ფავორიტები და დაუკავშირდი აგენტებს მთელ საქართველოში.</p>
      <p>
        <a href="https://sivrce.ge" style="color:#1a56db;font-weight:600">
          განცხადებების ნახვა &rarr;
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
    subject: `უფრო მაღალი შემოთავაზება — ${params.listingTitle}`,
    html: `
      <h2>გადაგასწრეს</h2>
      <p>გამარჯობა ${escapeHtml(params.userName)},</p>
      <p>
        ვინმემ უფრო მაღალი შემოთავაზება გააკეთა —
        <strong>${escapeHtml(String(params.outbidAmount))} ${escapeHtml(currency)}</strong>
        — <strong>${escapeHtml(params.listingTitle)}</strong>-ზე.
      </p>
      <p>
        <a href="${escapeHtml(params.listingUrl)}" style="color:#1a56db;font-weight:600">
          ნახე განცხადება და დაამატე ახალი შემოთავაზება &rarr;
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
