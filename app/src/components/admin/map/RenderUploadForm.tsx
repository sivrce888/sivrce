"use client"

import { useActionState } from "react"

import {
  setProjectRenderUrl,
  uploadProjectRender,
  type RenderFormState,
} from "@/app/[lang]/admin/map/actions"

const inputCls =
  "h-10 w-full rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 text-[13.5px] text-sv-ink outline-none placeholder:text-sv-ink/30 focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25"

export function RenderUploadForm({
  slugs,
  defaultSlug,
}: {
  slugs: string[]
  defaultSlug?: string
}) {
  const [up, upAction, upPending] = useActionState<RenderFormState, FormData>(uploadProjectRender, {
    error: null,
    savedUrl: null,
  })
  const [set, setAction, setPending] = useActionState<RenderFormState, FormData>(setProjectRenderUrl, {
    error: null,
    savedUrl: null,
  })

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="mb-1 text-[15px] font-extrabold text-sv-ink">Upload render</h2>
        <p className="mb-4 text-[12.5px] text-sv-ink/45">
          WebP/JPEG/PNG → R2 CDN → live directory image. Max 10 MB.
        </p>
        <form action={upAction} className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-bold text-sv-ink/70">Project slug</span>
            <input
              name="slug"
              list="render-slugs"
              defaultValue={defaultSlug ?? ""}
              required
              placeholder="anagi-police-city"
              className={inputCls}
            />
            <datalist id="render-slugs">
              {slugs.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-bold text-sv-ink/70">Image</span>
            <input
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              required
              className="block w-full text-[13px] text-sv-ink/70 file:mr-3 file:rounded-[var(--radius-control)] file:border-0 file:bg-sv-blue file:px-3 file:py-2 file:text-[12.5px] file:font-bold file:text-white"
            />
          </label>
          <button
            type="submit"
            disabled={upPending}
            className="inline-flex h-9 items-center rounded-[var(--radius-control)] bg-sv-orange px-4 text-[12.5px] font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {upPending ? "Uploading…" : "Upload & publish"}
          </button>
          {up.error ? (
            <p role="alert" className="text-[12.5px] font-bold text-rose-600">
              {up.error}
            </p>
          ) : up.savedUrl ? (
            <p className="break-all text-[12.5px] font-semibold text-emerald-600">
              Saved: {up.savedUrl}
            </p>
          ) : null}
        </form>
      </section>

      <section className="rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="mb-1 text-[15px] font-extrabold text-sv-ink">Set render URL</h2>
        <p className="mb-4 text-[12.5px] text-sv-ink/45">
          Point at an existing <code className="font-mono text-[11px]">/images/projects/…</code> or
          CDN URL without re-upload.
        </p>
        <form action={setAction} className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-bold text-sv-ink/70">Project slug</span>
            <input
              name="slug"
              list="render-slugs"
              defaultValue={defaultSlug ?? ""}
              required
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-bold text-sv-ink/70">URL</span>
            <input
              name="url"
              type="text"
              required
              placeholder="/images/projects/slug.webp"
              className={inputCls}
            />
          </label>
          <button
            type="submit"
            disabled={setPending}
            className="inline-flex h-9 items-center rounded-[var(--radius-control)] bg-sv-blue px-4 text-[12.5px] font-bold text-white hover:bg-sv-blue-deep disabled:opacity-50"
          >
            {setPending ? "Saving…" : "Save URL"}
          </button>
          {set.error ? (
            <p role="alert" className="text-[12.5px] font-bold text-rose-600">
              {set.error}
            </p>
          ) : set.savedUrl ? (
            <p className="break-all text-[12.5px] font-semibold text-emerald-600">
              Saved: {set.savedUrl}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  )
}
