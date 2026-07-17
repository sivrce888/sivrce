"use client"

import Link from "next/link"
import { useActionState, useState } from "react"

import { saveBlogPost } from "@/app/admin/content/blog/actions"
import type { ContentFormState } from "@/lib/admin/content"

const labelCls = "mb-1.5 block text-[12.5px] font-bold text-sv-ink/60"
const inputCls =
  "h-11 w-full rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3.5 text-[14px] text-sv-ink outline-none transition-colors placeholder:text-sv-ink/30 focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25"
const textareaCls =
  "w-full rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3.5 py-3 text-[14px] leading-relaxed text-sv-ink outline-none transition-colors placeholder:text-sv-ink/30 focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25"
const panelCls =
  "rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-6 shadow-[var(--shadow-card)]"

export interface BlogEditorDefaults {
  id: string
  slug: string
  status: string
  locale: string
  category: string
  tags: string
  featuredImage: string
  titleKa: string
  titleEn: string
  titleRu: string
  excerptKa: string
  excerptEn: string
  excerptRu: string
  bodyKa: string
  bodyEn: string
  bodyRu: string
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      {children}
    </div>
  )
}

export function BlogEditorForm({
  defaults,
}: {
  defaults: BlogEditorDefaults
}) {
  const isNew = defaults.id === ""
  const [state, formAction, pending] = useActionState<ContentFormState, FormData>(
    saveBlogPost,
    { error: null },
  )
  const [dirty, setDirty] = useState(false)

  return (
    <form
      action={(fd) => {
        setDirty(false)
        formAction(fd)
      }}
      onChange={() => setDirty(true)}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="id" value={defaults.id} />

      <section className={panelCls}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field id="slug" label="Slug" required>
            <input
              id="slug"
              name="slug"
              defaultValue={defaults.slug}
              pattern="[a-z0-9-]+"
              placeholder="my-first-post"
              className={`${inputCls} font-mono text-[13px]`}
              required
            />
          </Field>
          <Field id="status" label="Status">
            <select id="status" name="status" defaultValue={defaults.status} className={inputCls}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <Field id="locale" label="Primary locale">
            <select id="locale" name="locale" defaultValue={defaults.locale} className={inputCls}>
              <option value="ka">Georgian (ka)</option>
              <option value="en">English (en)</option>
              <option value="ru">Russian (ru)</option>
            </select>
          </Field>
          <Field id="category" label="Category">
            <input
              id="category"
              name="category"
              defaultValue={defaults.category}
              placeholder="market-news"
              className={inputCls}
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="tags" label="Tags (comma separated)">
            <input
              id="tags"
              name="tags"
              defaultValue={defaults.tags}
              placeholder="tbilisi, investment"
              className={inputCls}
            />
          </Field>
          <Field id="featuredImage" label="Featured image URL">
            <input
              id="featuredImage"
              name="featuredImage"
              type="url"
              defaultValue={defaults.featuredImage}
              placeholder="https://…"
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <section className={panelCls}>
        <h2 className="mb-4 text-[13px] font-extrabold tracking-[0.08em] text-sv-ink/45 uppercase">
          Titles
        </h2>
        <div className="grid gap-4">
          <Field id="titleKa" label="Title (Georgian)" required>
            <input id="titleKa" name="titleKa" defaultValue={defaults.titleKa} className={inputCls} required />
          </Field>
          <Field id="titleEn" label="Title (English)">
            <input id="titleEn" name="titleEn" defaultValue={defaults.titleEn} className={inputCls} />
          </Field>
          <Field id="titleRu" label="Title (Russian)">
            <input id="titleRu" name="titleRu" defaultValue={defaults.titleRu} className={inputCls} />
          </Field>
        </div>
      </section>

      <section className={panelCls}>
        <h2 className="mb-4 text-[13px] font-extrabold tracking-[0.08em] text-sv-ink/45 uppercase">
          Excerpts
        </h2>
        <div className="grid gap-4">
          <Field id="excerptKa" label="Excerpt (Georgian)">
            <textarea id="excerptKa" name="excerptKa" rows={2} defaultValue={defaults.excerptKa} className={textareaCls} />
          </Field>
          <Field id="excerptEn" label="Excerpt (English)">
            <textarea id="excerptEn" name="excerptEn" rows={2} defaultValue={defaults.excerptEn} className={textareaCls} />
          </Field>
          <Field id="excerptRu" label="Excerpt (Russian)">
            <textarea id="excerptRu" name="excerptRu" rows={2} defaultValue={defaults.excerptRu} className={textareaCls} />
          </Field>
        </div>
      </section>

      <section className={panelCls}>
        <h2 className="mb-4 text-[13px] font-extrabold tracking-[0.08em] text-sv-ink/45 uppercase">
          Body
        </h2>
        <div className="grid gap-4">
          <Field id="bodyKa" label="Body (Georgian)" required>
            <textarea id="bodyKa" name="bodyKa" rows={12} defaultValue={defaults.bodyKa} className={textareaCls} required />
          </Field>
          <Field id="bodyEn" label="Body (English)">
            <textarea id="bodyEn" name="bodyEn" rows={8} defaultValue={defaults.bodyEn} className={textareaCls} />
          </Field>
          <Field id="bodyRu" label="Body (Russian)">
            <textarea id="bodyRu" name="bodyRu" rows={8} defaultValue={defaults.bodyRu} className={textareaCls} />
          </Field>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center rounded-[var(--radius-control)] bg-sv-blue px-6 text-[13.5px] font-bold text-white transition-colors hover:bg-sv-blue-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving…" : isNew ? "Create post" : "Save changes"}
        </button>
        <Link
          href="/admin/content/blog"
          className="inline-flex h-11 items-center rounded-[var(--radius-control)] border border-sv-ink/12 bg-white px-5 text-[13.5px] font-bold text-sv-ink/75 transition-colors hover:border-sv-ink/25 hover:text-sv-ink"
        >
          Cancel
        </Link>
        {state.error ? (
          <p role="alert" className="text-[13px] font-bold text-rose-600">
            {state.error}
          </p>
        ) : null}
        {!state.error && !pending && !dirty && !isNew ? (
          <p className="text-[13px] font-semibold text-emerald-600">All changes saved</p>
        ) : null}
      </div>
    </form>
  )
}
