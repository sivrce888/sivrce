import { BadgeCheck, Clock, ShieldCheck } from "lucide-react"

import { requestProfileVerification } from "@/lib/verification/request"
import { db } from "@/lib/db"
import { safeQuery } from "@/lib/guards"

/**
 * Self-serve "get verified" card for pro dashboards. Renders the live state
 * (verified / pending / requestable) and posts the shared server action.
 */
export async function RequestVerification({
  subjectType,
  subjectId,
  verified,
}: {
  subjectType: "agent" | "agency" | "developer"
  subjectId: string
  verified: boolean
}) {
  const pending = await safeQuery(
    () =>
      db.verificationRequest.findFirst({
        where: { subjectType, subjectId, status: "pending", deletedAt: null },
        select: { id: true },
      }),
    null,
  )

  return (
    <section className="mt-6 rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-[15px] font-extrabold text-sv-ink">
            <ShieldCheck size={15} className="text-sv-blue" aria-hidden />
            ვერიფიკაცია
          </h2>
          {verified ? (
            <p className="mt-1 flex items-center gap-1.5 text-[12.5px] font-medium text-sv-ink/55">
              <BadgeCheck size={13} className="text-sv-blue" aria-hidden />
              პროფილი ვერიფიცირებულია — საჯარო გვერდზე სანდოობის ნიშანი ჩნდება.
            </p>
          ) : pending ? (
            <p className="mt-1 flex items-center gap-1.5 text-[12.5px] font-medium text-sv-ink/55">
              <Clock size={13} className="text-sv-blue" aria-hidden />
              მოთხოვნა განხილვაშია — შედეგი მოვა ელ-ფოსტაზე.
            </p>
          ) : (
            <>
              <p className="mt-1 text-[12.5px] font-medium text-sv-ink/55">
                გაიარე ვერიფიკაცია — ვერიფიცირებული პროფილები ძიებაში და დირექტორიაში მაღლა
                ჩანს და მეტ ლიდს იღებს.
              </p>
              <form action={requestProfileVerification} className="mt-3">
                <input type="hidden" name="subjectType" value={subjectType} />
                <input type="hidden" name="subjectId" value={subjectId} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full border border-sv-blue/40 px-4 py-2 text-[12.5px] font-bold text-sv-blue transition hover:border-sv-blue hover:bg-sv-blue/5"
                >
                  <ShieldCheck size={13} aria-hidden />
                  მოითხოვე ვერიფიკაცია
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
