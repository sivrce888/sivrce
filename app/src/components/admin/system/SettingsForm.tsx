"use client"

import { useActionState } from "react"

import { saveSettings } from "@/app/[lang]/admin/system/actions"
import type { SettingsFormState } from "@/lib/admin/system"
import type { ConfigSectionModel } from "@/lib/config"

const inputCls =
  "h-10 w-full rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 text-[13.5px] text-sv-ink outline-none placeholder:text-sv-ink/30 focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25"

function FieldControl({
  f,
}: {
  f: ConfigSectionModel["fields"][number]
}) {
  if (f.input === "gel" || f.input === "number") {
    return (
      <input
        name={f.key}
        type="number"
        min={f.min ?? 0}
        max={f.max}
        step={f.step ?? (f.input === "gel" ? 1 : 0.1)}
        defaultValue={f.value}
        placeholder={f.defaultLabel}
        aria-label={f.label}
        className={inputCls}
      />
    )
  }
  if (f.input === "bool") {
    return (
      <select name={f.key} defaultValue={f.value} aria-label={f.label} className={inputCls}>
        <option value="">Default ({f.defaultLabel})</option>
        <option value="true">On</option>
        <option value="false">Off</option>
      </select>
    )
  }
  if (f.input === "select" && f.options) {
    return (
      <select name={f.key} defaultValue={f.value} aria-label={f.label} className={inputCls}>
        <option value="">Default ({f.defaultLabel})</option>
        {f.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  }
  return (
    <input
      name={f.key}
      type="text"
      defaultValue={f.value}
      placeholder={f.defaultLabel}
      aria-label={f.label}
      className={inputCls}
    />
  )
}

/** Grouped settings form — one section card per config group, one save for all. */
export function SettingsForm({
  sections,
  action = saveSettings,
}: {
  sections: ConfigSectionModel[]
  /** Override when saving a subset (e.g. map-only) — still validates full registry. */
  action?: typeof saveSettings
}) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(action, {
    error: null,
    saved: false,
  })

  return (
    <form action={formAction} className="space-y-5">
      {sections.map((section) => (
        <section
          key={section.id}
          className="rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]"
        >
          <h2 className="mb-4 text-[15px] font-extrabold text-sv-ink">{section.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.fields.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1.5 block text-[12.5px] font-bold text-sv-ink/70">
                  {f.label}
                </span>
                <FieldControl f={f} />
                <span className="mt-1 block text-[11.5px] leading-snug text-sv-ink/40">
                  {f.hint} Default: {f.defaultLabel} — blank resets to default.
                </span>
              </label>
            ))}
          </div>
        </section>
      ))}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-[var(--radius-control)] bg-sv-blue px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-sv-blue-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
        {state.error ? (
          <p role="alert" className="text-[12.5px] font-bold text-rose-600">
            {state.error}
          </p>
        ) : state.saved ? (
          <p className="text-[12.5px] font-semibold text-emerald-600">Saved</p>
        ) : null}
      </div>
    </form>
  )
}
