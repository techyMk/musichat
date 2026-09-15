# MusiChat — User Experience & Information Architecture

**Stage 2 deliverable · Version 1.0 · 15 September 2026**
**Status: awaiting sign-off before Stage 3 (UI & Design System)**
**Depends on:** [PRD.md](./PRD.md) v1.0

---

## 1. What this document decides

Structure, flow, and behaviour. Where things live, how you get between them, what happens at every branch and failure.

**Not decided here:** colour, typography, spacing, iconography, illustration, motion curves, component styling. Those are Stage 3. Where this document says "prominent" or "quiet," it is describing hierarchy, not appearance.

---

## 2. The central structural problem

Two facts drive every decision below:

1. **The music session is persistent and orthogonal to navigation.** It is not a screen. It outlives every screen transition and must be reachable and controllable from everywhere.
2. **There is essentially one primary object — the conversation.** Everything else (profile, friends, settings) is secondary and visited rarely.

A conventional messaging IA (bottom tab bar, 3–5 tabs) fights both facts. It spends the bottom edge on navigation the user barely needs, and it leaves nowhere good for the persistent player.

---

## 3. Navigation model

### 3.1 Decision: single-root navigation, no tab bar

```
                    ┌─────────────────────────┐
                    │   FULL PLAYER (sheet)   │   ← overlay layer
                    └─────────────────────────┘
                    ┌─────────────────────────┐
                    │   MINI PLAYER (docked)  │   ← session layer
                    └─────────────────────────┘
   ┌────────────┐   ┌─────────────────────────┐
   │  /chats    │──▶│  /chats/:friend         │   ← navigation stack
   │  (root)    │   └─────────────────────────┘
   │            │   ┌─────────────────────────┐
   │            │──▶│  /friends/add           │
   │            │   └─────────────────────────┘
   │            │   ┌─────────────────────────┐
   │            │──▶│  /me  ─▶ /me/settings   │
   └────────────┘   └─────────────────────────┘
```

**`/chats` is the root and the only root.** Profile and Add Friend are pushed screens reached from the home header, not peer destinations. Back from any of them always returns to `/chats`.

**Why no tab bar:**

- We have one real destination. A tab bar with two tabs is an admission that there was nothing to navigate.
- A tab bar plus a mini player stacks two persistent bars at the bottom — roughly 140px of a phone screen gone, on the conversation screen where vertical space matters most.
- The mini player gets the entire bottom edge uncontested, which matches its actual importance in this product.
- Fewer structures to build, fewer to learn. Relevant given D4.

**The cost, stated honestly:** Add Friend is one tap less discoverable than it would be in a tab bar. This is mitigated by the home empty state routing directly into the invite flow, and by a persistent header action. If post-launch data shows friend-adding is too buried, the fix is promoting it in the header, not adding a tab bar.

### 3.2 Consolidation: "Find Friends" and "Invite Friends" become one screen

The original brief specified two screens. After the Stage 1 cuts — nearby discovery and contacts import both removed — "Find Friends" would have contained only a username search box. That is not a screen.

`/friends/add` now holds three segments in one place: **Search · Invite · Requests**, with Requests badged when pending. This is more honest about how little there is to do here and removes a navigation layer.

---

## 4. The session layer

The session is a layer above navigation with four presentation states. Navigation never changes the session; the session never changes navigation.

```
   HIDDEN ──────▶ BAR ◀──────▶ FULL
   (no session)    │  ▲         (sheet)
                   ▼  │
                 BUBBLE
              (edge-docked)
```

| State | When | Shows | Occupies |
|---|---|---|---|
| **Hidden** | No active session | — | Nothing |
| **Bar** | Session live, full player closed. Default. | "Vibing with Priya", track, artist, progress, play/pause | Docked bottom edge, above content |
| **Bubble** | User collapsed the bar | Artwork + play state only | Small, edge-docked, draggable |
| **Full** | User opened the player | Everything (§6.5) | Sheet over all content |

### 4.1 Decision: the full player is a sheet, not a pushed screen

This is the most consequential interaction decision in the app.

If the full player were a route you navigate *to*, opening it would mean leaving the conversation, and closing it would mean navigating back — the music and the chat would feel like two places you shuttle between. That is exactly the "WhatsApp + a music player" failure the PRD is written against.

As a **sheet dragged up from the mini bar**, the music sits *on top of* the conversation. Drag it down and your conversation is still right there, unchanged, scroll position intact. The signature gesture of the app becomes: **pull the music up to look at it, push it down to keep talking.** Nothing is ever lost or left.

**Implementation note for Stage 4:** the sheet's open state is registered as a browser history entry, so the Android back gesture and browser back button close the sheet rather than leaving the conversation. This is the single most-botched detail in PWAs and needs to be right from the first build.

### 4.2 The mini player is not dismissible

It can be collapsed to a bubble. It cannot be closed while a session is live. Ending a session is a deliberate act performed in the full player, never an accidental swipe. A user who cannot find their music is a user who has lost the product.

---

## 5. Screen inventory and route map

Every screen has a URL. This is a PWA advantage and it is used deliberately: any state worth returning to is linkable.

| Route | Screen | Auth | Notes |
|---|---|---|---|
| `/` | **Landing** | No | Value proposition + Create account / Log in. Redirects to `/chats` when already signed in. |
| `/signup` | Sign up | No | Email+password or Google |
| `/login` | Log in | No | |
| `/forgot` | Forgot password | No | |
| `/reset` | Reset password | No | Token in query string, single-use |
| `/verify` | Email verification | Partial | Holding screen + resend |
| `/invite/:code` | **Invite landing** | No | Public. The highest-leverage screen in the app (§6.2) |
| `/onboarding/username` | Claim username | Yes | Required. The only mandatory onboarding step. |
| `/onboarding/profile` | Complete profile | Yes | Entirely skippable |
| `/chats` | **Home** | Yes | Root |
| `/chats/:friendId` | **Conversation** | Yes | |
| `/friends/add` | Add friend | Yes | Segments: Search · Invite · Requests |
| `/u/:username` | Friend profile | Yes | Viewed from conversation header |
| `/me` | My profile | Yes | |
| `/me/settings` | Settings | Yes | |
| `/me/settings/privacy` | Privacy | Yes | Presence, vibing visibility, receipts, request policy |
| `/me/settings/blocked` | Blocked users | Yes | |

**Not routes:** the mini player, the full player sheet, the session invitation banner, any modal. These are layers and overlays, present regardless of route.

---

## 6. User journeys

### 6.1 Organic first run — found the app independently

```
/ → /signup → verify email → /onboarding/username
    → /onboarding/profile → /friends/add → /chats (empty)
```

**Changed during M1:** the landing lives at `/` rather than at a separate
`/welcome`. Splitting it off added a redirect hop for every first-time visitor
— including anyone who types the bare domain after seeing an invite — and moved
the marketing page off the canonical URL for no benefit.

**Step notes:**

- **Verification gate.** The account exists but is unusable until verified. The holding screen offers resend (rate-limited) and a visible "change email address" escape, because a typo'd email is otherwise a dead end that costs you the user permanently.
- **Username is its own step, alone.** It is the one mandatory field, it can fail validation (taken, too short, bad characters), and mixing a failure-prone required field with optional ones makes the whole form feel required. Live availability checking as they type.
- **Profile is one screen, all optional.** Display name, photo, bio, genres — every field skippable, plus a single "Skip for now" that clears the whole screen.
- **Photo is not first.** Photo upload has the highest abandonment of any onboarding field: it requires leaving the app, choosing, cropping, waiting on an upload. Putting it first makes onboarding feel like work. Order: display name → photo → bio → genres.
- **Landing on an empty home is expected and fine** — the empty state does the work (§9.1).

### 6.2 Invited first run — arrived from a link

**This is the most important flow in the product.** The PRD's primary success metric (invite → join ≥ 40%) is entirely decided here.

```
WhatsApp/Instagram message
    → /invite/:code  ← public, no auth
    → /signup
    → verify email
    → /onboarding/username
    → /chats/:priyaId   ← STRAIGHT INTO THE CONVERSATION
```

**Decision: invited users skip profile setup entirely.** The original brief's order was signup → profile → find friends → home. For someone who arrived because a specific person asked them to, making them write a bio and find friends before they can reach that person is friction at precisely the wrong moment. They came for Priya. Take them to Priya.

Username is still required — it is their identity, not decoration. Everything else is nudged later via a dismissible home banner.

**The invite landing page must do three things in under five seconds:**

1. **Show who invited them** — photo, display name, and the personal note if one was written. The face is the reason they're still reading.
2. **Prove the app is real and alive** — show what the inviter is listening to *right now*, or last played: *"Priya is vibing to Midnight Drive right now."* This costs almost nothing to build (the data already exists for the home screen's vibing indicator) and is far more convincing than any description of the product.
3. **One action** — "Join Priya." No secondary CTA competing with it.

**Two failure modes to design for explicitly:**

- **The in-app browser problem.** Links opened from WhatsApp and Instagram open inside their own embedded browser, where PWA install is unavailable, Google sign-in is often blocked, and sessions don't persist. This is not an edge case — it is the majority path for this flow. The invite page must detect an embedded browser and surface a clear "Open in browser" affordance. If this is missed, the primary growth loop silently fails for most users.
- **Already has an account.** The invite page must offer "Log in instead," which then routes to the same destination and auto-sends the friend request.

**Friend request timing:** created automatically the moment the invited user finishes claiming a username, pre-accepted on the inviter's side since they issued the invitation. The two are friends on arrival — the invitee should never land in a conversation they cannot yet use.

### 6.3 Friend request by username search

```
/friends/add → Search → type username → result → Send request (+ note)
    → [recipient] Requests badge → Accept → conversation created, both notified
```

Declining is silent. The sender's request simply stays pending forever, which is the kindest available outcome and standard practice.

### 6.4 The first shared session — the aha moment

Everything in the product exists to get two people here. It must be one tap from the conversation.

```
[Conversation] → "Start vibing" → pick a track → session live
                                        │
                     ┌──────────────────┴──────────────────┐
              Partner online                       Partner offline
                     │                                     │
       Invitation appears (§6.6)              Session starts solo
                     │                        Mini bar: "Waiting for Priya"
              Accept │ Dismiss                        │
                     │     └── Session continues solo  │
         "Catching up…" ~1–2s                          │
                     │                    Priya opens app → invitation
              SYNCED ─ "Vibing together"                │
                     └──────────────────┬──────────────┘
                                   Both listening
```

**Design requirements for this moment:**

- The transition into synced state is the emotional peak of the app and should be **celebrated**, not merely indicated. Stage 3 will specify how.
- The "catching up" state must be brief and honest. Never claim synced before it is true — the first time the app lies, the user stops trusting the sync indicator permanently, and the indicator is load-bearing.
- **Starting solo is a first-class state, not an error.** Per A1. The copy is warm ("Priya will join when she's around"), never apologetic.

### 6.5 Listening while navigating — the core promise

```
[Full player, vibing with Priya]
    → drag down → [Conversation with Priya] + mini bar    ♪ playing
    → back       → [Home] + mini bar                      ♪ playing
    → open Arun's chat → [Conversation with Arun] + mini bar  ♪ playing
        mini bar still reads "Vibing with Priya"  ← critical
    → tap mini bar → [Full player] over Arun's chat
    → drag down → back to Arun's chat
```

**The mini bar always names the person you are listening *with*, never the chat you are currently *in*.** If you are messaging Arun while vibing with Priya, the bar says "Vibing with Priya." Getting this wrong makes the session feel like it belongs to the screen rather than to the friendship, and the whole model collapses.

**Full player contents** (per FR-M1–M12): album artwork, track title, artist, seekable progress with elapsed/remaining, previous / play-pause / next, partner identity ("You + Priya") with their photo, sync status indicator, local mute, track search, and end session.

### 6.6 Receiving a session invitation

Priority depends on where the recipient is:

| Recipient's location | Presentation |
|---|---|
| In that conversation | Inline banner above the composer — "Arun started vibing" + Join |
| Elsewhere in the app | Top banner, auto-dismissing after ~10s, tappable to join |
| App closed | v1.1 push notification. In MVP, seen on next open. |

**This must interrupt.** A session invitation is time-sensitive in a way a message is not — Arun is sitting there listening alone, waiting. Burying it in a badge wastes the invitation and the moment.

**MVP limitation, stated plainly:** without push notifications, an invitation to a closed app is invisible until reopened. This is the single largest functional gap in the MVP and the main reason the Capacitor wrapper is prioritized in v1.1.

### 6.7 Disconnection and recovery

Four states, always visible in both the mini bar and full player:

| State | Meaning | Shown to partner |
|---|---|---|
| **Synced** | Drift within tolerance | Normal |
| **Catching up** | Correcting drift, or just joined | Normal |
| **Reconnecting** | Connection lost, retrying | "Priya is reconnecting…" |
| **Lost** | Retries exhausted | "Priya dropped out" |

**Transparency is the whole strategy here.** A user who sees "reconnecting" waits. A user who sees nothing and hears music that they suspect their partner isn't hearing has lost faith in the product's one promise. Showing the partner's connection state is as important as showing your own.

On reconnect: rejoin at live position (FR-M8), replay missed messages, resume. Never resume where the user left off — that would silently desync them.

### 6.8 Ending a session

| Trigger | Result |
|---|---|
| Either person taps End | Session ends for both. System message in chat. |
| Partner leaves, you remain | Continues solo. Mini bar: "Listening alone." |
| Start a session with someone else | Old session ends (A2), old partner notified |
| Friend removed or blocked | Session ends immediately |

### 6.9 Safety journeys

**Block:** friend profile → Block → confirm with plain-language consequences ("Priya won't be able to message you or see you") → friendship removed, session ended, mutual invisibility in search, future requests silently dropped. Reversible from `/me/settings/blocked`.

**Report:** long-press a message, or friend profile → Report → reason + optional detail → confirmation → queued for manual review. Offer "also block" in the same flow, since the two intentions usually arrive together.

**Delete account:** Settings → Delete account → typed confirmation → immediate deactivation, full deletion within 30 days (SEC-7). State plainly what is destroyed and that it cannot be undone.

---

## 7. Session state machine (UX level)

```
    IDLE
      │ start
      ▼
   STARTING ──── fail ──▶ ERROR ──▶ IDLE
      │
      ▼
    SOLO ◀────── partner leaves ──────┐
      │ partner joins                 │
      ▼                               │
  CATCHING_UP ──────▶ SYNCED ─────────┘
      ▲                 │
      └── RECONNECTING ─┤
             │          │
           LOST ────────┘ (retry succeeds)
             │
             ▼ user ends / retries exhausted
           ENDED ──▶ IDLE
```

`SOLO` is a normal operating state, not a degraded one. Copy and visual treatment must reflect that.

---

## 8. Navigation rules

### 8.1 Back behaviour

| Context | Back does |
|---|---|
| Full player sheet open | Closes the sheet. Nothing else. |
| Session invitation banner showing | Dismisses the banner |
| Any pushed screen (`/me`, `/friends/add`, `/u/:x`) | Returns to `/chats` |
| Conversation | Returns to `/chats` |
| `/chats` | Browser default (leaves app / installed PWA ignores) |

Back **never** ends a session, closes the mini player, or discards a typed-but-unsent message.

### 8.2 Deep link handling

| Link | Signed out | Signed in |
|---|---|---|
| `/invite/:code` | Full invite landing (§6.2) | Profile + "Add friend", or straight to chat if already friends |
| `/chats/:friendId` | → `/login`, then resume to the destination | Direct |
| `/u/:username` | → `/login`, then resume | Direct |

Any interrupted destination is preserved across the auth detour. Losing someone's intended destination at a login wall is a needless drop.

### 8.3 Interruption priority

Highest to lowest. Only one interruptive layer at a time; lower-priority items queue.

1. Connection lost (session active)
2. Session invitation
3. Friend request accepted
4. New message while elsewhere in app
5. Profile completion nudge — passive banner only, never modal, dismissible permanently

---

## 9. State inventory

Every list, screen, and action needs all four states designed. Stage 3 renders them; this is the required inventory.

### 9.1 Empty states

| Location | Intent |
|---|---|
| Home, no friends | The most important empty state in the app. Explains the product in one line and routes directly into inviting. Should feel like an invitation, not a void. |
| Home, friends but no conversations | Nudge toward starting one |
| Conversation, no messages | Warm, encourages the first message and surfaces "Start vibing" |
| Search, no results | Offer the invite path — the person they want probably isn't here yet |
| Requests, none pending | Quiet, unremarkable |
| Music search, no results | Acknowledge the catalog's limits honestly; suggest browsing instead |
| Blocked list, empty | Quiet |

### 9.2 Loading states

Skeletons over spinners for lists (conversations, messages, search results). Optimistic rendering for sent messages and playback controls — the UI responds immediately and reconciles with the server after, because a 300ms delay on a play button feels broken even though it isn't.

### 9.3 Error states

| Error | Behaviour |
|---|---|
| Network lost | Persistent banner; queue outgoing messages; never lose typed input |
| Message failed | Inline retry on the message itself |
| Track failed to load | Skip with explanation; do not kill the session |
| Session sync failure | Degrade to "reconnecting," attempt recovery, never silently desync |
| Auth expired | Silent refresh; only surface if the refresh itself fails |
| Rate limited | Plain-language explanation with a time, never a raw error code |
| Upload failed | Retry, plus the option to skip entirely |

### 9.4 Copy principles

Relevant to UX because it determines what the flows feel like:

- Warm and direct. Never cute at the expense of clarity.
- Second person, present tense. "Priya is vibing," not "User is currently listening."
- Failure copy blames circumstances, never the user.
- "Vibing" is reserved exclusively for active shared listening. It is the product's one piece of vocabulary and it loses meaning if applied to anything else.

---

## 10. Open questions for sign-off

1. **Invite landing "now playing" hook** (§6.2) — this shows the inviter's current or last-played track to a signed-out visitor. It is a strong proof-of-life signal, but it exposes a small amount of a user's activity on a public URL. It respects the existing "show my vibing status" privacy setting, and falls back to their profile when off. **Confirm this is acceptable.**

2. **Invited users skip profile setup** (§6.2) — a deliberate departure from the order in your original brief. It should measurably improve the metric the PRD cares most about, at the cost of more users having blank profiles early on.

3. **No tab bar** (§3.1) — the most structural decision here, and the hardest to reverse later. It makes the app feel less like a conventional messenger, which is intentional per the PRD's positioning.

4. **Local mute** (§6.5) — a small addition not in the original brief. Two people in the same room, or one person who wants to stay in the session while taking a call, need a way to silence their own audio without leaving. Cheap to build, prevents an obvious frustration.

On confirmation, work proceeds to **Stage 3 — UI & Design System**.
