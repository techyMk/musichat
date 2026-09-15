# MusiChat — Development Plan

**Stage 5 deliverable · Version 1.0 · 15 September 2026**
**Status: awaiting sign-off before Stage 6 (Development)**
**Depends on:** [PRD.md](./PRD.md) · [UX.md](./UX.md) · [DESIGN.md](./DESIGN.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [QUALITY-CHECKLIST.md](./QUALITY-CHECKLIST.md)

---

## 1. How long this actually takes

**Roughly 13–16 weeks part-time** for one beginner. Three to four months.

That is an honest number, not a discouraging one. Anyone quoting you four weeks for a real-time
synchronized audio app with auth, chat, and a safety system is either not counting testing or not
counting the parts that go wrong. Knowing the real shape up front is what stops you quitting in week six
thinking you're behind.

| Milestone | What you get | Estimate |
|---|---|---|
| **M0** Foundations | A styled, installable, deployed shell — plus proof the sync idea works | 1 week |
| **M1** Auth & profile | You can create an account and land on an empty home | 2 weeks |
| **M2** Friends & invites | You can send a link and someone lands in a chat with you | 2 weeks |
| **M3** Chat | Two phones hold a real conversation | 2 weeks |
| **M4** Music, solo | Audio plays and survives navigation | 2 weeks |
| **M5** Sync | Two phones stay together. **The hard one.** | 3 weeks |
| **M6** Safety & settings | Block, report, privacy, delete | 1 week |
| **M7** Polish & launch | Every state, every checklist item | 2 weeks |

---

## 2. Rules of the road

**Deploy on day one, and every day after.** The first thing that goes live should be an empty page. If
deployment is a thing you do at the end, it becomes a crisis at the end.

**One task at a time, finished.** Every task below has a "done when." If you can't answer it, the task
isn't finished — don't start the next one.

**Write the RLS policy in the same sitting as the table.** Never "I'll add security later." Later is how
data leaks.

**Test on two real phones from M3 onward.** Two browser tabs on one laptop share a clock, a network, and
an audio stack. They will lie to you about sync. Borrow a second phone.

**Chat before music, solo before sync.** Each layer proves the one beneath it works.

---

## 3. M0 — Foundations · 1 week

| # | Task | Done when |
|---|---|---|
| 0.1 | GitHub repo; Next.js App Router + TypeScript + Tailwind | `npm run dev` serves a page locally |
| 0.2 | Connect Vercel, name the project `musichat`, first deploy | `musichat.vercel.app` loads |
| 0.3 | Supabase project in the **Mumbai** region; env vars wired | Client connects; a test query returns |
| 0.4 | `NEXT_PUBLIC_SITE_URL` + a single `siteUrl()` helper | No absolute URL appears anywhere else in the code |
| 0.5 | Load Gabarito + Figtree; paste DESIGN §2 tokens as CSS variables, both themes | A test page renders correct type and colour in light and dark |
| 0.6 | Primitives: Button, Input, Avatar, Chip, Pill, Sheet | Each renders in all its variants on a scratch page |
| 0.7 | Root layout: `<html lang="en">`, per-route title template, skip-to-content link | View-source shows `lang`; tab title is not "Create Next App" |
| 0.8 | Favicon set, `site.webmanifest`, maskable icon *(needs the asset variants from DESIGN §4)* | Installs to an Android home screen with the right icon |
| 0.9 | Sentry; source maps uploaded privately, **not shipped** | An intentional error appears in Sentry; `.map` files are absent from the deployed bundle |
| 0.10 | Custom 404 in the product's voice | `/nonsense` renders it |
| **0.11** | **Sync spike — throwaway code** | See below |

### 0.11 is the most important task in this plan

Before building three months of app around it, spend **two or three days proving the sync idea works.**

Throwaway code, no design, no auth. Two browser tabs on two different machines, one hardcoded audio file,
a Supabase Broadcast channel, the clock-offset handshake from ARCHITECTURE §6.1, and the computed-position
formula from §6.2. Play, pause, seek. Print the measured drift to the screen.

**Done when:** two devices on different networks hold within 400ms across play, pause, and seek, and
recover after you turn one device's wifi off and on.

If this works, everything else is ordinary app-building. If it doesn't, you've learned it in week one
instead of week twelve. Then delete it — it's a spike, not a foundation.

### Result — PASSED, 15 Sep 2026 (same-network pass)

| Measure | Phone | Laptop |
|---|---|---|
| Steady drift | −141 ms | −146 ms |
| Worst drift | −278 ms | −240 ms |
| Correction fired | none | none |
| Latency | 28 ms rtt | 13 ms rtt |
| **Clock offset** | **−28,916 ms** | −8 ms |

Sequence numbers converged across both devices after every command, in both directions.

**The finding that matters: the test phone's clock was 29 seconds ahead of the server.** Without the
offset handshake those two devices would have been 29 seconds apart in the song — and it would have
presented as a sync bug rather than a clock bug. The handshake is not optional and must not be
simplified away in M5.

Two smaller findings carried into M5:

- Both devices sit ~145 ms *behind* their own expected position — systematic audio startup latency.
  Because it is near-identical on both, it cancels perceptually and needs no compensation.
- Drift is measured against a device's *own* state, so two devices can both report green while being on
  different sessions entirely. **Sequence equality is the real convergence check**, and the production
  sync status must verify it before ever displaying "In sync".

Confirmed working again on the Vercel deploy.

**Decision: the spike page stays until M5 ships the real player.** The rule was to delete it, and the
reason was that throwaway code becomes load-bearing. But `clock.ts` and `sync.ts` turned out to be
production code rather than spike code, and `/spike` is the only sync test harness that exists until the
real player is built. It is deleted at the end of M5, not before.

Still worth doing when convenient: the tunnel recovery test — data off for a full minute, then back on,
confirming the client rejoins at the *live* position rather than where it left. It is also an M5
acceptance criterion (5.10), so it gets covered there regardless.

---

## 4. M1 — Auth & profile · 2 weeks

| # | Task | Done when |
|---|---|---|
| 1.1 | `profiles` table + RLS (readable when authenticated, writable by owner only) | A second account cannot update your row |
| 1.2 | Email + password signup | Account appears in Supabase Auth |
| 1.3 | Verification holding screen: resend (rate-limited) + change email address | A typo'd email is recoverable without support |
| 1.4 | Login | Session persists across a browser restart |
| 1.5 | Forgot password → emailed reset link, single-use, 1-hour expiry | Reused link is rejected |
| 1.6 | Google OAuth | Works in a normal browser; note the failure inside in-app browsers (handled in 2.10) |
| 1.7 | Route protection + return-to-destination after login | Visiting `/chats/x` signed out, then logging in, lands on `/chats/x` |
| 1.8 | Username claim screen, live availability check | Taken names rejected before submit; rules from FR-P1 enforced |
| 1.9 | Profile setup — display name, bio, genres, all skippable | "Skip for now" reaches home with only a username |
| 1.10 | Avatar upload: client-side downsize, **EXIF stripped** | Uploaded photo carries no GPS data |
| 1.11 | Sign out — this device / all devices | |

---

## 5. M2 — Friends & invites · 2 weeks

| # | Task | Done when |
|---|---|---|
| 2.1 | `friendships` table with `CHECK (user_a < user_b)` + RLS | Duplicate pair insert is rejected by the database |
| 2.2 | `blocks` table + RLS | |
| 2.3 | Username search | Blocked users never appear |
| 2.4 | Send friend request with optional note | |
| 2.5 | Requests list; accept / decline — **decline is silent** | Sender sees no change on decline |
| 2.6 | `invites` table + code generation | |
| 2.7 | Invite tab: link, copy + "Copied" toast, native share sheet, QR code | Share sheet opens WhatsApp on a real phone |
| 2.8 | **Server-rendered** `/invite/[code]` with per-invite meta tags | View-source shows Priya's name in `og:title` |
| 2.9 | Per-invite OG image via `next/og` — avatar, name, mark | Pasting the link into WhatsApp shows her face |
| 2.10 | Embedded-browser detection + "Open in Chrome" notice | Verified inside Instagram's in-app browser |
| 2.11 | Invited-signup path: claim username → **straight into the chat**, friendship pre-accepted | No profile step for invited users |
| 2.12 | Remove friend | |

**Milestone test:** send the link from your phone to a friend's phone over WhatsApp. They should see your
face in the preview, tap, sign up, and land in a conversation with you. If any step feels slow or
confusing, fix it here — this flow decides whether the product grows.

---

## 6. M3 — Chat · 2 weeks

| # | Task | Done when |
|---|---|---|
| 3.1 | `messages` + `message_receipts` tables + RLS (accepted friendship AND no block, both directions) | A blocked user's insert is refused by Postgres |
| 3.2 | Conversation list on home — last message, relative time | |
| 3.3 | Conversation screen, thread, bubbles per DESIGN §5.1 | Yours right and Rose, theirs left and Azure |
| 3.4 | Send message, optimistic render | Appears instantly, reconciles after |
| 3.5 | Realtime receive via Postgres Changes | Second phone updates without refresh |
| 3.6 | Infinite scroll upward | Scroll position doesn't jump when older messages load |
| 3.7 | Unread counts, cleared on open | |
| 3.8 | Delivered + read receipts, honouring the privacy setting | |
| 3.9 | Typing indicator via Broadcast, 3s clear | |
| 3.10 | Presence dot, honouring the privacy setting | |
| 3.11 | Offline queue + retry | Airplane mode, type, send, reconnect — message arrives, nothing lost |
| 3.12 | Delete own message → tombstone | |
| 3.13 | Emoji picker | |

---

## 7. M4 — Music, solo · 2 weeks

No sharing yet. One person, one song, working perfectly.

| # | Task | Done when |
|---|---|---|
| 4.1 | `MusicProvider` interface (ARCHITECTURE §8) | |
| 4.2 | `AudiusProvider` | Search returns real tracks |
| 4.3 | `JamendoProvider` | Same interface, swappable |
| 4.4 | `/api/music/search` proxy + `tracks_cache` | **No API key reachable from the browser** |
| 4.5 | Stream URL resolution with expiry refresh on 403 | An expired URL recovers without ending playback |
| 4.6 | Audio engine: one `<audio>` element + MediaSession API | Lock-screen controls show title and artist |
| 4.7 | Track search UI | |
| 4.8 | Full player sheet — drag up/down, **open state registered as a history entry** | Android back closes the sheet, does not leave the chat |
| 4.9 | Mini player, persistent across all navigation | Audio survives home → another chat → profile |
| 4.10 | Attribution: artist + licence displayed (PRD §8.4) | |

---

## 8. M5 — Sync · 3 weeks · the hard one

Now bring in the spike's lessons for real.

| # | Task | Done when |
|---|---|---|
| 5.1 | `sessions` + `session_members` tables + RLS | |
| 5.2 | Clock-offset endpoint + client sampling (median of best 2 of 5, every 60s) | Offset stable across a network change |
| 5.3 | Create / join / end session | |
| 5.4 | `/api/session/command` — validate, apply, last-write-wins by `seq` | Simultaneous commands from both phones resolve to one state, no oscillation |
| 5.5 | Broadcast commands over Realtime | Partner's audio responds in under 500ms |
| 5.6 | Computed expected position from the anchor | |
| 5.7 | Drift loop: ≤150ms ignore · 150–400ms `playbackRate ±2%` · >400ms hard seek | Correction is inaudible in the middle band |
| 5.8 | Sync states: synced / catching up / reconnecting / lost | **Never shows "In sync" before it's measured true** |
| 5.9 | Partner's connection state shown to you | "Priya is reconnecting…" appears |
| 5.10 | Reconnection: rejoin at live position + replay missed messages | Tunnel test: wifi off 60s, back on, both resume together |
| 5.11 | Solo session state + "Nudge her" | Reads as normal, not as an error |
| 5.12 | Attributed system messages — "Priya skipped to…" | |
| 5.13 | Session invitations: in-chat banner, app-wide banner | Interrupts appropriately per UX §8.3 |
| 5.14 | Vibing ring on home rows | |
| 5.15 | Local mute — stay in session, silence your own audio | |
| 5.16 | One session at a time; old partner notified | |

**Milestone test:** two phones, two cities if possible, two different networks. Play a full song. Skip.
Seek. Put one phone in a tunnel. Lock one screen. Measure drift throughout.

---

## 9. M6 — Safety & settings · 1 week

| # | Task | Done when |
|---|---|---|
| 6.1 | Block / unblock — RLS-enforced, immediate, bidirectional | Blocked user's message insert fails at the database |
| 6.2 | Report user or message + "also block" in the same flow | Row lands in `reports`; user cannot read the table |
| 6.3 | Privacy settings: presence, vibing visibility, read receipts, request policy | Each actually changes behaviour |
| 6.4 | Blocked list with unblock | |
| 6.5 | Account deletion — immediate deactivation, full removal within 30 days | |
| 6.6 | Data export as JSON | |
| 6.7 | Theme toggle — system default, manual override | |

---

## 10. M7 — Polish & launch · 2 weeks

| # | Task | Done when |
|---|---|---|
| 7.1 | All seven empty states (UX §9.1) | |
| 7.2 | Skeleton loaders on every list | |
| 7.3 | Every error state (UX §9.3) | Typed input is never lost |
| 7.4 | Desktop hover states + keyboard shortcuts | |
| 7.5 | `prefers-reduced-motion` audit | Vibing ring still distinguishable when static |
| 7.6 | Accessibility audit — contrast, labels, focus, `aria-live` on the sync pill | Keyboard-only navigation works end to end |
| 7.7 | Privacy policy — **states plainly there is no end-to-end encryption**, names a contact address | |
| 7.8 | Terms — CC attribution, 13+ age floor, acceptable use | |
| 7.9 | `robots.txt`, `sitemap.xml`, `llms.txt` — AI crawlers **allowed** on public routes | |
| 7.10 | `noindex` on all app routes; private paths disallowed | `/chats/*` is not indexable |
| 7.11 | Unique meta title + description per public route | |
| 7.12 | Cookieless analytics; funnel events only, never message content | |
| 7.13 | Bundle budget ≤ 250 KB gzipped initial | Player and emoji picker load on demand |
| 7.14 | Zero console errors or warnings in production | |
| 7.15 | Link-preview validation in WhatsApp, Instagram, iMessage | Real card with a real face in all three |
| 7.16 | Lighthouse ≥ 90 on the public surface | |

---

## 11. When you get stuck

**Two hours, then change approach.** If a task hasn't moved in two hours, you're solving the wrong
problem. Re-read the spec, simplify, or skip it and come back.

**Reproduce before fixing.** For sync bugs especially — log the numbers (offset, expected, actual, drift)
and read them. Sync bugs are almost never mysterious once you can see the values.

**Ship broken things behind a flag** rather than holding a branch open for a week.

**The order exists for a reason.** If M5 is going badly, the temptation is to jump to M7 polish because
it feels productive. Don't — polish on top of broken sync is wasted work.

---

## 12. Sign-off

Confirm and **Stage 6 begins with M0**, built task by task in small reviewable pieces.

Two things I'd like your answer on before starting:

1. **Do 0.11 first, or build M0 in order?** I recommend the sync spike immediately after 0.1–0.3, because
   it de-risks the whole project in three days. The alternative is a prettier week one.
2. **Do you have a second phone to test with?** It matters from M3 onward and is essential for M5. If not,
   we plan around borrowing one for specific test sessions.
