# MusiChat — Product Requirements Document

**Stage 1 deliverable · Version 1.0 · 15 September 2026**
**Status: awaiting sign-off before Stage 2 (UX / Information Architecture)**

---

## 1. Product summary

MusiChat is a private, two-person space where you chat and listen to the same song at the same moment.

It is not a messenger with a music player bolted on, and it is not a music app with a comment box. The unit of the product is the **shared session**: a live, synchronized listening state that belongs to a friendship, persists across the app, and is visible everywhere you go.

**The emotional promise:** *"Even when we're apart, we can chat and vibe to the same song together."*

**Positioning in one line:** the app for people who want to feel in the same room as one specific person.

### 1.1 Why this can exist next to Spotify Jam and Apple SharePlay

Both already do synchronized listening, so the differentiation has to be real and deliberate:

| | Spotify Jam | Apple SharePlay | MusiChat |
|---|---|---|---|
| Requires paid subscription | Yes, both users | Yes, both users | No |
| Works across platforms | Spotify only | Apple only | Any browser |
| Chat built in | No | Via FaceTime/Messages | Yes — it's the centre |
| Designed for | Parties, groups | Calls | One person you care about |
| Joining friction | Install + login + Premium | Install + Apple ID | Tap a link |

We do not win on catalog. We win on **intimacy, zero friction, and chat-first design.** Every scope decision in this document defends those three things.

---

## 2. Target users

**Primary — long-distance couples.** Partners separated by distance, work, or time zones. High emotional motivation, daily usage pattern, one specific person they want to be with. They are the reason this product works.

**Secondary — close friends and siblings.** Two people with a shared music taste and a habit of sending each other songs. Lower emotional intensity, more sporadic usage.

**Explicitly not our user for v1:** parties, group listening, music discovery communities, artists promoting work, anyone wanting a social feed.

---

## 3. Confirmed product decisions

These four were decided with the product owner on 15 Sep 2026 and are treated as settled for this document.

| # | Decision | Chosen | Consequence |
|---|---|---|---|
| D1 | Platform | **PWA first, native via Capacitor later** | Invite-by-link growth loop preserved; iOS background audio and push are degraded until the Capacitor wrapper ships |
| D2 | Music source | **Free / Creative Commons catalog (Audius + Jamendo)** | Legally clean, zero licensing cost, tight sync control; no mainstream commercial tracks |
| D3 | Playback control | **Both participants control equally** | Feels equal and intimate; requires conflict resolution and attribution in the sync design |
| D4 | Resourcing | **Solo beginner, minimal budget** | Managed services over custom infrastructure; small MVP; free tiers throughout |

---

## 4. Working assumptions

Seven requirements were not specified in the original brief. Rather than block, this document proceeds on the defaults below. **Each is cheap to reverse now and expensive to reverse after Stage 4 — please confirm or correct them at sign-off.**

| # | Question | Assumed answer | Reasoning |
|---|---|---|---|
| A1 | What happens when your partner is offline? | You can start listening alone. The session stays live and your partner joins at your current position — *"Priya joined at 1:42."* | Blocking playback on partner presence makes the app unusable most of the day and kills the habit before it forms |
| A2 | Can you vibe with two people at once? | No — exactly one active session per user. Starting a new one ends the old one with a visible notice to the other person. | Simpler architecture, and exclusivity is emotionally correct for this product |
| A3 | How rich is chat in MVP? | Text, emoji, typing indicators, read receipts, and song cards. **No** images or voice notes. | Images add storage cost and a content-moderation obligation on a zero budget. Typing and read receipts are nearly free on an existing realtime channel and add a lot of presence. |
| A4 | End-to-end encryption? | No. TLS in transit, encryption at rest, honestly disclosed in the privacy screen. | Real E2E is incompatible with server-side history sync and multi-device, and is a serious cryptographic undertaking. Promising it falsely is worse than not offering it. |
| A5 | Which region? | India first (data resident in an Indian region), compliant with the DPDP Act 2023, architected so GDPR is addable without rework. | Matches the product owner's location; avoids scoping global compliance into an MVP |
| A6 | Monetization? | Free, no ads, for the entire MVP. Revenue thinking deferred to post-validation. | Ads would destroy the intimacy of the core experience. Nothing to monetize until retention is proven. |
| A7 | Minimum age? | 13+, self-declared at signup. No open discovery, no location features, no public profiles. | The absence of stranger-discovery keeps child-safety exposure low; a hard age gate would be required if that ever changes |

---

## 5. Success metrics

The MVP exists to answer one question: **do two people, having listened together once, come back and do it again?** Everything else is secondary.

### Primary

| Metric | Target | Why it matters |
|---|---|---|
| Invite → join conversion | ≥ 40% | If invitees don't arrive, nothing else can be measured. This is the number that justifies D1. |
| Friendships with ≥1 session in week 1 | ≥ 30% | Proves music is the reason they're here, not a feature they ignore |
| D7 retention (paired users) | ≥ 25% | Proves habit, not novelty |

### Secondary

| Metric | Target |
|---|---|
| Median songs per session | ≥ 2 |
| Median session duration | ≥ 8 minutes |
| Sessions where both users sent ≥1 message during playback | ≥ 60% |
| p95 playback drift between participants | ≤ 400 ms |
| Sessions ending in an error or desync complaint | ≤ 2% |

### Counter-metrics (watch for harm)

- Sessions abandoned within 60 seconds of starting — signals sync failure or catalog disappointment
- Users who complete profile setup but never add a friend — signals a broken invite loop
- Reports or blocks per 1,000 users — should be near zero given no stranger discovery

---

## 6. Scope

### 6.1 MVP (v1.0) — the only thing being built first

Six screens, one persistent component, one sync engine.

**Screens**
1. **Auth** — signup, login, forgot password
2. **Profile setup** — photo, username, display name, bio, genres (all skippable except username)
3. **Home** — chat list with presence and vibe indicators
4. **Chat** — messages, composer, session controls
5. **Shared player** — full-screen synchronized playback
6. **Add friend** — username search, invite link, QR, incoming requests

**Persistent**
- **Floating mini player** — visible across every screen while a session is live

**Engine**
- Realtime messaging
- Presence (online / offline / vibing)
- Music session state with clock synchronization, drift correction, and reconnection recovery

**Safety baseline (non-negotiable, ships in MVP)**
- Block a user
- Report a user or message
- Remove a friend
- Delete your account and data

### 6.2 v1.1 — first follow-up, after retention is proven

- Song reactions in chat (react to what's playing, inline)
- "Recently played together" — your shared listening history with that person
- Vibe status — a mood line on your profile
- Images in chat
- Pass-the-aux (temporary exclusive control handoff)
- Push notifications via the Capacitor native wrapper

### 6.3 v2 — after the product has a reason to grow

- Shared queue
- Collaborative playlists per friendship
- Group sessions (3+ people)
- Spotify / Apple Music as optional additional providers
- Voice notes
- Listening statistics and year-in-review moments

### 6.4 Explicitly out of scope — and why

| Cut | Reason |
|---|---|
| **Nearby / location discovery** | Forces a location permission during onboarding, which measurably damages signup completion; requires coarse geohashing to be safe; and delivers near-zero value for a product about one specific person you already know. The invite link is the acquisition channel. |
| **Contacts import / phone matching** | Privacy and compliance work disproportionate to the benefit. Hashed phone matching is its own project. |
| **Invite rewards** | Gamifying invites before the core loop is proven optimizes the wrong thing |
| **Public profiles / social feed** | Contradicts the intimacy positioning and creates a moderation surface we cannot staff |
| **Hosting or streaming commercial music** | Legally impossible without label and publisher licensing at six-figure scale. See §8. |
| **Video** | Different product |

---

## 7. Functional requirements

### 7.1 Authentication

- **FR-A1** Sign up with email and password, with a verification email required before the account becomes usable.
- **FR-A2** Sign in with Google as a one-tap alternative.
- **FR-A3** Forgot-password flow via emailed reset link, single-use, 1-hour expiry.
- **FR-A4** Sessions persist across browser restarts via refresh token; access tokens are short-lived.
- **FR-A5** Sign out, from this device or all devices.
- **FR-A6** Phone/SMS authentication is **excluded from MVP** — SMS has real per-message cost and fraud exposure that a zero-budget MVP shouldn't carry.

### 7.2 Profile

- **FR-P1** Username: 3–20 characters, lowercase alphanumeric plus underscore, globally unique, immutable after a 7-day grace period. This is the handle friends search for.
- **FR-P2** Display name: 1–40 characters, freely changeable.
- **FR-P3** Profile photo: optional, uploaded and cropped square, downsized client-side before upload to stay inside free storage tiers.
- **FR-P4** Bio: optional, max 150 characters.
- **FR-P5** Music genres: optional multi-select from a fixed list; used for future recommendations, not surfaced prominently in MVP.
- **FR-P6** Every optional field is skippable with a visible "Skip for now," and the skip must not feel like failure.

### 7.3 Friends

- **FR-F1** Search for a user by exact or prefix username match. No browsing, no directory, no suggestions from strangers.
- **FR-F2** Send a friend request with an optional short note.
- **FR-F3** Accept or decline incoming requests. Declining is silent — the sender is not told.
- **FR-F4** Generate a personal invite link that encodes the inviter. Opening it shows the inviter's profile and, after signup, auto-sends the friend request.
- **FR-F5** Copy the invite link, share it via the native share sheet (WhatsApp, Instagram, SMS, anything installed), or display it as a QR code.
- **FR-F6** Remove a friend. This deletes the friendship and ends any active session.
- **FR-F7** Block a user: removes the friendship, hides both users from each other's search, and silently drops any future request.
- **FR-F8** Report a user or a specific message, with a reason and optional detail, written to a queue for manual review.

### 7.4 Chat

- **FR-C1** Send and receive text messages in real time within a one-to-one conversation.
- **FR-C2** Full emoji support in the composer, including an emoji picker.
- **FR-C3** Typing indicator, shown while the other person is composing and cleared after 3 seconds of inactivity.
- **FR-C4** Delivery states: sending → sent → delivered → read.
- **FR-C5** Message history loads newest-first with infinite scroll upward.
- **FR-C6** Unread counts per conversation, cleared when the conversation is opened and visible.
- **FR-C7** Messages sent while offline queue locally and send on reconnect, with a visible pending state.
- **FR-C8** **Song cards** — when a session starts, changes track, or ends, an inline card appears in the conversation showing what happened. This is what makes the chat feel musical rather than generic.
- **FR-C9** Delete your own message for both people, replaced by a "message deleted" tombstone.

### 7.5 Shared music session

This is the heart of the product and the hardest part to build correctly.

- **FR-M1** Either friend can start a session from the chat screen. The other person receives an invitation they can accept or dismiss.
- **FR-M2** A session has: an ID, the current track, playback position, playing/paused state, an authoritative server timestamp, a participant list, and a status.
- **FR-M3** **Both participants have equal control** (D3). Either can play, pause, seek, skip forward or back, or change the track.
- **FR-M4** Control conflicts resolve last-write-wins against the server clock. The losing command is discarded silently rather than fighting.
- **FR-M5** Every control action is attributed: *"Priya skipped to Perfect."* Attribution is what keeps equal control from feeling like a glitch.
- **FR-M6** Both clients converge on the same playback position within the tolerance defined in §9.1.
- **FR-M7** Clients continuously measure their own drift from server-authoritative position and self-correct: small drift is nudged via playback rate, large drift via a hard seek.
- **FR-M8** A participant who disconnects and returns rejoins at the current live position, not where they left.
- **FR-M9** If a participant leaves entirely, the session continues for whoever remains and shows a clear "listening alone" state.
- **FR-M10** Search the catalog by track, artist, or title, from inside the session.
- **FR-M11** Connection quality is always visible — synced, catching up, or reconnecting. Never leave the user guessing whether the other person is really hearing this.
- **FR-M12** Starting a session ends any other active session for that user (A2), with notice to the affected friend.

### 7.6 Floating mini player

- **FR-MP1** While a session is live and the full player is closed, a compact player is pinned above all other content on every screen.
- **FR-MP2** It shows: partner name in the form *"Vibing with Priya,"* track title, artist, a progress bar, and play/pause.
- **FR-MP3** Tapping it opens the full shared player; dismissing the full player returns to whatever was underneath.
- **FR-MP4** Navigating between chats, to home, or to any other screen never interrupts playback.
- **FR-MP5** It can be collapsed to an edge-docked bubble, but not fully dismissed while a session is live — ending playback must be a deliberate act.

### 7.7 Home

- **FR-H1** Conversation list sorted by most recent activity.
- **FR-H2** Each row shows: profile photo, display name, last message preview, relative timestamp, unread badge, presence dot.
- **FR-H3** A friend currently in a session shows an animated **vibing indicator** — the single most important glanceable signal in the app, and the main driver of spontaneous sessions.
- **FR-H4** Entry points to profile, search, and add-friend.
- **FR-H5** Empty state for users with no friends yet routes directly into the invite flow.

---

## 8. Music source and licensing

**This section is the legal foundation of the product. It is not negotiable and should not be revisited casually.**

### 8.1 What is not possible

MusiChat cannot host, stream, cache, or serve commercial recordings — the Ed Sheeran example in the original brief included. Doing so requires two separate licences (the sound recording from the label, the composition from the publisher), negotiated per territory, typically with six-figure advances and per-stream minimum guarantees. There is no startup-tier version of this. Attempting it is straightforward copyright infringement with statutory damages, not a grey area.

### 8.2 What was evaluated

| Option | Verdict |
|---|---|
| **Free / CC catalog (Audius, Jamendo, FMA)** | **Selected.** Legal without negotiation, free, real independent artists, and — critically — we control the audio element directly, which makes sync tighter and simpler than any alternative. |
| Spotify Premium account linking | Rejected for MVP. Requires both users to pay; Web SDK is weak on iOS Safari; Spotify ships a directly competing feature while tightening third-party API access. Building the core loop on a competitor's revocable API is an unacceptable foundation. |
| YouTube embedded player | Rejected. Synchronized third-party social playback sits badly with the terms of service, ads interrupt sync mid-song, and background audio is unreliable. |
| User-uploaded audio | Rejected for MVP. DMCA safe harbour requires a registered agent, a takedown workflow, and a repeat-infringer policy. A "send me your MP3" flow between two people reads as distribution, not personal use. |

### 8.3 How the limitation is handled

The catalog gap is real and must be addressed in product design rather than hidden:

- Position the catalog as **discovery**, not compromise: *"find something new, together."* Nobody has heard these songs — that shared newness is genuinely a better first experience than both people playing a song they already know.
- Onboarding sets expectations honestly before the first session, so disappointment never lands mid-vibe.
- All music access goes through a single **provider interface**, so Spotify and Apple Music can be added in v2 as optional account-linked providers without touching the sync engine.

### 8.4 Attribution obligation

Creative Commons licences carry attribution requirements that vary by track. Artist name and licence must be displayed in the player, and attribution data must be stored with every track reference. This is a functional requirement, not a footnote.

---

## 9. Non-functional requirements

### 9.1 Synchronization tolerance

Perfect sample-accurate sync across two devices on the public internet is not achievable and is not the goal. Human perception of "together" is far more forgiving than engineers assume.

| Drift | Behaviour |
|---|---|
| ≤ 150 ms | Ideal. No correction. |
| 150–400 ms | Acceptable. Correct gradually by nudging playback rate ±2% — inaudible. |
| > 400 ms | Hard seek to the correct position. Audible, so used sparingly. |
| > 2 s or no server contact for 10 s | Show "reconnecting," stop claiming to be synced. |

Target: **p95 drift ≤ 400 ms.**

Method: an NTP-style clock-offset handshake on connect and periodically thereafter, so both clients can translate the server's authoritative timestamp into their own local clock.

### 9.2 Performance

- Time to interactive on a mid-range Android over 4G: ≤ 3 seconds
- Message send to partner's screen: ≤ 300 ms p95
- Control action to partner's audio responding: ≤ 500 ms p95
- Initial JavaScript bundle: ≤ 250 KB gzipped
- The app must remain usable on a 3G connection, degrading sync quality rather than breaking

### 9.3 Reliability

- Reconnection is automatic, with exponential backoff and jitter
- Missed messages replay on reconnect — no silent gaps in history
- Session state is server-authoritative; a client is never the source of truth
- Losing a network connection must never lose a typed message

### 9.4 Platform support

| Platform | MVP | Notes |
|---|---|---|
| Android Chrome | Full | Best PWA target — installable, background audio, web push all work |
| Desktop Chrome/Edge/Firefox | Full | Excellent for the shared-player experience |
| iOS Safari (installed to Home Screen) | Degraded | Background audio flaky; web push requires Home Screen install; WebSocket dies when backgrounded. Mitigated by reconnect-and-resync, resolved properly by the Capacitor wrapper in v1.1. |
| iOS Safari (browser tab) | Degraded | No push at all. Users are prompted to install. |

### 9.5 Accessibility

- All interactive targets ≥ 44×44 px
- Text contrast meets WCAG AA — a hard constraint on the dark, music-oriented palette proposed in Stage 3
- Full keyboard navigation on desktop
- Screen-reader labels on all controls, with playback state announced
- Respect `prefers-reduced-motion` — the app is animation-heavy by design, and that must be switchable off

---

## 10. Privacy, safety, and security

### 10.1 Principles

1. **No stranger discovery.** Users are found by exact username or invite link only. This single decision eliminates most of the safety surface that messaging apps struggle with.
2. **No location.** Not collected, not stored, not inferred. The nearby feature from the original brief is cut (§6.4), which makes this principle absolute and easy to honour.
3. **Conversations are private to two people.** No indexing, no analytics on message content, no training on user data.
4. **Honest disclosure.** We do not claim end-to-end encryption we do not have (A4).

### 10.2 Requirements

- **SEC-1** All traffic over TLS. No exceptions, no mixed content.
- **SEC-2** Passwords stored with a modern adaptive hash. Never logged, never emailed.
- **SEC-3** Authorization enforced server-side on every request. A client asking for someone else's conversation must be refused by the server, not merely hidden by the UI.
- **SEC-4** Message and session access requires an accepted, unblocked friendship — re-verified per request, not cached in the client.
- **SEC-5** Rate limiting on auth attempts, friend requests, message sends, and search.
- **SEC-6** Uploaded images validated by content type and size, stripped of EXIF (which carries GPS coordinates), and served from a separate origin.
- **SEC-7** Account deletion removes profile, messages, friendships, and uploads within 30 days, with immediate deactivation.
- **SEC-8** Data export on request (DPDP Act obligation under A5).
- **SEC-9** Secrets never in client code. Any third-party music API key that requires secrecy is proxied through the backend.
- **SEC-10** Blocking is enforced server-side and is immediate and bidirectional.

### 10.3 Privacy settings (MVP)

- Who can send me friend requests: anyone with my username / invite link only
- Show my online status: on / off
- Show my vibing status to friends: on / off
- Read receipts: on / off (reciprocal — turning them off hides others' too)

---

## 11. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Catalog disappointment** — users expect commercial music and leave | High | Honest framing in onboarding; position as discovery; measure 60-second abandonment as an explicit counter-metric |
| **iOS background audio breaks the core promise** | High | Ship Android/desktop-first messaging; prompt Home Screen install; prioritize the Capacitor wrapper in v1.1; make reconnect-and-resync excellent so the failure is graceful |
| **Both users must be online for the magic** — the cold-start problem of a two-person app | High | A1 lets sessions start solo; presence and vibing indicators drive spontaneity; push notifications (v1.1) are the real fix |
| **Third-party music API changes or rate-limits** | Medium | Provider interface abstraction; two sources (Audius + Jamendo) from day one so neither is a single point of failure |
| **Scope creep back toward the original brief** | Medium | This document. §6.4 exists to be pointed at. |
| **Solo beginner underestimates the sync engine** | Medium | Stage 5 sequences sync as its own milestone with a dedicated testing plan in Stage 7 |
| **Free-tier limits hit during growth** | Low for MVP | Client-side image downsizing; monitor usage; cost ceiling is a Stage 8 topic |

---

## 12. Out of scope for this document

Deliberately deferred to later stages, and **not** decided here:

- User journeys, navigation model, information architecture → **Stage 2**
- Screen designs, colour palette, typography, component library, animation → **Stage 3**
- Technology stack, database schema, API design, realtime architecture → **Stage 4**
- Task breakdown and build sequence → **Stage 5**

---

## 13. Sign-off

Please confirm:

1. The four confirmed decisions in §3 still stand.
2. The seven assumptions in §4 — accept or correct each.
3. The MVP scope in §6.1, and specifically the cuts in §6.4.
4. The success metrics in §5 are the right targets.

On confirmation, work proceeds to **Stage 2 — User Experience and Information Architecture.**
