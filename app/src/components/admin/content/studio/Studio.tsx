"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Eye,
  EyeOff,
  GripVertical,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react"
import Link from "next/link"

import { saveCmsKey, saveHomeLayout } from "@/app/[lang]/admin/content/studio/actions"
import { ContentTabs } from "@/components/admin/content/ContentTabs"
import type { CmsRow } from "@/lib/cms"
import {
  HOME_SECTIONS,
  HOME_VIP_FOLLOW,
  lockHomeVipRails,
  moveHomeLayout,
  previewPath,
  sectionById,
  sectionIdForKey,
  type HomeLayoutItem,
  type StudioPage,
  type StudioSection,
} from "@/lib/cms-studio"
import { LANGS, type Lang } from "@/lib/i18n/core"

const LANG_LABEL: Record<Lang, string> = {
  ka: "ქართული",
  en: "English",
  ru: "Русский",
  he: "עברית",
  ar: "العربية",
  tr: "Türkçe",
  uk: "Українська",
  hy: "Հայերեն",
  az: "Azərbaycan",
}

const DEVICES = [
  { id: "desktop", width: null as number | null, icon: Monitor, label: "Desktop" },
  { id: "tablet", width: 768, icon: Tablet, label: "Tablet" },
  { id: "phone", width: 390, icon: Smartphone, label: "Phone" },
] as const

type DeviceId = (typeof DEVICES)[number]["id"]

const textareaCls =
  "w-full rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 py-2 text-[13.5px] leading-relaxed text-sv-ink outline-none placeholder:text-sv-ink/30 focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25"

export function Studio({
  lang,
  pageId,
  pages,
  layout: layoutInit,
  homeRows,
  pageRows,
}: {
  lang: Lang
  pageId: string
  pages: readonly StudioPage[]
  layout: HomeLayoutItem[]
  homeRows: Record<string, CmsRow[]>
  pageRows: CmsRow[]
}) {
  const page = pages.find((p) => p.id === pageId) ?? pages[0]
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const router = useRouter()
  const [device, setDevice] = useState<DeviceId>("desktop")
  const [layout, setLayout] = useState(layoutInit)
  const [selected, setSelected] = useState<string>(page.id === "home" ? "hero" : page.id)
  const [focusKey, setFocusKey] = useState<string | null>(null)
  const [bust, setBust] = useState(0)
  const [status, setStatus] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const dragId = useRef<string | null>(null)

  const src = `${previewPath(lang, page.path)}?cmsPreview=1&v=${bust}`
  const deviceW = DEVICES.find((d) => d.id === device)?.width ?? null

  const postActive = useCallback((section: string | null) => {
    iframeRef.current?.contentWindow?.postMessage({ type: "cms:active", section }, window.location.origin)
  }, [])

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      const d = e.data as { type?: string; section?: string; key?: string }
      if (d?.type !== "cms:select") return
      if (d.section) setSelected(d.section)
      else if (d.key) {
        const sid = sectionIdForKey(d.key)
        if (sid) setSelected(sid)
      }
      if (d.key) setFocusKey(d.key)
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [])

  useEffect(() => {
    postActive(page.id === "home" ? selected : null)
  }, [selected, bust, page.id, postActive])

  const inspectorRows = useMemo(() => {
    if (page.id !== "home") return pageRows
    return homeRows[selected] ?? []
  }, [page.id, pageRows, homeRows, selected])

  const selectedSection: StudioSection | undefined =
    page.id === "home" ? sectionById(selected) : { id: page.id, label: page.label, keys: [] }

  function persistLayout(next: HomeLayoutItem[]) {
    const locked = lockHomeVipRails(next)
    setLayout(locked)
    start(async () => {
      const r = await saveHomeLayout(locked)
      setStatus(r.error ?? "Layout live")
      if (!r.error) {
        setBust((n) => n + 1)
        router.refresh()
      }
    })
  }

  function onDrop(overId: string) {
    const from = dragId.current
    dragId.current = null
    if (!from || from === overId) return
    persistLayout(moveHomeLayout(layout, from, overId))
  }

  function toggleHidden(id: HomeLayoutItem["id"]) {
    persistLayout(
      layout.map((i) =>
        i.id === id ? { id: i.id, ...(i.hidden ? {} : { hidden: true as const }) } : i,
      ),
    )
  }

  function saveRow(key: string, value: string) {
    start(async () => {
      const r = await saveCmsKey(lang, key, value)
      setStatus(r.error ?? "Saved — live on the site")
      if (!r.error) {
        setBust((n) => n + 1)
        router.refresh()
      }
    })
  }

  const pinnedStart = HOME_SECTIONS.filter((s) => s.pin === "start")
  const pinnedEnd = HOME_SECTIONS.filter((s) => s.pin === "end" || s.pin === "meta")

  return (
    <div className="flex h-full min-h-0 flex-col bg-sv-cloud">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-sv-ink/8 bg-white px-4">
        <p className="hidden text-[13px] font-extrabold tracking-tight text-sv-ink sm:block">Studio</p>
        <select
          aria-label="Page"
          value={page.id}
          onChange={(e) => {
            const url = new URL(window.location.href)
            url.searchParams.set("page", e.target.value)
            window.location.href = url.toString()
          }}
          className="h-9 rounded-full border border-sv-ink/10 bg-sv-cloud px-3 text-[13px] font-bold text-sv-ink outline-none focus:border-sv-blue"
        >
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Language"
          value={lang}
          onChange={(e) => {
            const url = new URL(window.location.href)
            url.searchParams.set("lang", e.target.value)
            window.location.href = url.toString()
          }}
          className="h-9 max-w-[140px] rounded-full border border-sv-ink/10 bg-sv-cloud px-3 text-[13px] font-bold text-sv-ink outline-none focus:border-sv-blue"
        >
          {LANGS.map((l) => (
            <option key={l} value={l}>
              {LANG_LABEL[l]}
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-1 rounded-full border border-sv-ink/10 bg-sv-cloud p-0.5">
          {DEVICES.map((d) => {
            const Icon = d.icon
            const on = device === d.id
            return (
              <button
                key={d.id}
                type="button"
                aria-label={d.label}
                aria-pressed={on}
                onClick={() => setDevice(d.id)}
                className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
                  on ? "bg-sv-navy text-white" : "text-sv-ink/45 hover:text-sv-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            )
          })}
        </div>
        <p className="hidden text-[12px] font-semibold text-sv-ink/40 lg:block" aria-live="polite">
          {pending ? "Saving…" : status}
        </p>
        <Link
          href="/admin/content/pages"
          className="text-[12.5px] font-bold text-sv-blue hover:underline"
        >
          All texts
        </Link>
      </header>
      <div className="shrink-0 bg-white px-4 [&>div]:mb-0">
        <ContentTabs active="/admin/content/studio" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <aside className="hidden w-[248px] shrink-0 overflow-y-auto border-r border-sv-ink/8 bg-white p-3 lg:block">
          {page.id === "home" ? (
            <>
              <p className="px-2 pb-1.5 text-[10.5px] font-extrabold tracking-[0.14em] text-sv-ink/35 uppercase">
                Chrome
              </p>
              {pinnedStart.map((s) => (
                <SectionBtn key={s.id} s={s} active={selected === s.id} onPick={setSelected} />
              ))}
              <p className="mt-4 px-2 pb-1.5 text-[10.5px] font-extrabold tracking-[0.14em] text-sv-ink/35 uppercase">
                Sections
              </p>
              <ul className="flex flex-col gap-0.5">
                {layout.map((item) => {
                  const s = sectionById(item.id)
                  if (!s) return null
                  const glued = item.id === HOME_VIP_FOLLOW
                  return (
                    <li
                      key={item.id}
                      draggable={!glued}
                      onDragStart={() => {
                        if (glued) return
                        dragId.current = item.id
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onDrop(item.id)}
                      className={`flex items-center gap-1 rounded-[12px] ${item.hidden ? "opacity-45" : ""} ${glued ? "pl-4" : ""}`}
                    >
                      <span className={`px-1 ${glued ? "text-sv-ink/15" : "cursor-grab text-sv-ink/25"}`} aria-hidden>
                        <GripVertical className="h-3.5 w-3.5" />
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelected(item.id)}
                        className={`min-w-0 flex-1 rounded-[12px] px-2 py-2 text-left text-[13px] font-bold ${
                          selected === item.id ? "bg-sv-blue/10 text-sv-blue" : "text-sv-ink/70 hover:bg-sv-ink/5"
                        }`}
                      >
                        {s.label}
                      </button>
                      <button
                        type="button"
                        aria-label={item.hidden ? `Show ${s.label}` : `Hide ${s.label}`}
                        onClick={() => toggleHidden(item.id)}
                        className="grid h-8 w-8 place-items-center rounded-[10px] text-sv-ink/35 hover:bg-sv-ink/5 hover:text-sv-ink"
                      >
                        {item.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-4 px-2 pb-1.5 text-[10.5px] font-extrabold tracking-[0.14em] text-sv-ink/35 uppercase">
                Site
              </p>
              {pinnedEnd.map((s) => (
                <SectionBtn key={s.id} s={s} active={selected === s.id} onPick={setSelected} />
              ))}
            </>
          ) : (
            <p className="px-2 py-3 text-[13px] font-bold text-sv-ink/55">
              {page.label} — click a field on the right, or type in the inspector.
            </p>
          )}
        </aside>

        <div className="flex min-w-0 flex-1 items-stretch justify-center bg-sv-navy/[0.03] p-3 md:p-5">
          <div
            className="h-full overflow-hidden rounded-[var(--radius-card)] border border-sv-ink/8 bg-white shadow-[var(--shadow-card)] transition-[width] duration-300"
            style={{ width: deviceW ? Math.min(deviceW, 1280) : "100%", maxWidth: "100%" }}
          >
            <iframe
              ref={iframeRef}
              title="Site preview"
              src={src}
              className="h-full w-full bg-sv-cloud"
            />
          </div>
        </div>

        <aside className="max-h-[40vh] w-full shrink-0 overflow-y-auto border-t border-sv-ink/8 bg-white p-4 xl:max-h-none xl:w-[340px] xl:border-t-0 xl:border-l">
          <h2 className="text-[15px] font-extrabold tracking-tight text-sv-ink">
            {selectedSection?.label ?? "Content"}
          </h2>
          <p className="mt-1 mb-4 text-[12.5px] text-sv-ink/45">
            Blank reverts to the default. Publish is instant.
          </p>
          {inspectorRows.length === 0 ? (
            <p className="text-[13px] text-sv-ink/45">
              {selected === "ad_mid" || selected === "ad_after_projects"
                ? "Banner slot — hide or reorder here. Creatives live in Banners."
                : "No editable texts on this block."}
            </p>
          ) : (
            <ul className="space-y-3">
              {inspectorRows.map((row) => (
                <li key={`${row.key}:${row.value}`}>
                  <Field
                    row={row}
                    pending={pending}
                    focused={focusKey === row.key}
                    onSave={saveRow}
                  />
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}

function SectionBtn({
  s,
  active,
  onPick,
}: {
  s: StudioSection
  active: boolean
  onPick: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(s.id)}
      className={`mb-0.5 w-full rounded-[12px] px-3 py-2 text-left text-[13px] font-bold ${
        active ? "bg-sv-blue/10 text-sv-blue" : "text-sv-ink/70 hover:bg-sv-ink/5"
      }`}
    >
      {s.label}
    </button>
  )
}

function Field({
  row,
  pending,
  focused,
  onSave,
}: {
  row: CmsRow
  pending: boolean
  focused: boolean
  onSave: (key: string, value: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (focused) ref.current?.focus()
  }, [focused])
  return (
    <label className={`block rounded-[var(--radius-tile)] border p-3 ${focused ? "border-sv-blue" : "border-sv-ink/8"}`}>
      <span className="mb-1.5 block font-mono text-[11px] font-bold text-sv-ink/40">{row.key}</span>
      <textarea
        ref={ref}
        defaultValue={row.value}
        placeholder={row.defaultText}
        rows={row.defaultText.length > 80 ? 3 : 2}
        maxLength={2000}
        disabled={pending}
        onBlur={(e) => {
          if (e.target.value.trim() !== row.value) onSave(row.key, e.target.value)
        }}
        className={textareaCls}
      />
    </label>
  )
}
