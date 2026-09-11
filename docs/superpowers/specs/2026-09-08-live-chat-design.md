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
- Image/file messages (`kind` already in schema): skip — RAM/storage vs conversion. Add when owners ask.
- Presence/online: skip — typing + push cover it.

**Rollback**: revert this v3 diff (no schema change). v2 typing table stays.

---

# Live Chat v3 — leads + love (2026-09-11)

## Option analysis (asked: score every option, pick best)

| Option | Score | Verdict |
| --- | --- | --- |
| **A. Guest live chat (no auth)** | **40** | Spam + no identity + extra SSE on anonymous visitors. Phone lead dies. |
| **B. WhatsApp / tel: as primary Message** | **30** | Conversation leaves sivrce. Zero lead in /leads. Fraud surface. |
| **C. Guest LeadForm only, authed chat with no Inquiry** | **62** | Owners miss chat-origin buyers in the inbox they already work. |
| **D. In-house chat + first listing message → Inquiry + icebreakers + guest continue-in-chat** | **96** ✅ | Dual funnel: guest phone (LeadForm) AND authed chat. Same Inquiry model owners already use. Zero new deps, zero RAM, brand-locked chips, `?message=` deep link after sign-in. |
| **E. Image/file upload in chat** | **55** | Schema has `kind`; blob + lambda RAM fights perf-cost lock. Not required to reach an owner. |
| **F. SaaS widget (revisit)** | **45** | Same v2 reject — bundle, ₾, brand, data residency. |

**Winner: D.** Guest Message still scrolls to LeadForm (phone is gold). Authed Message opens the listing room only when `ownerId` exists (no self-chat, no mute room). First buyer message writes one Inquiry / 7 days (email+listing dedupe). Empty listing thread shows 3 Apple-style chips. LeadForm success offers Continue in chat (sign-in callback `?message=<listingId>`).

**Not built (YAGNI):** guest SSE, WhatsApp hop, Redis, file messages, presence.

---

# Live Chat v3.1 — 100/100 close (2026-09-11)

## Remaining-gap scores (v3 D already in tree)

| Option | Score | Verdict |
| --- | --- | --- |
| **G. iOS visualViewport sheet** | **94** ✅ | Composer under keyboard = users bounce. Sheet pins to `visualViewport` (old Android no-ops). |
| **H. Hide FAB while panel open** | **93** ✅ | FAB-as-X sat on Send. Header already closes. Focus still returns to launcher. |
| **I. no_owner / 404 → LeadForm** | **92** ✅ | Silent empty inbox = "chat broken". Close + scroll `#lead-form`. Phone still captured. |
| **J. LeadForm draft → composer** | **90** ✅ | Same words they already typed. sessionStorage, listing-scoped, 2 kB. Icebreakers hide when seed present. |
| **K. Session-loading Message race** | **88** ✅ | `status==='loading'` was treated as guest → authed buyer dumped on LeadForm. Queue the tap. |
| **L. Icebreaker contrast /45→/60** | **86** ✅ | AA lock (v1.19). |
| **M. enterKeyHint=send + touch-manipulation** | **82** ✅ | Native iOS Send, kill 300 ms tap delay. |
| **N. Auto-send lead text as first chat msg** | **70** | Surprising. Draft + explicit Send is Apple. |
| **O. Phone-prompt in chat** | **68** | LeadForm already owns phone. Extra friction. |
| **P. interactive-widget on whole site** | **55** | Keyboard would reflow map/listing. Sheet-local viewport is enough. |
| **Q. File / presence / Redis / guest SSE** | **≤55** | Same v3 reject. |

**Shipped:** G–M. Rollback: revert this chat slice (still no schema).
