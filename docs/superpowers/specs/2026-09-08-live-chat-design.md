# Live Chat v2 — 100/100 (2026-09-08)

## Option analysis (asked: score every option, pick best)

| Option | Score | Verdict |
| --- | --- | --- |
| **A. SaaS widget** (Tawk.to / Crisp / Intercom / LiveChat) | **45** | +80–250 KB third-party script → breaks perf-cost lock (minimal bundle, CWV); $0–140/mo/agent → breaks Vercel-spend lock; user data leaves the country; generic bubble fights the frozen brand lock; zero auth/listing integration; agent replies in a foreign dashboard. |
| **B. Self-hosted** (Chatwoot / Rocket.Chat) | **50** | Separate server +1–2 GB RAM 24/7 → directly violates minimal-RAM owner mandate; Vercel can't host it; still generic UI, separate inbox to babysit. |
| **C. Finish in-house** (existing stack) | **95** ✅ | Backend already shipped: Prisma `ChatRoom/ChatParticipant/ChatMessage` (correct indexes), authed REST + SSE stream, `lib/chat.ts`. Zero new deps, zero ₾, data in own Postgres, brand-locked Apple-grade UI, native listing context. Ladder rung 2: already in this codebase — reuse it. |

**Winner: C.** Realtime transport stays SSE + 2 s indexed poll (serverless-friendly, feels instant for real-estate chat); ceiling noted for Redis pub/sub when volume warrants.

## Why v2 (state found)

Chat was fully dormant: `ChatProvider` never mounted, `ChatShell` parked the widget, and the client had critical defects — `isOwn={msg.senderId === "me"}` never true (own bubbles rendered on the wrong side), unread computed via N+1 fetch storms with wrong math, badge dead while panel closed, no optimistic send, no pagination, no a11y, ka-only strings, framer-motion for a bubble.

## Design

**Server**
- `getUserChats` v2: room + `counterpart` user (name/image/avatar tokens) + `lastMessage`; unread via **one** raw SQL (replace N+1 `allUnreadCounts`, deleted).
- `sendMessage`: 2000-char cap + flood guard (8 msgs/10 s → 429) — trust-boundary validation.
- SSE stream v2: emits `message` (only new rows, `(createdAt,id)` cursor), `read` (peer `lastReadAt`), `typing`; drops the per-poll unread query.
- New `POST /api/chat/[roomId]/typing` (participant-gated upsert, `chat_typing` table, 5 s TTL).

**Client**
- `ChatProvider`: session-gated (renders nothing for guests — LeadForm still owns anonymous conversion), one rooms+unread poll /15 s visible-tab-only → live badge everywhere, `(n)` title flash when tab hidden.
- `ChatWidget`: CSS-only motion (Apple sheet curve), full-screen mobile sheet / desktop 380×560 card, `role="dialog"`, Escape close, focus return, `aria-live` log, safe-area + `100dvh`, RTL-safe logical utilities, i18n ×10.
- `MessageThread`: optimistic send reconciled via `metadata.clientId`, failed→retry, cursor pagination with scroll-anchor, markRead on open/arrival/focus (debounced), typing indicator, ✓/✓✓ receipts from `read` events, day separators, 5-min sender grouping, near-bottom-only autoscroll, auto-grow input (`field-sizing`), Enter/Shift+Enter.
- Listing "Message" CTA: authed → `openChat(listingId)`; guest → existing LeadForm scroll.

**Ceilings (ponytail, name-the-upgrade-path)**
- SSE DB-poll → Redis pub/sub when message volume warrants.
- Image/file messages (`kind` already in schema), chat→web-push wiring, URL linkify: add when requested.

**Rollback**: single isolated commit; schema addition is additive (new table only), migration `20260908100000_chat_typing`.
