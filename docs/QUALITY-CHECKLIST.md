# MusiChat — Quality, SEO & Launch Checklist

**Stage 3.5 addendum · Version 1.0 · 15 September 2026**
**Depends on:** [PRD.md](./PRD.md) · [UX.md](./UX.md) · [DESIGN.md](./DESIGN.md)

Three checklists folded into the project: UI polish, production/SEO launch readiness, and the
anti-patterns to avoid. Every item is marked as already-specified, newly-added, or deliberately skipped.

---

## 0. The distinction everything depends on

MusiChat is not one website. It is **two surfaces with opposite requirements**, and most items below apply to only one of them.

| | **Public surface** | **App surface** |
|---|---|---|
| Routes | `/welcome`, `/invite/:code`, `/login`, `/signup`, `/privacy`, `/terms`, `/404` | `/chats`, `/chats/:id`, `/me`, `/friends/add`, everything behind auth |
| Crawlable | **Yes — must be** | **No — `noindex, nofollow`** |
| Needs SEO, OG tags, structured data | Yes | Never |
| Needs skeletons, toasts, empty states | Lightly | Heavily |
| Rendered | **Server-rendered** (see §1) | Client-rendered SPA is fine |

Indexing a private chat app is a privacy incident, not an SEO win. `/chats/*` and `/u/*` must carry
`noindex` and be disallowed in `robots.txt`.

---

## 1. The one item that changes the architecture

> **List 3, item 2: "viewsource empty."**

A client-only React SPA (Vite + React, no SSR) serves an empty `<div id="root">`. Crawlers and — critically —
**WhatsApp, Instagram, and iMessage link-preview bots do not run JavaScript.** They read the raw HTML and stop.

This collides directly with the product's most important flow. When Priya shares
`musichat.app/i/priya` into a WhatsApp chat, the preview card that renders is what decides whether her
friend taps. A client-rendered SPA produces either no card at all, or the same generic card for every
invite in the world.

**Requirement:** `/invite/:code` must be server-rendered with **per-invite Open Graph tags**:

```html
<meta property="og:title"    content="Priya wants to vibe with you">
<meta property="og:description" content="Chat and listen to the same song at the same moment.">
<meta property="og:image"    content="https://musichat.app/og/invite/priya.png">
<meta name="twitter:card"    content="summary_large_image">
```

The OG image should be **generated per inviter** — their avatar, their display name, the product mark.
A personal preview card converts dramatically better than a generic logo.

**Consequence for Stage 4:** this rules out a plain Vite + React SPA and pushes the stack toward a
framework with server rendering on the public routes. It does not change the app surface, which stays a
client-rendered PWA. I'll carry this into the Stage 4 recommendation rather than deciding it here.

**Treat the invite OG card as a product asset, not a checkbox.** It is the first thing anyone ever sees
of MusiChat, and it sits directly upstream of the PRD's primary metric (invite → join ≥ 40%).

---

## 2. List 1 — UI polish

| # | Item | Surface | Status |
|---|---|---|---|
| 1 | Dark mode toggle | Both | **Specified** — DESIGN §2. Dark-first, both themes tokenised. Toggle follows system by default with a manual override in Settings. |
| 2 | Cookie banner | Public | **Recommend skip** — see §5. Cookieless analytics means no consent banner is legally required, and a banner is pure friction. |
| 3 | Back-to-top button | Public only | **New** — on `/privacy` and `/terms` only. Meaningless in a bottom-anchored chat view. |
| 4 | Mobile menu | — | **Not applicable** — no tab bar and no hamburger by design (UX §3.1). Single-root navigation. |
| 5 | Keyboard shortcuts | App (desktop) | **New** — `/` search, `Esc` close player sheet, `Space` play/pause, `↑` edit last message, `Ctrl/⌘+K` jump to chat. Desktop is a real surface for a PWA. |
| 6 | Hover states | App (desktop) | **New** — DESIGN covers focus but not hover. Every interactive element needs a hover treatment at `--dur-fast`. |
| 7 | Custom scrollbar | Both | **New** — thin, `--ink-500` thumb on `--ink-800`. Default Windows scrollbars are visually loud against a dark ground. |
| 8 | Copy button | App | **Specified** — invite link copy, UX FR-F5. Must show a "Copied" toast, not a silent state change. |
| 9 | Skeleton loaders | App | **Specified** — UX §9.2, skeletons over spinners for all lists. |
| 10 | Sticky header | App | **Specified** — conversation header stays pinned; DESIGN §4. |
| 11 | Skip to content | Both | **New** — accessibility gap. Visually hidden link, revealed on focus. |
| 12 | Open Graph preview | Public | **New and critical** — see §1. |
| 13 | Empty states | App | **Specified** — UX §9.1, seven states inventoried. |
| 14 | Expandable FAQs | Public | **New** — on `/welcome` only. Three questions that actually block signup: *Is it free? Do I need Spotify? Can anyone find me?* Not decoration — these are the real objections. |
| 15 | Toast notifications | App | **Specified** — UX §8.3 interruption priority ladder. |
| 16 | Password visibility toggle | Public | **New** — gap. Show/hide on both signup and login. |

---

## 3. List 2 — production launch

| # | Item | Status |
|---|---|---|
| 1 | Custom 404 page | **New** — in the product's voice: *"This page isn't vibing."* with a route home. |
| 2 | Meta title per page | **New** — unique per route. App routes use `Priya · MusiChat`; public routes are descriptive. Never one shared title. |
| 3 | Meta description per page | **New** — public routes only. |
| 4 | CTA above the fold | **Specified** — `/welcome` and `/invite/:code` both lead with a single primary action (DESIGN screens 1 and 5). |
| 5 | Favicon set | **New** — gap. Full set: `favicon.ico`, 180px apple-touch-icon, 192/512 PWA icons, maskable icon, `site.webmanifest`. Required for PWA install anyway. |
| 6 | robots.txt | **New** — allow public routes, `Disallow: /chats/`, `/me/`, `/u/`. **Do not block AI crawlers** (list 3 item 13). |
| 7 | sitemap.xml | **New** — public routes only. Never enumerate user or invite URLs. |
| 8 | Open Graph image | **New and critical** — see §1. Per-inviter generated image plus a default site card. |
| 9 | Alt text on every image | **New** — user avatars use the person's display name; decorative gradients get `alt=""` and `aria-hidden`. |
| 10 | Mobile breakpoints | **Specified** — mobile-first throughout (PRD §9.2, §9.4). |
| 11 | Sticky mobile CTA | **Public only** — `/welcome` and `/invite/:code`. **Not** in the app, where the mini player owns the bottom edge (UX §4). |
| 12 | Loading states | **Specified** — UX §9.2. |
| 13 | Form error states | **Specified** — UX §9.3. Inline, specific, never a raw error code. |
| 14 | Thank you page | **Specified in effect** — the email verification holding screen (UX §6.1) is this, with resend and change-address escapes. |
| 15 | Privacy policy page | **New — real gap.** Required by the DPDP Act (PRD A5), by Google sign-in, and by app stores later. Must state plainly that chats are not end-to-end encrypted (PRD A4). |
| 16 | Terms and conditions | **New — real gap.** Must include the CC music attribution terms (PRD §8.4), the 13+ age floor (A7), and acceptable use. |
| 17 | Cookie banner | **Recommend skip** — see §5. |
| 18 | Analytics installed | **New** — choose a cookieless, privacy-respecting tool (Plausible or Umami). No Google Analytics: it triggers consent obligations and contradicts the PRD's privacy stance. Track funnel events only, never message content. |
| 19 | Real contact address | **New** — required for DPDP grievance-officer obligations and for app store listings. A support email plus a registered address on `/privacy`. |
| 20 | Compressed images | **Specified** — PRD FR-P3 client-side downsizing before upload. Extend to: WebP/AVIF, `loading="lazy"`, explicit width/height to prevent layout shift. |

---

## 4. List 3 — anti-patterns to avoid

| # | Anti-pattern | How we avoid it |
|---|---|---|
| 1 | `vercel.app` URL | **Deferred by decision** — shipping on the free subdomain during development and private beta. Mitigated by claiming the clean `musichat.vercel.app` alias and keeping the base URL in one env var (ARCHITECTURE §9.1). A real domain is required before inviting anyone outside your own circle. |
| 2 | Empty view-source | **§1.** Server-render the public surface. The single most consequential item on all three lists. |
| 3 | No 404 page | List 2 item 1. |
| 4 | Vite + React default browser tab | Set `<title>`, favicon, and manifest on day one of Stage 6, not at launch. |
| 5 | Same page titles | List 2 item 2 — unique per route. |
| 6 | No meta description | List 2 item 3. |
| 7 | No `og:image` | **§1.** |
| 8 | No structured data | JSON-LD `SoftwareApplication` on `/welcome`. **Not** on invite pages — publishing person-schema for a private user is a privacy leak. |
| 9 | Multiple H1 tags | Exactly one `<h1>` per page. |
| 10 | No H1 tags | Every page gets one, including app routes for screen-reader structure. |
| 11 | No canonical tag | Self-referencing canonical on every public page. |
| 12 | No `llms.txt` | Add `/llms.txt` describing what MusiChat is. Cheap, and increasingly how products get discovered. |
| 13 | AI blocked in robots.txt | **Deliberately allow AI crawlers** on public routes. Blocking them removes the app from AI-assisted discovery for no benefit. Private routes stay disallowed for everyone. |
| 14 | No favicon | List 2 item 5. |
| 15 | No sitemap.xml | List 2 item 7. |
| 16 | No `lang` attribute | `<html lang="en">`. Required for screen-reader pronunciation. |
| 17 | Missing alt text | List 2 item 9. |
| 18 | Exposed source maps | Disable in the production build, or upload privately to the error tracker. Shipped source maps hand over your entire codebase. |
| 19 | Console errors | Zero errors and zero warnings in production. Added to the Stage 7 test gate. |
| 20 | Massive JS bundles | **Specified** — PRD §9.2 caps the initial bundle at 250 KB gzipped. Route-level code splitting; the player and emoji picker load on demand. |

---

## 5. What I recommend skipping, and why

**Cookie banner (list 1 item 2, list 2 item 17).**

A consent banner is legally required only when you set non-essential cookies — advertising, cross-site
tracking, Google Analytics. MusiChat sets exactly one cookie: the authentication session, which is
strictly necessary and exempt under both GDPR and the DPDP Act.

So the honest sequence is: **choose cookieless analytics, and the banner requirement disappears.** Adding
a banner anyway means placing a friction layer on `/invite/:code` — the single highest-stakes screen in the
product — to satisfy an obligation you don't have.

A short, readable privacy policy is required. A consent wall is not.

**Landing-page conversion patterns in the app.** Sticky CTAs, above-the-fold hero CTAs, and expandable FAQs
belong on `/welcome` and `/invite/:code`. Inside the app they would fight the mini player for the bottom
edge and make a private messaging space feel like it's selling something.

---

## 6. Real gaps this exercise found

Items genuinely missing from Stages 1–3, now added to scope:

1. **Privacy policy and terms pages** — legally required, not previously scoped. Must disclose the absence of E2E encryption and carry the CC attribution terms.
2. **Per-invite Open Graph rendering** — architecturally significant, feeds directly into the primary success metric.
3. **Favicon and PWA icon set** — required for Home Screen install, which iOS web push depends on (PRD §9.4).
4. **Analytics decision** — was unspecified; now constrained to cookieless.
5. **Contact address and grievance officer** — DPDP obligation.
6. **Skip-to-content and password visibility** — accessibility and usability gaps.
7. **Desktop hover and keyboard shortcuts** — a PWA gets real desktop usage; DESIGN covered focus but not hover.
8. **Custom 404.**

---

## 7. Where each item gets built

| Stage | Picks up |
|---|---|
| **Stage 4** — Architecture | §1 server rendering decision; analytics choice; where OG images are generated |
| **Stage 5** — Plan | Every item above becomes a task with an owner and a milestone |
| **Stage 6** — Development | Favicon, manifest, titles, `lang`, and H1 structure on day one — not retrofitted |
| **Stage 7** — Testing | Zero console errors; Lighthouse ≥ 90 on the public surface; link-preview validation in WhatsApp, Instagram and iMessage; bundle-size gate |
| **Stage 8** — Deployment | Real domain; source maps disabled; robots.txt, sitemap.xml, llms.txt; legal pages live before the first invite is sent |
