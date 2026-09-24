import { BadgeCheck, Clock, ShieldCheck } from "lucide-react"

import { requestProfileVerification } from "@/lib/verification/request"
import { db } from "@/lib/db"
import { safeQuery } from "@/lib/guards"
import { panelLang } from "@/lib/i18n/core"

const L = {
  ka: {
    title: "ვერიფიკაცია",
    verified: "პროფილი ვერიფიცირებულია — საჯარო გვერდზე სანდოობის ნიშანი ჩნდება.",
    pending: "მოთხოვნა განხილვაშია — შედეგი მოვა ელფოსტაზე.",
    pitch:
      "გაიარე ვერიფიკაცია — ვერიფიცირებული პროფილები ძიებაში და დირექტორიაში მაღლა ჩანს და მეტ ლიდს იღებს.",
    cta: "მოითხოვე ვერიფიკაცია",
  },
  en: {
    title: "Verification",
    verified: "Profile verified — a trust badge shows on your public page.",
    pending: "Request under review — you'll get the result by email.",
    pitch: "Get verified — verified profiles rank higher in search and the directory and win more leads.",
    cta: "Request verification",
  },
  de: {
    title: "Verifizierung",
    verified: "Profil verifiziert — auf Ihrer öffentlichen Seite erscheint ein Vertrauenssiegel.",
    pending: "Anfrage wird geprüft — das Ergebnis kommt per E-Mail.",
    pitch:
      "Lassen Sie sich verifizieren — verifizierte Profile ranken in Suche und Verzeichnis höher und erhalten mehr Anfragen.",
    cta: "Verifizierung anfragen",
  },
} as const

/**
 * Self-serve "get verified" card for pro dashboards. Renders the live state
 * (verified / pending / requestable) and posts the shared server action.
 * `verified` omitted → derived from an approved request (DeveloperProfile has
 * no flag column; the approved VerificationRequest is its source of truth).
 */
export async function RequestVerification({
  subjectType,
  subjectId,
  verified,
  lang,
}: {
  subjectType: "agent" | "agency" | "developer"
  subjectId: string
  verified?: boolean
  lang: string
}) {
  const T = L[panelLang(lang)]
  const [pending, approved] = await Promise.all([
    safeQuery(
      () =>
        db.verificationRequest.findFirst({
          where: { subjectType, subjectId, status: "pending", deletedAt: null },
          select: { id: true },
        }),
      null,
    ),
    verified !== undefined
      ? verified
      : safeQuery(
          () =>
            db.verificationRequest
              .findFirst({
                where: { subjectType, subjectId, status: "approved", deletedAt: null },
                select: { id: true },
              })
              .then(Boolean),
          false,
        ),
  ])

  return (
    <section className="mt-6 rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-[15px] font-extrabold text-sv-ink">
            <ShieldCheck size={15} className="text-sv-blue" aria-hidden />
            {T.title}
          </h2>
          {approved ? (
            <p className="mt-1 flex items-center gap-1.5 text-[12.5px] font-medium text-sv-ink/60">
              <BadgeCheck size={13} className="text-sv-blue" aria-hidden />
              {T.verified}
            </p>
          ) : pending ? (
            <p className="mt-1 flex items-center gap-1.5 text-[12.5px] font-medium text-sv-ink/60">
              <Clock size={13} className="text-sv-blue" aria-hidden />
              {T.pending}
            </p>
          ) : (
            <>
              <p className="mt-1 text-[12.5px] font-medium text-sv-ink/60">{T.pitch}</p>
              <form action={requestProfileVerification} className="mt-3">
                <input type="hidden" name="subjectType" value={subjectType} />
                <input type="hidden" name="subjectId" value={subjectId} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full border border-sv-blue/40 px-4 py-2 text-[12.5px] font-bold text-sv-blue transition hover:border-sv-blue hover:bg-sv-blue/5"
                >
                  <ShieldCheck size={13} aria-hidden />
                  {T.cta}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
