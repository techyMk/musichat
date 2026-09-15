# MusiChat — Technical Architecture

**Stage 4 deliverable · Version 1.0 · 15 September 2026**
**Status: awaiting sign-off before Stage 5 (Development Plan)**
**Depends on:** [PRD.md](./PRD.md) · [UX.md](./UX.md) · [DESIGN.md](./DESIGN.md) · [QUALITY-CHECKLIST.md](./QUALITY-CHECKLIST.md)

---

## 1. Your Python question, answered

You asked about Python for the backend. Python is a genuinely good language and FastAPI is a genuinely
good framework — this is not a knock on either. But for **this** product, built by **one beginner**, on
**no budget**, it's the wrong call, for three specific reasons:

**1. It forces you into three deployables instead of one.** The quality checklist established that
`/invite/:code` must be server-rendered for WhatsApp link previews. That's a JavaScript server. Your app
is JavaScript. So a Python backend means running a JS rendering server *and* a Python API *and* a
WebSocket process — three things to deploy, monitor, and keep in sync, before you've written a feature.

**2. Two languages means two of everything.** Two type systems, two dependency managers, two sets of
validation rules that must agree about what a message looks like. Every model change becomes an edit in
two places. That tax is small for a team and heavy for one person learning.

**3. The real question isn't Python vs Node — it's build vs buy.** A custom backend in *any* language
means you personally build authentication, password reset, session refresh, WebSocket fan-out, presence
tracking, file uploads, and row-level authorization. That's months of work, and every one of those is a
place to introduce a security hole. The PRD's security requirements (SEC-1 to SEC-10) are much easier to
satisfy with a platform that enforces them declaratively than with code you wrote while learning.

**So the recommendation is: don't write a backend for the MVP.** Use a managed one, keep one language,
ship the product, and revisit when you have users to justify the complexity.

**When Python would become right:** music recommendation, audio analysis, or ML features. Those are v2+
concerns and can be added later as a separate service without touching any of this.

---

## 2. Stack comparison

### Backend platform

| Option | Strengths | Why not / why yes |
|---|---|---|
| **Supabase** ✅ | Postgres, Auth, Realtime, Storage in one. Row Level Security enforces authorization in the database. SQL you can actually read. Mumbai region. Open source — self-hostable if you outgrow it. | **Selected.** RLS is the decisive feature: it satisfies SEC-3 and SEC-4 declaratively instead of relying on API code you have to get right every time. |
| Firebase | Best-in-class push notifications; huge ecosystem. | Firestore's NoSQL modelling is genuinely harder to get right than SQL for relational data like friendships, and read-based pricing punishes chat apps. Heavy lock-in. |
| Custom FastAPI + Postgres + Redis | Total control. Best learning. | Months of work before the first feature. You build and secure auth yourself. Wrong trade for an unvalidated product. |
| Appwrite / PocketBase | Good, open source. | Smaller communities mean fewer answers when you're stuck — which matters more than features when you're learning. |

### Frontend framework

| Option | Verdict |
|---|---|
| **Next.js (App Router)** ✅ | **Selected.** Server-renders the public routes (the invite-preview requirement), and `next/og` generates per-invite Open Graph images at the edge — which is exactly the highest-leverage item on the quality checklist. Good PWA support. One language end to end. |
| Vite + React SPA | Ruled out by the empty-view-source problem. No SSR means no per-invite link previews, and the primary growth loop fails silently. |
| Remix / TanStack Start | Both fine. Smaller ecosystems and fewer beginner tutorials. |
| SvelteKit | Excellent and lighter, but React has far more learning material, and that matters most here. |

### The rest

| Concern | Choice | Reason |
|---|---|---|
| Hosting | Vercel | Built for Next.js, free tier, instant deploys, edge OG generation |
| Database | Supabase Postgres (Mumbai) | DPDP data residency (PRD A5) |
| Realtime | Supabase Realtime — Broadcast + Presence | Covers chat, presence, and session sync without a custom WS server |
| Auth | Supabase Auth | Email + password, Google OAuth, verification and reset built in |
| Storage | Supabase Storage | Avatars, with client-side downsizing first (FR-P3) |
| Music | Audius + Jamendo, proxied server-side | Keys stay off the client (SEC-9) |
| Analytics | Plausible or Umami | Cookieless, so no consent banner is needed |
| Errors | Sentry (free tier) | Source maps uploaded privately, never shipped |
| Push (v1.1) | Capacitor + FCM/APNs | The real fix for the MVP's biggest gap |

---

## 3. System shape

```
                    ┌──────────────────────────────────┐
                    │        Next.js on Vercel         │
                    │                                  │
   WhatsApp bot ───▶│  SSR: /invite/:code, /welcome    │
   (no JS)          │  Edge:  /og/invite/[username]    │
                    │  API:   /api/session/command     │
   Browser ────────▶│         /api/music/search        │
   (PWA)            │  Client: the app shell (SPA)     │
                    └───────────┬──────────────────────┘
                                │
              ┌─────────────────┼──────────────────┐
              ▼                 ▼                  ▼
      ┌──────────────┐  ┌───────────────┐  ┌──────────────┐
      │   Postgres   │  │   Realtime    │  │   Storage    │
      │  + RLS       │  │  Broadcast    │  │   avatars    │
      │  source of   │  │  + Presence   │  └──────────────┘
      │  truth       │  └───────────────┘
      └──────────────┘        Supabase (Mumbai)
              ▲
              │  server-side only, keys hidden
      ┌───────┴────────┐
      │ Audius/Jamendo │
      └────────────────┘
```

**Two surfaces, as established in the quality checklist.** Public routes are server-rendered and
crawlable. The app shell is a client-rendered PWA and carries `noindex`.

**The Capacitor path.** When the native wrapper ships in v1.1, it packages the **app routes only** and
points at the same Supabase backend. The public routes stay on the web — a native app doesn't need the
invite landing page, because a deep link opens the app directly. ~95% of the code is shared.

---

## 4. Data model

Postgres. Every table has RLS enabled; nothing is reachable without a policy.

```
profiles            id (=auth.users.id), username UNIQUE, display_name, avatar_url,
                    bio, genres text[], created_at, username_changed_at

user_settings       user_id PK, show_presence, show_vibing, read_receipts,
                    request_policy ('anyone' | 'link_only')

friendships         id, user_a, user_b, status, requested_by, note,
                    created_at, accepted_at
                    CHECK (user_a < user_b)          ← canonical ordering
                    UNIQUE (user_a, user_b)          ← one row per pair, no duplicates

blocks              blocker_id, blocked_id, created_at   PK (blocker_id, blocked_id)

messages            id, friendship_id, sender_id, kind, body,
                    track_ref jsonb, created_at, deleted_at
                    INDEX (friendship_id, created_at DESC)

message_receipts    message_id, user_id, delivered_at, read_at   PK (message_id, user_id)

sessions            id, friendship_id, started_by, status,
                    track_ref jsonb, duration_ms,
                    is_playing, position_ms, position_updated_at,
                    last_command_seq, created_at, ended_at

session_members     session_id, user_id, joined_at, left_at, connection_state

tracks_cache        provider, provider_track_id, title, artist, artwork_url,
                    stream_url, duration_ms, license, attribution
                    PK (provider, provider_track_id)

invites             code PK, inviter_id, created_at, revoked_at

reports             id, reporter_id, target_user_id, message_id,
                    reason, detail, status, created_at
```

**Two modelling decisions worth explaining:**

**`CHECK (user_a < user_b)` on friendships.** Without it, a friendship between Arun and Priya could exist
as two rows — (arun, priya) and (priya, arun) — and every query would need to check both directions.
Forcing the smaller ID first means one row per pair and one simple lookup. This is the kind of constraint
that saves you from a whole category of bugs later.

**`track_ref` as JSONB rather than a foreign key.** Tracks come from external providers that can change or
disappear. Storing a snapshot of the track (title, artist, artwork, provider, id) inside the message means
a song card in a year-old conversation still renders even if the provider removed the track.

### Row Level Security — the policies that matter

| Table | Policy |
|---|---|
| `profiles` | Readable by anyone authenticated (needed for username search); writable only by the owner |
| `messages` | Readable and insertable **only if** an `accepted` friendship exists between sender and recipient **and** no block exists in either direction. Re-checked per request. |
| `sessions` | Same friendship + block test |
| `friendships` | Visible only to its two participants |
| `blocks` | Visible only to the blocker |
| `user_settings` | Owner only |
| `reports` | Insert-only for users; readable only by service role |

This is the point of choosing Supabase. These rules live in the database, so **a client that asks for
someone else's conversation is refused by Postgres itself** — not by API code that might have a missing
check. That satisfies SEC-3 and SEC-4 structurally.

---

## 5. Real-time architecture

Three separate concerns, deliberately not mixed:

| Concern | Mechanism | Why |
|---|---|---|
| Messages | Postgres Changes on `messages` | Must be durable and ordered. Database is the source of truth. |
| Presence | Realtime Presence | Ephemeral by nature; never needs persisting |
| Playback commands | Realtime Broadcast | Needs lowest possible latency; the database write happens in parallel, not in the path |

Playback commands deliberately do **not** wait for a database round-trip before reaching the other
person. The broadcast goes out immediately for responsiveness, and the write to `sessions` happens
alongside it as the durable record used for reconnection.

---

## 6. The sync engine

The hardest part of the product, and the part most likely to be got wrong.

### 6.1 Clock synchronization

Two phones have clocks that disagree by seconds. Before anything can be synchronized, each client must
learn its offset from the server.

An NTP-style handshake, on connect and every 60s after:

```
client sends   t0 (client clock)
server replies ts (server clock)
client records t1 (client clock)

round_trip = t1 - t0
offset     = ts - (t0 + t1) / 2
```

Take five samples, discard the three with the worst round-trip, use the median offset of the rest.
Discarding high-latency samples matters — a single delayed packet otherwise poisons the estimate.

Now any client can convert server time to its own local clock, and vice versa.

### 6.2 Position is computed, never stored continuously

The session row does **not** store a constantly-updating position. It stores an anchor:

```
position_ms          position at the anchor moment
position_updated_at  server timestamp of that anchor
is_playing           boolean
```

Expected position at any moment:

```js
expected = is_playing
  ? position_ms + (serverNow() - position_updated_at)
  : position_ms
```

This is what makes reconnection trivial. A client that has been offline for two minutes reads the row,
computes where the song should be now, seeks there, and is synced — with no event replay.

### 6.3 Commands

```
PLAY | PAUSE | SEEK | CHANGE_TRACK | END
```

Every command carries a client-generated UUID and the client's estimated server time.

Because both participants have equal control (D3), two people can act at once. Resolution:
**last write wins by server receive time**, with a monotonically increasing `last_command_seq`. A client
receiving a command with a sequence lower than one it has already applied discards it silently rather
than fighting.

Every applied command emits an attributed system message — *"Priya skipped to Midnight Drive"* (FR-M5).
Attribution is what stops equal control from feeling like a glitch.

### 6.4 Drift correction

Each client checks itself once per second against the expected position:

| Drift | Action |
|---|---|
| ≤ 150 ms | Nothing |
| 150–400 ms | `audio.playbackRate = 1 ± 0.02` until corrected, then back to 1.0 — inaudible |
| > 400 ms | Hard seek. Audible, so used sparingly. |
| > 2 s, or no server contact for 10 s | Stop claiming sync. Show "Reconnecting". |

The gradual correction is why the target in PRD §9.1 is achievable without constant audible jumps.

### 6.5 Joining and rejoining

A joining client seeks to `expected + (round_trip / 2)` — compensating for the time the audio will take
to start. Then it shows "Catching up" until measured drift is within tolerance, and only then displays
"In sync".

**Never display "In sync" before it's measured true.** The indicator is load-bearing; one lie and users
stop trusting it permanently.

### 6.6 What we are not attempting

Sample-accurate synchronization across two devices on the public internet is not achievable, and chasing
it would waste the entire build. Target is p95 ≤ 400ms, which reads as "together" to human perception.
Buffering differences, Bluetooth latency (which can exceed 200ms on its own), and mobile network jitter
all sit outside our control.

---

## 7. API surface

Most data access goes directly from client to Supabase, protected by RLS. Server routes exist only where
a secret, an external call, or server-side validation is genuinely required.

| Route | Purpose |
|---|---|
| `POST /api/session/command` | Validates and applies a playback command, writes the anchor, broadcasts |
| `GET /api/music/search` | Proxies Audius and Jamendo. Keys never reach the client (SEC-9). Caches into `tracks_cache`. |
| `GET /api/music/stream/:id` | Resolves a playable URL, refreshed on expiry |
| `GET /og/invite/[username]` | Edge-generated Open Graph image — avatar, display name, mark |
| `GET /invite/[code]` | Server-rendered invite landing with per-invite meta tags |
| `POST /api/report` | Writes a report; users cannot read the reports table |
| `POST /api/account/delete` | Orchestrates deletion across tables and storage (SEC-7) |

Rate limits (SEC-5) on auth attempts, friend requests, message sends, search, and session commands.

---

## 8. Music provider abstraction

Per PRD §8.3, everything goes through one interface so Spotify or Apple Music can be added in v2 without
touching the sync engine:

```ts
interface MusicProvider {
  search(query: string, limit: number): Promise<Track[]>
  getTrack(id: string): Promise<Track>
  getStreamUrl(id: string): Promise<string>
  readonly attribution: AttributionRequirement   // CC licences require this (PRD §8.4)
}
```

MVP ships `AudiusProvider` and `JamendoProvider`. Two sources from day one so neither is a single point
of failure. Artist name and licence are stored with every track reference and displayed in the player —
a functional requirement, not a footnote.

---

## 9. Cost

| Item | Free tier | When you outgrow it |
|---|---|---|
| Vercel Hobby | 100GB bandwidth | **Hobby prohibits commercial use.** The moment you monetize, Pro is $20/mo. Budget for it. |
| Supabase Free | 500MB database, 1GB storage, 200 concurrent realtime connections, 50k monthly active users | Pro is $25/mo. 200 concurrent connections means roughly 100 simultaneous sessions. |
| Domain | Free `*.vercel.app` | **Decided: ship on the free subdomain, buy later.** Fine for development and a private beta with people who already know you. Buy before inviting strangers — see §9.1. |
| Plausible | — | ~$9/mo, or self-host Umami free |
| Sentry | 5k errors/mo | Sufficient for a long time |

**MVP running cost: zero.** First real bill arrives around 200 concurrent listeners or commercial launch,
whichever comes first.

### 9.1 Running on the free subdomain

Two things to do now so the eventual move costs an afternoon instead of a weekend:

**1. Claim a clean project name.** Vercel gives the production deployment a
`<project-name>.vercel.app` alias alongside the ugly per-commit URLs. Name the project `musichat` and
share only `musichat.vercel.app` — never `musichat-git-main-username.vercel.app`, which reads as a
build artifact and kills trust instantly.

**2. Never hardcode the base URL.** Put it in one place:

```
NEXT_PUBLIC_SITE_URL=https://musichat.vercel.app
```

Everything that needs an absolute URL derives from it — Open Graph tags, the OG image endpoint, invite
links, the PWA manifest `start_url`, Supabase Auth redirects, and the Google OAuth callback. Hardcoded
URLs scattered across the codebase are what turn a domain change into a multi-day bug hunt.

**When the domain arrives:** point DNS at Vercel, update the env var, update the Supabase Auth redirect
allowlist and the Google OAuth authorized redirect URIs, and **keep the `vercel.app` subdomain alive as a
permanent 301 redirect** — invite links already sitting in people's WhatsApp history must keep working.

**Buy before:** inviting anyone outside your own circle, any public launch, or submitting to an app store.

---

## 10. Security mapping

| Requirement | How it's met |
|---|---|
| SEC-1 TLS everywhere | Vercel and Supabase are HTTPS-only |
| SEC-2 Password hashing | Supabase Auth (bcrypt); passwords never touch our code |
| SEC-3 Server-side authorization | **RLS in Postgres** — enforced by the database, not by API code |
| SEC-4 Friendship-gated access | RLS policies test accepted friendship + absence of blocks, per request |
| SEC-5 Rate limiting | Supabase Auth built-in, plus limits on our API routes |
| SEC-6 Upload validation | Type and size checks, EXIF stripped client-side (it carries GPS), served from Supabase Storage's separate origin |
| SEC-7 Account deletion | `/api/account/delete` cascades; immediate deactivation, full removal within 30 days |
| SEC-8 Data export | Server route returning the user's rows as JSON |
| SEC-9 Secret handling | Music API keys only in server routes; nothing sensitive in `NEXT_PUBLIC_*` |
| SEC-10 Blocking | Enforced in RLS, so it's immediate and bidirectional at the data layer |

Plus, from the quality checklist: source maps uploaded to Sentry and **not shipped**; `noindex` on all app
routes; private routes disallowed in `robots.txt`.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| **Supabase Realtime free-tier connection cap** | 200 concurrent is ~100 sessions. Monitor from day one; the upgrade is $25/mo, not an architecture change. |
| **iOS backgrounding kills the WebSocket** | Known and accepted (PRD §9.4). The reconnect-and-recompute design in §6.2 makes recovery clean. Capacitor in v1.1 is the real fix. |
| **Audius or Jamendo changes their API** | Two providers behind one interface; neither is load-bearing alone. |
| **Stream URLs expire mid-session** | `getStreamUrl` refreshes on 403; the player retries once before surfacing an error. |
| **Vercel Hobby commercial-use terms** | Flagged above. Plan for $20/mo at monetization. |
| **RLS policy mistake exposes data** | The highest-severity risk in this design. Stage 7 includes explicit RLS tests that attempt cross-user reads and must fail. |
| **Clock offset poisoned by bad samples** | Median-of-best-two-of-five, re-measured every 60s. |

---

## 12. Sign-off

Confirm these four and Stage 5 begins:

1. **No custom backend for the MVP** — Supabase instead of FastAPI, for the reasons in §1.
2. **Next.js on Vercel**, driven by the server-rendering requirement for invite previews.
3. **The sync design in §6** — computed position with an anchor, last-write-wins, gradual drift correction.
4. **RLS as the primary security boundary**, with Stage 7 testing it adversarially.

Stage 5 breaks all of this into small, ordered, buildable tasks.
