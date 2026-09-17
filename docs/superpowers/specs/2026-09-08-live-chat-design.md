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

---

# Live Chat v4 — trust, presence, cost (2026-09-17)

## State found (v3.1 in tree)

Working and kept: SSE + optimistic send + receipts + typing + pagination +
icebreakers + Inquiry lead + support line + FAQ assistant + push + i18n ×10.

Real gaps found by inspection, not invented:

1. **Report without recourse.** A harassed user could file a Complaint and then
   keep receiving messages from the same person. Report is a message to *us*;
   the user had no way to stop the sender.
2. **Nothing is retractable.** A mis-pasted phone number or a wrong price stayed
   on the counterparty's screen forever.
3. **No answer to "is this person around?"** — the single question a buyer has
   before waiting for a reply. `User.lastSeenAt` already existed, unused here.
4. **Pagination bug.** `getChatMessages` returned the *newest* row of the page as
   `nextCursor`; "Earlier messages" re-served the same page and advanced one
   message per click.
5. **Hidden tabs kept a serverless function open**, polling Postgres 3× every
   2 s for a conversation nobody was looking at.
6. **New admins were blind** to support rooms opened before they joined —
   support seats are created once, at room creation.
7. **Composer never grew** on Chrome 111–122 / Safari 16.4–17.3 (the declared
   browserslist floor): `field-sizing: content` is the only growth mechanism.
8. Popover menus closed on Escape only — a desktop assumption on a phone.
9. Returning to a busy thread dropped you at the bottom with no marker for
   where you had stopped reading.

## Option analysis (score 0–100, highest-EV wins)

| # | Option | Score | Verdict |
| --- | --- | --- | --- |
| **A** | **Block / unblock a peer** | **96** ✅ | Closes gap 1. Stored one-way, enforced both ways at the write. Room stays visible (otherwise unblocking is impossible). Support line is not blockable — it is the escalation path. |
| **B** | **Unsend own message (24 h window)** | **94** ✅ | Closes gap 2. Tombstone stays, so history cannot be silently rewritten; row stays, so a Complaint already filed still has its evidence. |
| **C** | **Presence from `lastSeenAt`** | **93** ✅ | Zero schema, zero new query (one extra column on a `findMany` the list already runs). Stale heartbeat renders *nothing* rather than a guess. |
| **D** | **Fix the pagination cursor** | **99** ✅ | Correctness. One line. |
| **E** | **Close SSE on hidden tab (20 s grace) + one batched tick + idle backoff** | **95** ✅ | 3 round-trips → 1; 2 s → 6 s when quiet; 0 while backgrounded. Largest Vercel-spend cut available without new infrastructure. No UX loss: return re-opens and heals the gap. |
| **F** | **Support-seat backfill for new admins** | **90** ✅ | An unanswered support line is worse than none. 10-min per-instance throttle keeps it near-free. |
| **G** | **`useAutoGrow` fallback** | **88** ✅ | Honours the repo's own browserslist floor instead of assuming evergreen Chrome. Costs nothing where `field-sizing` works. |
| **H** | **Tap-outside menu dismissal** | **86** ✅ | 12 lines, shared scrim, both menus. |
| **I** | **"New messages" divider + sticky day chips + per-room drafts + char counter** | **84** ✅ | The four cheapest points of Apple-grade thread polish. Drafts are debounced 400 ms — `sessionStorage` is synchronous and per-keystroke writes are measurable on low-end Android. |
| **J** | **Desktop expand toggle (380×560 ⇄ 560×min(760,88vh))** | **82** ✅ | 90 % of the value of a dedicated `/messages` route for ~15 lines, persisted per browser. |
| **K** | **Blocks surfaced on `/admin/chats`** | **80** ✅ | A rising block count is the earliest abuse signal; the reports queue only ever sees users who bothered to file. |
| L | Dedicated `/messages` page | 58 | Duplicates the panel UI, adds a route + bundle for zero SEO value; mobile is already full-screen and `?chat=` deep-links anywhere. Superseded by **J**. |
| M | Image / file attachments | 52 | No blob storage in `package.json` — needs a new dependency **and** a storage bill, against two standing locks. Third rejection (v2, v3, v4); revisit only when owners ask and storage exists for another reason. |
| N | Redis pub/sub instead of polling | 50 | New infrastructure + monthly cost to replace a transport that already feels instant. **E** takes most of the cost win for zero new services. Revisit at sustained concurrent-room volume. |
| O | Reactions / emoji | 40 | Social-app feature. Nobody negotiates a lease with a 👍. |
| P | Message edit | 38 | Editing a price after the other side read it is a fraud surface. Unsend + resend is the honest primitive. |
| Q | In-thread message search | 35 | 50-message pages and day separators cover recall at real thread lengths. |
| R | Notification sound | 25 | Unrequested audio on a property site. Push + badge + title flash already cover it. |

**Shipped: A–K.** Rejected with reasons recorded: L–R.

## Product contract — who, what, when, where

| Surface | Who sees it | When it appears | What the user does |
| --- | --- | --- | --- |
| Launcher FAB (`bottom-24 end-4`, `lg:bottom-6 end-6`) | Everyone, every page | Always; flips to the **left** corner on `/map` below `lg` so it clears the map control rail; hidden while the panel is open | Tap → guests land on Help, signed-in users land on their room list |
| Unread badge on the FAB | Signed-in | `totalUnread > 0`; `(n)` also flashes in the tab title while the tab is hidden | Tap to go straight to the list |
| Help (FAQ assistant) | Everyone | Default view for guests; "Help" tile for signed-in users | Ask in free text or tap a suggested question; a miss offers **Message us** |
| Support line | Signed-in | "Message us" tile, or the Help miss CTA. Guests are routed to sign-in with a callback | Writes to every admin at once; any admin can answer from their own chat |
| Listing **Message** CTA | Everyone, on a listing | Guest → scrolls to the phone lead form. Signed-in → opens the listing room. No owner / deleted listing → closes and recovers onto `#lead-form` | Sends; the first message also files one Inquiry per buyer×listing per 7 days |
| Icebreaker chips | Signed-in | Empty listing thread, no draft, not blocked | One tap sends a complete, polite opener |
| Lead-form handoff | Guests who just submitted | "Continue in chat" after sign-in (`?message=<listingId>`) | Their own words are waiting in the composer — never auto-sent |
| Profile **Message** button | Signed-in, on `/u/[id]` and company pages | Never on your own profile | Opens (or creates) a direct room |
| Presence line | Signed-in, in a room | Counterparty heartbeat < 7 days old; never on support, never on a blocked thread | Reads "Active now" (+ blue dot) or "Active 20m ago". Older than 7 days shows nothing |
| "New messages" divider | Signed-in, in a room | Reopening a room with unread peer messages | Scroll up from the divider to catch up |
| ⋯ on a message | Signed-in | Hover/focus on desktop, tap on touch | **Copy** always · **Report** on peer messages (files a Complaint into the existing moderation queue) · **Unsend** on own messages < 24 h old, two taps |
| ⋯ on a room | Signed-in, in a room | Room header | **View listing** · **Block** (two taps; hidden on support) · **Leave** (two taps) |
| Blocked banner | Both sides | Either side has blocked the other | Blocker sees "You blocked this person" + **Unblock** (one tap). The blocked side is told only that the conversation is closed — never who closed it |
| Expand ⇱ | Desktop only (`md:`) | Panel header | Toggles 380×560 ⇄ 560×min(760,88vh); the choice persists |
| Push notification | Signed-in with a subscription | New message while away | Opens `/?chat=<roomId>` straight into the thread |

## Rules the implementation must keep

- **Authorization is server-side, always.** Participant seats are created at room
  creation and never granted by a request. Block, unsend and send are re-checked
  at the write — the client's copy only decides what to *render*.
- **The blocked side learns nothing.** No "you were blocked" string exists.
- **Unsent bodies never cross the wire again** (`redact()` is the single gate),
  but the row survives for moderation.
- **Presence degrades to silence.** `lastSeenAt` is a 5-minute throttled
  heartbeat, so "Active now" tolerates one missed beat and anything older than
  7 days renders nothing rather than a guess.
- **Receipts stay honest**: `markRead` fires only when the tab is visible *and*
  the reader is near the bottom.

## Cost model (per open room)

| | v3.1 | v4 |
| --- | --- | --- |
| DB round-trips / active tick | 3 | 1 |
| Tick interval, quiet room | 2 s | 2 → 6 s |
| Backgrounded tab | full rate, indefinitely | stream closed after 20 s |

## Validation

`tsc --noEmit` clean · `eslint` clean · `messages.check.ts`,
`chat-policy.check.ts` (new, wired into `prebuild`), `chat-lead.check.ts`,
`i18n.check.ts` + both i18n audits, `governance`, `device-budget`,
`bundle-leak`, `repo-weight` all green · migration SQL verified byte-for-byte
against `prisma migrate diff --from-empty` output · panel exercised in-browser
at 1024×768 and 375×812 (expand, persistence, `aria-modal`, scroll lock,
textarea growth).

**Not run locally:** `prisma migrate deploy` (the live database is the owner's;
CI applies migrations to a throwaway PostGIS container) and `next build` (the
owner's dev server holds `.next`).

**Rollback**: revert this slice, then `ALTER TABLE chat_messages DROP COLUMN
deleted_at; DROP TABLE chat_blocks;` — no other table is touched.
