"use client"

import { useFormStatus } from "react-dom"
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Check,
  Home,
  KeyRound,
  Loader2,
  Search,
  Tag,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { chooseSelfRole } from "@/app/auth/actions"
import { ROLE_LABEL_KA, type SelfServeRole } from "@/lib/auth-roles"
import {
  CONSUMER_PERSONAS,
  PERSONA_LABEL_KA,
  PRO_PERSONAS,
  type Persona,
} from "@/lib/workspace"

const PERSONA_ICON: Record<Exclude<Persona, "admin">, LucideIcon> = {
  buyer: Search,
  tenant: Home,
  seller: Tag,
  landlord: KeyRound,
  agent: BadgeCheck,
  agency: Building2,
  developer: Briefcase,
}

function PendingLabel({ idle, busy = "იტვირთება…" }: { idle: string; busy?: string }) {
  const { pending } = useFormStatus()
  return <>{pending ? busy : idle}</>
}

function PersonaCard({
  persona,
  current,
  intent,
}: {
  persona: Exclude<Persona, "admin">
  current: Persona | string
  intent: Persona | null
}) {
  const active = current === persona
  const highlighted = !active && intent === persona
  const pro = (PRO_PERSONAS as readonly string[]).includes(persona)
  const { title, blurb } = PERSONA_LABEL_KA[persona]

  return (
    <form action={chooseSelfRole} className="contents">
      <input type="hidden" name="persona" value={persona} />
      <PersonaSubmitButton
        persona={persona}
        active={active}
        highlighted={highlighted}
        pro={pro}
        title={title}
        blurb={blurb}
      />
    </form>
  )
}

function PersonaSubmitButton({
  persona,
  active,
  highlighted,
  pro,
  title,
  blurb,
}: {
  persona: Exclude<Persona, "admin">
  active: boolean
  highlighted: boolean
  pro: boolean
  title: string
  blurb: string
}) {
  const { pending } = useFormStatus()
  const Icon = PERSONA_ICON[persona]
  return (
    <button
      type="submit"
      disabled={active || pending}
      aria-pressed={active}
      aria-busy={pending}
      aria-label={`${title} — ${blurb}`}
      className={`group relative w-full rounded-module border px-4 py-4 text-left transition duration-300 disabled:opacity-100 ${
        active
          ? pro
            ? "border-sv-orange bg-sv-orange/8 text-sv-orange-deep shadow-glow-orange"
            : "border-sv-blue bg-sv-blue/8 text-sv-blue shadow-glow-blue-sm"
          : highlighted
            ? "border-sv-orange/50 bg-sv-orange/[0.04] ring-2 ring-sv-orange/25 hover:border-sv-orange hover:bg-sv-cloud"
            : "border-sv-ink/8 hover:-translate-y-0.5 hover:border-sv-blue/35 hover:bg-sv-cloud hover:shadow-card"
      }`}
    >
      <span className="flex items-start gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-module transition ${
            active
              ? pro
                ? "bg-sv-orange/15 text-sv-orange"
                : "bg-sv-blue/15 text-sv-blue"
              : "bg-sv-blue/10 text-sv-blue group-hover:bg-sv-blue/15"
          }`}
        >
          {pending ? (
            <Loader2 size={18} className="animate-spin" aria-hidden />
          ) : (
            <Icon size={18} aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="block text-[14px] font-extrabold tracking-[-0.01em]">{title}</span>
            {active ? (
              <Check size={15} className="shrink-0 text-current" aria-hidden />
            ) : null}
          </span>
          <span className="mt-0.5 block text-[12px] font-medium leading-snug text-sv-ink/50">
            {blurb}
          </span>
        </span>
      </span>
    </button>
  )
}

/** Apple-style confirm when we already know the intended pro role. */
export function ConfirmRole({ role }: { role: SelfServeRole }) {
  const Icon = PERSONA_ICON[role]
  const { title, blurb } = ROLE_LABEL_KA[role]

  return (
    <form action={chooseSelfRole} className="space-y-5">
      <input type="hidden" name="persona" value={role} />
      <div className="flex flex-col items-center px-2 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-tile bg-sv-orange/12 text-sv-orange">
          <Icon size={28} aria-hidden />
        </span>
        <p className="mt-4 text-[17px] font-extrabold tracking-[-0.02em] text-sv-ink">{title}</p>
        <p className="mt-1 max-w-[16rem] text-[13px] font-medium leading-relaxed text-sv-ink/50">
          {blurb}
        </p>
      </div>
      <ConfirmSubmit />
    </form>
  )
}

function ConfirmSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="flex w-full items-center justify-center rounded-full bg-sv-orange px-6 py-3.5 text-[14.5px] font-extrabold text-white shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-80"
    >
      <PendingLabel idle="გაგრძელება" />
    </button>
  )
}

export function RolePicker({
  currentPersona,
  currentRole,
  intent = null,
  compact = false,
}: {
  currentPersona?: Persona | string
  /** @deprecated prefer currentPersona */
  currentRole?: SelfServeRole | string
  intent?: Persona | null
  compact?: boolean
}) {
  const current = currentPersona ?? currentRole ?? "buyer"
  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      {!compact && intent && intent !== "admin" ? (
        <p className="rounded-module border border-sv-orange/20 bg-sv-orange/[0.06] px-4 py-3 text-[13px] font-semibold text-sv-ink/70">
          <Home size={14} className="mr-1.5 inline -translate-y-px text-sv-orange" aria-hidden />
          შენ გამოგზავნენ როგორც{" "}
          <span className="font-extrabold text-sv-ink">{PERSONA_LABEL_KA[intent].title}-ს</span>.
          აირჩიე ქვემოთ ან გამოტოვე — ნაგულისხმევი მყიდველია.
        </p>
      ) : null}

      <div>
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-sv-ink/40">
          ვეძებ
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {CONSUMER_PERSONAS.slice(0, 2).map((persona) => (
            <PersonaCard key={persona} persona={persona} current={current} intent={intent} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-sv-ink/40">
          ვაქვეყნებ
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {CONSUMER_PERSONAS.slice(2).map((persona) => (
            <PersonaCard key={persona} persona={persona} current={current} intent={intent} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-sv-ink/40">
          პროფესიონალი ვარ
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {PRO_PERSONAS.map((persona) => (
            <PersonaCard key={persona} persona={persona} current={current} intent={intent} />
          ))}
        </div>
      </div>
    </div>
  )
}
