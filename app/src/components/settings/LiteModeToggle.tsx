"use client"

import { Gauge } from "lucide-react"
import { useEffect, useState } from "react"

const KEY = "sv-lite"

export function LiteModeToggle() {
  const [on, setOn] = useState(false)

  useEffect(() => {
    try {
      setOn(localStorage.getItem(KEY) === "1")
    } catch {
      setOn(document.documentElement.hasAttribute("data-lite"))
    }
  }, [])

  const toggle = () => {
    const next = !on
    try {
      if (next) localStorage.setItem(KEY, "1")
      else localStorage.removeItem(KEY)
    } catch {
      // ponytail: private mode — toggle attr only for this session
      document.documentElement.toggleAttribute("data-lite", next)
      setOn(next)
      return
    }
    location.reload()
  }

  return (
    <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-blue/10 text-sv-blue">
          <Gauge size={18} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-extrabold text-sv-ink">მსუბუქი რეჟიმი</h2>
          <p className="mt-1 text-[13px] font-medium text-sv-ink/55">
            ნაკლები RAM — გამორთავს ანიმაციებს და ამცირებს რუკის ბუფერს. 4 GB-ზე ნაკლებ მოწყობილობაზე ავტომატურად ჩართულია.
          </p>
          <button
            type="button"
            onClick={toggle}
            aria-pressed={on}
            className={`mt-4 rounded-full px-5 py-2.5 text-[13px] font-bold transition ${
              on
                ? "border border-sv-ink/12 text-sv-ink/70 hover:border-sv-blue hover:text-sv-blue"
                : "bg-sv-orange text-white shadow-glow-orange hover:opacity-95"
            }`}
          >
            {on ? "გამორთვა" : "ჩართვა"}
          </button>
        </div>
      </div>
    </section>
  )
}
