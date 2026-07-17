import { Mail, Phone } from "lucide-react"

/** Buyer / agent contact block for the inquiry detail sidebar. */
export function ContactCard({
  title,
  name,
  email,
  phone,
}: {
  title: string
  name: string
  email?: string | null
  phone?: string | null
}) {
  return (
    <section className="rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-[12px] font-bold tracking-[0.08em] text-sv-ink/45 uppercase">
        {title}
      </h2>
      <p className="mt-2 text-[15px] font-bold break-words text-sv-ink">{name}</p>
      <div className="mt-2.5 flex flex-col gap-1.5 text-[13px]">
        {email ? (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2 break-all text-sv-ink/70 transition-colors hover:text-sv-blue"
          >
            <Mail className="h-3.5 w-3.5 shrink-0 text-sv-ink/35" />
            {email}
          </a>
        ) : null}
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-2 text-sv-ink/70 transition-colors hover:text-sv-blue"
          >
            <Phone className="h-3.5 w-3.5 shrink-0 text-sv-ink/35" />
            {phone}
          </a>
        ) : null}
        {!email && !phone ? <p className="text-sv-ink/40">No contact details</p> : null}
      </div>
    </section>
  )
}
