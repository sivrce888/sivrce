"use client"

import {
  BadgeCheck,
  Building2,
  CreditCard,
  Layers,
  LayoutDashboard,
  MapPinned,
  Search,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react"

import type { AdminSearchGroup } from "@/lib/admin/search"

const OPEN_EVENT = "sivrce:admin-palette"

type PaletteItem = {
  key: string
  title: string
  sub?: string
  href: string
  icon: ComponentType<{ className?: string }>
  hint?: string
}

/** Static "go to" commands — the palette's zero-query state. */
const COMMANDS: PaletteItem[] = [
  { key: "cmd-dash", title: "Dashboard", href: "/admin", icon: LayoutDashboard, hint: "G D" },
  { key: "cmd-listings", title: "Listings", href: "/admin/listings", icon: Building2, hint: "G L" },
  { key: "cmd-users", title: "Users", href: "/admin/users", icon: Users, hint: "G U" },
  { key: "cmd-moderation", title: "Moderation", href: "/admin/moderation", icon: ShieldCheck, hint: "G M" },
  { key: "cmd-payments", title: "Payments", href: "/admin/payments", icon: CreditCard, hint: "G F" },
  { key: "cmd-pros", title: "Professionals", href: "/admin/professionals", icon: BadgeCheck, hint: "G A" },
  { key: "cmd-map", title: "Map / OSM", href: "/admin/map", icon: Layers },
  { key: "cmd-system", title: "System", href: "/admin/system", icon: Settings2 },
]

const GROUP_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  listings: Building2,
  users: Users,
  projects: BadgeCheck,
  buildings: MapPinned,
}

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  return (
    t.isContentEditable ||
    t.tagName === "INPUT" ||
    t.tagName === "TEXTAREA" ||
    t.tagName === "SELECT"
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] border border-sv-ink/10 bg-sv-cloud px-1 font-sans text-[10.5px] font-bold text-sv-ink/45">
      {children}
    </kbd>
  )
}

export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT))
}

/** Header button that opens the palette (⌘K works everywhere regardless). */
export function CommandPaletteTrigger({ variant = "chip" }: { variant?: "chip" | "icon" }) {
  if (variant === "icon") {
    return (
      <button
        type="button"
        aria-label="Search (Command palette)"
        onClick={openCommandPalette}
        className="grid h-9 w-9 place-items-center rounded-full text-sv-ink/45 transition-colors hover:bg-sv-ink/5 hover:text-sv-ink"
      >
        <Search className="h-4 w-4" />
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      aria-label="Search everything (Command palette)"
      className="flex h-9 items-center gap-2 rounded-full border border-sv-ink/10 bg-white pr-2 pl-3.5 text-[12.5px] font-bold text-sv-ink/45 transition-colors hover:border-sv-blue/40 hover:text-sv-ink"
    >
      <Search className="h-3.5 w-3.5" />
      Search
      <Kbd>⌘K</Kbd>
    </button>
  )
}

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(false)
  const [query, setQuery] = useState("")
  const [groups, setGroups] = useState<AdminSearchGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const activeRef = useRef<HTMLLIElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const chordRef = useRef<{ key: string; at: number } | null>(null)

  // Flattened keyboard model: static commands when idle, grouped results when searching.
  const items = useMemo<PaletteItem[]>(() => {
    if (query.trim().length < 2) return COMMANDS
    return groups.flatMap((g) =>
      g.items.map((it) => ({
        key: `${g.id}:${it.id}`,
        title: it.title,
        sub: it.sub,
        href: it.href,
        icon: GROUP_ICONS[g.id] ?? Search,
      })),
    )
  }, [query, groups])

  const close = useCallback(() => {
    setOpen(false)
    setShown(false)
    setQuery("")
    setGroups([])
    setActive(0)
    abortRef.current?.abort()
  }, [])

  // ⌘K / Ctrl+K toggles anywhere; "g"-chords navigate with the palette closed.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
        return
      }
      if (open || e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      const pending = chordRef.current
      if (pending && Date.now() - pending.at < 1200 && !e.metaKey) {
        const dest = { d: "/admin", l: "/admin/listings", u: "/admin/users", m: "/admin/moderation", f: "/admin/payments", a: "/admin/professionals" }[
          e.key.toLowerCase() as "d" | "l" | "u" | "m" | "f" | "a"
        ]
        chordRef.current = null
        if (dest) {
          e.preventDefault()
          router.push(dest)
          return
        }
      }
      if (e.key.toLowerCase() === "g" && !isTypingTarget(e.target)) {
        chordRef.current = { key: "g", at: Date.now() }
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener("keydown", onKey)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener(OPEN_EVENT, onOpen)
    }
  }, [open, router])

  // Open/close side effects: entry transition, scroll lock, focus.
  useEffect(() => {
    if (!open) return
    const raf = requestAnimationFrame(() => setShown(true))
    document.body.style.overflow = "hidden"
    inputRef.current?.focus()
    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = ""
    }
  }, [open])

  // Debounced, abortable entity search. State changes ride the async callbacks —
  // never synchronously in the effect body.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      abortRef.current?.abort()
      return
    }
    const t = setTimeout(async () => {
      setLoading(true)
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        })
        const data = (await res.json()) as { ok: boolean; groups?: AdminSearchGroup[] }
        if (data.ok) setGroups(data.groups ?? [])
      } catch {
        // aborted or network hiccup — keep whatever is on screen
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }, 150)
    return () => clearTimeout(t)
  }, [query])

  // Keep the highlight valid if the result list shrinks.
  const activeIndex = Math.min(active, Math.max(0, items.length - 1))

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  const go = useCallback(
    (href: string) => {
      close()
      router.push(href)
    },
    [close, router],
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault()
      close()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((a) => (items.length ? (a + 1) % items.length : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => (items.length ? (a - 1 + items.length) % items.length : 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const item = items[activeIndex]
      if (item) go(item.href)
    }
  }

  if (!open) return null

  const empty = query.trim().length >= 2 && !loading && items.length === 0

  return (
    <div
      role="presentation"
      onClick={close}
      className={`fixed inset-0 z-[100] flex items-start justify-center bg-sv-navy/30 px-4 pt-[10vh] backdrop-blur-[2px] motion-safe:transition-opacity motion-safe:duration-150 ${
        shown ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className={`w-full max-w-[620px] overflow-hidden rounded-[16px] border border-sv-ink/8 bg-white shadow-[0_24px_70px_-12px_rgba(15,23,42,0.35)] motion-safe:transition-all motion-safe:duration-150 motion-safe:ease-out ${
          shown ? "translate-y-0 scale-100 opacity-100" : "-translate-y-1 scale-[0.98] opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-sv-ink/6 px-4">
          <Search className="h-4.5 w-4.5 shrink-0 text-sv-ink/35" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls="admin-palette-list"
            aria-activedescendant={items[activeIndex]?.key}
            aria-label="Search users, listings, projects, buildings"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            placeholder="Search users, listings, projects, buildings…"
            autoComplete="off"
            spellCheck={false}
            className="h-13 w-full bg-transparent py-4 text-[15px] font-semibold text-sv-ink outline-none placeholder:font-medium placeholder:text-sv-ink/35"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="shrink-0"
          >
            <Kbd>esc</Kbd>
          </button>
        </div>

        <ul
          ref={listRef}
          id="admin-palette-list"
          role="listbox"
          aria-label="Results"
          className="max-h-[46vh] overflow-y-auto p-2"
        >
          {query.trim().length < 2 ? (
            <li role="presentation" aria-hidden="true" className="px-2.5 pt-2 pb-1.5 text-[10.5px] font-extrabold tracking-[0.14em] text-sv-ink/35 uppercase">
              Go to
            </li>
          ) : null}
          {items.map((item, i) => {
            const isActive = i === activeIndex
            return (
              <li
                key={item.key}
                ref={isActive ? activeRef : undefined}
                id={item.key}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(item.href)}
                className={`flex cursor-pointer items-center gap-3 rounded-[10px] px-2.5 py-2.5 ${
                  isActive ? "bg-sv-ink/[0.045]" : ""
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-[9px] border transition-colors ${
                    isActive
                      ? "border-sv-blue/25 bg-sv-blue/10 text-sv-blue"
                      : "border-sv-ink/6 bg-sv-cloud text-sv-ink/40"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-bold text-sv-ink">
                    {item.title}
                  </span>
                  {item.sub ? (
                    <span className="block truncate text-[12px] font-medium text-sv-ink/45">
                      {item.sub}
                    </span>
                  ) : null}
                </span>
                {item.hint ? (
                  <span className="flex shrink-0 gap-1">
                    {item.hint.split(" ").map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                ) : isActive ? (
                  <Kbd>↵</Kbd>
                ) : null}
              </li>
            )
          })}
          {loading ? (
            <li role="presentation" className="px-2.5 py-3 text-[12.5px] font-semibold text-sv-ink/40">
              Searching…
            </li>
          ) : null}
          {empty ? (
            <li role="presentation" className="px-2.5 py-6 text-center">
              <span className="block text-[13.5px] font-bold text-sv-ink">
                No results for “{query.trim()}”
              </span>
              <span className="mt-0.5 block text-[12px] font-medium text-sv-ink/45">
                Try a listing number, title, email, phone, project or building name.
              </span>
            </li>
          ) : null}
        </ul>

        <div className="flex items-center gap-4 border-t border-sv-ink/6 bg-sv-cloud/60 px-4 py-2.5">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-sv-ink/40">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-sv-ink/40">
            <Kbd>↵</Kbd> Open
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-sv-ink/40">
            <Kbd>G</Kbd>then
            <Kbd>L</Kbd>
            jump
          </span>
        </div>
      </div>
    </div>
  )
}
