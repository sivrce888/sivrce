"use client"

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { KeyRound, LifeBuoy, Send } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { funnelStrings } from "@/components/lead/i18n"
import { faqLoc, faqMatch, faqSearch, faqSuggestions, type FaqQA } from "@/lib/faq"
import { useAutoGrow } from "./useAutoGrow"

/**
 * In-chat FAQ assistant — instant, offline answers from the /faq dataset.
 * Client-only transcript (module cache keeps it alive across open/close);
 * never persisted server-side. A dataset miss gets one AI attempt grounded on
 * the same dataset (POST /api/ai/search {question,lang}) before it hands off
 * to the support line via onContactSupport.
 */

interface FaqEntry {
  role: "user" | "bot"
  text: string
  /** Answer came from the AI fallback, not a literal dataset match. */
  ai?: boolean
}

// ponytail: session-only transcript keyed by locale — add persistence when
// users expect their help history back.
const transcripts = new Map<string, FaqEntry[]>()

export default function FaqView({
  onContactSupport,
  onIntent,
}: {
  onContactSupport: () => void
  /** Demand funnel hand-off ("I want to buy / sell") — omitted → no CTA. */
  onIntent?: () => void
}) {
  const { t, lang } = useI18n()
  const loc = faqLoc(lang)
  const funnel = funnelStrings(lang)

  const [log, setLog] = useState<FaqEntry[]>(() => {
    const cached = transcripts.get(loc)
    if (cached) return cached
    return [{ role: "bot", text: t("chat.faqGreeting") }]
  })
  const [input, setInput] = useState("")
  const [missCta, setMissCta] = useState(false)
  /** Ranked near-matches for the last unanswered question. */
  const [nearby, setNearby] = useState<FaqQA[]>([])

  const bottomRef = useRef<HTMLDivElement>(null)
  const boxRef = useAutoGrow(input, 112) // 112px = max-h-28
  /** Entries from the cached transcript (or greeting) don't replay the entrance. */
  const [animatedFrom] = useState(() => log.length)
  /** Only the newest miss may write into the transcript — an older request
   *  that resolves late is dropped instead of interleaving stale answers. */
  const askSeq = useRef(0)
  const [thinking, setThinking] = useState(false)

  useEffect(() => {
    transcripts.set(loc, log)
  }, [loc, log])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [log, missCta, nearby, thinking])

  const answer = (question: string) => {
    const hit = faqMatch(question, loc)
    setLog((prev) => [
      ...prev,
      { role: "user", text: question },
      ...(hit ? [{ role: "bot" as const, text: hit.a }] : []),
    ])
    if (hit) {
      setNearby([])
      setMissCta(false)
      return
    }
    void askAi(question)
  }

  const askAi = async (question: string) => {
    const seq = ++askSeq.current
    setThinking(true)
    setNearby([])
    setMissCta(false)
    let aiReply: string | null = null
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, lang }),
        signal: AbortSignal.timeout(20_000),
      })
      if (res.ok) aiReply = ((await res.json()) as { answer?: string | null }).answer ?? null
    } catch {
      // AI unavailable → support handoff below, same as before AI existed.
    }
    if (seq !== askSeq.current) return
    setThinking(false)
    if (aiReply) {
      setLog((prev) => [...prev, { role: "bot", text: aiReply, ai: true }])
      return
    }
    // A miss offers the closest entries before it offers a human — one tap
    // beats waiting for support on a question the dataset already answers.
    setLog((prev) => [...prev, { role: "bot", text: t("chat.faqMiss") }])
    setNearby(faqSearch(question, loc))
    setMissCta(true)
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
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-2"
      >
        {onIntent && (
          <button
            type="button"
            onClick={onIntent}
            className="mt-2 flex w-full items-center gap-2.5 rounded-control bg-sv-blue/[0.08] px-3 py-2.5 text-start transition-colors hover:bg-sv-blue/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sv-blue/15 text-sv-blue-deep">
              <KeyRound className="h-4 w-4" aria-hidden />
            </span>
            <span className="truncate text-[13px] font-extrabold text-sv-blue-deep">
              {funnel.tile}
            </span>
          </button>
        )}
        {log.map((entry, i) => (
          <div
            key={i}
            className={`mt-3 flex ${entry.role === "user" ? "justify-end" : "justify-start"} ${
              i >= animatedFrom ? "sv-chat-msg-in" : ""
            }`}
          >
            <div
              className={`max-w-[82%] rounded-module px-3.5 py-2 text-[14px] font-medium leading-relaxed ${
                entry.role === "user" ? "bg-sv-blue text-white" : "bg-sv-ink/[0.06] text-sv-ink"
              }`}
            >
              {entry.ai && (
                <span
                  aria-hidden
                  className="me-1.5 inline-block rounded-full bg-sv-blue/10 px-1.5 py-px align-middle text-[10px] font-extrabold tracking-wide text-sv-blue-deep"
                >
                  AI
                </span>
              )}
              <p className="whitespace-pre-wrap break-words" dir="auto">
                {entry.text}
              </p>
            </div>
          </div>
        ))}
        {thinking && (
          <div className="mt-3 flex justify-start">
            <div
              aria-hidden
              className="animate-pulse rounded-module bg-sv-ink/[0.06] px-3.5 py-2 text-[14px] font-bold leading-relaxed text-sv-ink/40"
            >
              …
            </div>
          </div>
        )}
        {nearby.length > 0 && (
          <div className="mt-3">
            <p className="px-0.5 pb-1.5 text-[11.5px] font-bold text-sv-ink/60">
              {t("chat.faqDidYouMean")}
            </p>
            <div className="flex flex-col items-start gap-1.5">
              {nearby.map((qa) => (
                <button
                  key={qa.q}
                  type="button"
                  onClick={() => answer(qa.q)}
                  className="min-h-11 max-w-full rounded-control border border-sv-blue/20 bg-sv-blue/[0.06] px-3 py-2 text-start text-[13px] font-bold text-sv-blue-deep transition-colors hover:bg-sv-blue/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
                >
                  {qa.q}
                </button>
              ))}
            </div>
          </div>
        )}
        {missCta && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={onContactSupport}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-sv-blue px-4 py-2 text-[13px] font-bold text-white transition hover:bg-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
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
        className="flex gap-2 overflow-x-auto overscroll-contain px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
          ref={boxRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder={t("chat.faqPlaceholder")}
          maxLength={300}
          rows={1}
          enterKeyHint="send"
          aria-label={t("chat.faqPlaceholder")}
          className="max-h-28 min-w-0 flex-1 resize-none rounded-control border border-sv-ink/10 bg-sv-ink/[0.03] px-3.5 py-2.5 text-[14px] font-medium leading-snug text-sv-ink outline-none transition-colors [field-sizing:content] placeholder:text-sv-ink/35 focus:border-sv-blue/40 touch-manipulation"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label={t("chat.send")}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-sv-blue text-white transition hover:bg-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 disabled:opacity-40 touch-manipulation"
        >
          <Send className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        </button>
      </form>
    </div>
  )
}
