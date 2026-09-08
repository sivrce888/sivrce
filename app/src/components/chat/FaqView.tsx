"use client"

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { LifeBuoy, Send } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { faqLoc, faqMatch, faqSuggestions } from "@/lib/faq"

/**
 * In-chat FAQ assistant — instant, offline answers from the /faq dataset.
 * Client-only transcript (module cache keeps it alive across open/close);
 * never persisted server-side. Unanswered questions hand off to the
 * support line via onContactSupport.
 */

interface FaqEntry {
  role: "user" | "bot"
  text: string
}

// ponytail: session-only transcript keyed by locale — add persistence when
// users expect their help history back.
const transcripts = new Map<string, FaqEntry[]>()

export default function FaqView({ onContactSupport }: { onContactSupport: () => void }) {
  const { t, lang } = useI18n()
  const loc = faqLoc(lang)

  const [log, setLog] = useState<FaqEntry[]>(() => {
    const cached = transcripts.get(loc)
    if (cached) return cached
    return [{ role: "bot", text: t("chat.faqGreeting") }]
  })
  const [input, setInput] = useState("")
  const [missCta, setMissCta] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    transcripts.set(loc, log)
  }, [loc, log])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [log, missCta])

  const answer = (question: string) => {
    const hit = faqMatch(question, loc)
    setLog((prev) => [
      ...prev,
      { role: "user", text: question },
      hit ? { role: "bot", text: hit.a } : { role: "bot", text: t("chat.faqMiss") },
    ])
    if (!hit) setMissCta(true)
  }

  const onSend = (e: FormEvent) => {
    e.preventDefault()
    const question = input.trim()
    if (!question) return
    setInput("")
    answer(question)
  }

  const onInputKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      const question = input.trim()
      if (question) {
        setInput("")
        answer(question)
      }
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Transcript */}
      <div
        role="log"
        aria-live="polite"
        aria-label={t("chat.help")}
        className="flex-1 overflow-y-auto px-4 py-2"
      >
        {log.map((entry, i) => (
          <div key={i} className={`mt-3 flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-[14px] font-medium leading-relaxed ${
                entry.role === "user" ? "bg-sv-blue text-white" : "bg-sv-ink/[0.06] text-sv-ink"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{entry.text}</p>
            </div>
          </div>
        ))}
        {missCta && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={onContactSupport}
              className="inline-flex items-center gap-2 rounded-full bg-sv-blue px-4 py-2 text-[13px] font-bold text-white transition hover:bg-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
            >
              <LifeBuoy className="h-4 w-4" aria-hidden />
              {t("chat.contactSupport")}
            </button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      <div
        role="group"
        aria-label={t("chat.faqSuggestions")}
        className="flex gap-2 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {faqSuggestions(loc, 6).map((qa) => (
          <button
            key={qa.q}
            type="button"
            onClick={() => answer(qa.q)}
            className="shrink-0 rounded-full bg-sv-ink/[0.05] px-3 py-1.5 text-[12.5px] font-bold text-sv-ink/70 transition-colors hover:bg-sv-ink/[0.09] hover:text-sv-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
          >
            {qa.q}
          </button>
        ))}
      </div>

      {/* Composer */}
      <form
        onSubmit={onSend}
        className="flex items-end gap-2 border-t border-sv-ink/[0.08] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder={t("chat.faqPlaceholder")}
          maxLength={300}
          rows={1}
          aria-label={t("chat.faqPlaceholder")}
          className="max-h-28 min-w-0 flex-1 resize-none rounded-control border border-sv-ink/10 bg-sv-ink/[0.03] px-3.5 py-2.5 text-[14px] font-medium leading-snug text-sv-ink outline-none transition-colors [field-sizing:content] placeholder:text-sv-ink/35 focus:border-sv-blue/40"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label={t("chat.send")}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-sv-blue text-white transition hover:bg-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 disabled:opacity-40"
        >
          <Send className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        </button>
      </form>
    </div>
  )
}
