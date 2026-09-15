# MusiChat — Design System Implementation Spec

**Stage 3 deliverable · Version 2.0 · 15 September 2026 — reconciled with the brand assets**
**Visual reference:** [design-system.html](./design-system.html)
**Brand assets:** [../assets/](../assets/)
**Depends on:** [PRD.md](./PRD.md) · [UX.md](./UX.md) · [QUALITY-CHECKLIST.md](./QUALITY-CHECKLIST.md)

This file is the contract. The HTML page shows what it looks like; this defines what gets built.

**Changed in v2:** palette re-derived from the supplied logo; display face changed from Fraunces to
Gabarito; accent tokens renamed to `--you-*` / `--them-*`.

---

## 1. The mark is the spec

The logo contains four decisions, and the system takes all of them:

| In the mark | Becomes |
|---|---|
| Cool figure on the left, warm figure on the right | **They are Azure, you are Rose** — matching where each person's messages sit in the thread |
| A music note between the two figures | Music is the thing that joins them, not a feature beside them |
| A gradient ring encircling both | `--together` — used only for live shared sessions |
| The ring is **broken**, with a gap | The solo and reconnecting states use a broken thread |
| The lower arc ends in a chat tail | The mark already carries a tail, so no bubble in the app needs one |

> **You are warm. They are cool. A live session renders in the arc between you.**

Three rules protect this. Breaking any one turns it back into ordinary styling:

1. **The ring gradient never decorates.** Live sessions only.
2. **Rose is never the other person**, on any device.
3. **Mint is never an accent.** Presence and vibing must never be confusable.

---

## 2. Tokens

Accents are named by **role, not colour** — you cannot accidentally use the wrong one.

```css
:root {
  /* ground — deep indigo, sits under both the blue and magenta ends */
  --ink-900: #0C0A1A;
  --ink-800: #141128;   /* app ground */
  --ink-700: #1D1936;   /* raised surface, cards */
  --ink-600: #272247;   /* inputs, overlays */
  --ink-500: #352E5C;   /* borders */

  --tx-hi:   #F2EFFB;
  --tx-mid:  #ADA5C8;
  --tx-lo:   #756D93;

  /* Rose — always the person holding the phone */
  --you-300: #FFB0D2;
  --you-400: #FF83B6;
  --you-500: #FF4F97;
  --you-600: #E02B78;

  /* Azure — always the other person */
  --them-300: #A9CCFF;
  --them-400: #6FA8FF;
  --them-500: #3B8DFF;
  --them-600: #2168E0;

  --coral-500: #FF8A45;   /* gradient terminus only — never standalone */

  --together: linear-gradient(100deg, #3B8DFF 0%, #A24DEE 40%, #FF4F97 74%, #FF8A45 100%);

  --online: #4FD6A4;      /* presence only */
  --warn:   #FFC24B;      /* reconnecting */
  --danger: #F94545;      /* destructive only */

  --r-sm: 8px; --r-md: 14px; --r-lg: 20px; --r-xl: 28px; --r-full: 999px;
  --dur-fast: 140ms; --dur-base: 220ms; --dur-slow: 380ms;
  --ease: cubic-bezier(.22, 1, .36, 1);
}

```

### Single theme, by choice

**v2.1 — the light theme is removed.** It existed as a mechanical inversion of
the dark tokens and was never designed. In practice it stripped the product's
entire identity: the system is *two lights in the dark*, and a glow cannot glow
on white. Users on a light OS were seeing a generic app that shared nothing but
hex values with the design above.

Committing to one visual world is a legitimate choice where the world is part
of the product — this one is nocturnal by definition. `color-scheme: dark` is
declared so browser chrome, form controls and scrollbars follow.

If a light theme returns, it gets designed rather than inverted: different
surface logic, accents darkened for contrast on a bright ground, and glow
replaced with something that reads as light rather than as a faded gradient.

### Depth

Three fixed radial washes sit behind everything at `z-index: -1` — azure top
left, rose top right, violet bottom. They do not scroll, and they are what stop
the app reading as a flat sheet of colour. Surfaces above them use
translucency plus `backdrop-blur` rather than opaque fills, so the ambient
light shows through.

**Spacing scale:** `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40`. Screen gutter is always 16. Use flex/grid `gap`.

**Why the hues shifted from the logo.** The mark runs at full saturation, which is correct for something
seen for two seconds and wrong for an interface read for two hours. The UI holds the brand's exact hue
positions and drops saturation one step. The logo itself always renders at full strength.

---

## 3. Typography

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Gabarito:wght@600;700&family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

```css
--font-display: "Gabarito", system-ui, sans-serif;
--font-ui: "Figtree", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
```

| Role | Face | Size / line-height | Weight | Where |
|---|---|---|---|---|
| Display L | Gabarito | 34 / 1.08, −0.03em | 700 | Empty-state and onboarding headlines |
| Display | Gabarito | 26 / 1.15, −0.025em | 700 | Player track title, headlines |
| Title | Figtree | 20 / 1.3, −0.01em | 750 | Screen titles |
| Body | Figtree | 15 / 1.45 | 400 | Everything readable |
| Message | Figtree | 13.5 / 1.4 | 400 | Chat bubbles |
| Label | Figtree | 13 / 1.4 | 550 | Form labels, settings rows |
| Caption | Figtree | 11, +0.13em, uppercase | 700 | Eyebrows, section markers |

**Gabarito constraints:** never below 20px, never on a control label. Roughly six places in the app.

**Why not the Fraunces serif from v1.** That pairing was chosen before the brand existed. The wordmark is a
heavy rounded geometric; an editorial serif fights it. Gabarito is geometric, friendly and slightly
unconventional — related to the wordmark without imitating it.

All timecodes, counters and durations use `font-variant-numeric: tabular-nums`.

---

## 4. Logo usage and the three missing assets

The supplied files work on light grounds at large sizes. The product is dark and mostly small.

| Gap | Why it matters | What to produce |
|---|---|---|
| **Dark-ground wordmark** | "Musi" is navy `#1A1A3E` and vanishes on `#141128`. Only "Chat" would show. | Knockout variant: "Musi" in `#F2EFFB`, gradient retained on "Chat". |
| **Simplified favicon mark** | At 16–32px the ring, two figures and note collapse into mush. The most common small-size branding failure. | A reduced mark — the note alone in gradient, or two bubbles without the ring. **Test at 16px before committing.** |
| **Maskable PWA icon** | Android crops to circles and squircles; a transparent edge-to-edge mark gets clipped. | 512×512, mark at 60% inside a solid `#141128` field, `purpose="maskable"` in the manifest. |

**Export set:** `favicon.ico` (16/32/48), `apple-touch-icon.png` (180), PWA 192 + 512, maskable 512,
Open Graph card 1200×630.

**Rules:** minimum wordmark width 96px — below that use the mark alone. Clear space on all sides equals
the height of the "M". Never recolour the mark, never place the full-colour mark on a mid-tone background,
never stretch or add effects.

---

## 5. Component specifications

### 5.1 Chat bubbles

- **No tails.** Radius `20px` on three corners; the corner nearest the sender drops to `6px`.
- **Yours:** `linear-gradient(135deg, rgba(255,79,151,.32), rgba(162,77,238,.2))`, border `rgba(255,79,151,.36)`, right-aligned.
- **Theirs:** `rgba(59,141,255,.17)`, border `rgba(59,141,255,.3)`, left-aligned.
- Max width 78%. Gap 7px between bubbles, 14px between speaker changes.
- Receipt text inside your bubble, 9.5px, `--you-300`.
- System messages centered, 11px `--tx-lo`, actor name in `--tx-mid` 700.

### 5.2 Vibing ring

The most important glanceable element in the app — it is what makes someone tap.

- `conic-gradient` through Azure → violet → Rose → coral and back, inset `-4px` behind the avatar, masked by a ground-coloured ring at `-1.5px`.
- `animation: spin 4.5s linear infinite`. **The only continuously rotating element in the product.**
- Under `prefers-reduced-motion` it becomes a static gradient ring — still visually distinct from a plain avatar, because it carries meaning.
- Vibing supersedes the online dot; they never appear together.

### 5.3 Mini player

- Floating card, `18px` radius, inset 10px, above content at the bottom.
- `rgba(39,34,71,.93)` with `backdrop-filter: blur(20px)`, 1px `--ink-500` border.
- **Progress is a 2px bar along the top edge filled with `--together`.** Progress and the relationship are the same object.
- Always reads **"Vibing with {partner}"** — the person you're listening *with*, never the chat you're in.
- Collapsible to an edge-docked bubble. **Not dismissible while a session is live.**
- 62px tall including padding; sits above the composer in a conversation.

### 5.4 Full player

A **drag-up sheet, never a route** (UX §4.1). Its open state is a history entry so back closes it.

- Grab handle 34×4px `--ink-500`.
- Artwork full-bleed square, `--r-xl`, dual-colour glow shadow.
- Eyebrow "NOW VIBING TOGETHER" in `--together` via `background-clip: text`. Solo uses `--tx-lo`, plain.
- Track title Gabarito 25px; artist 13px `--tx-mid`.
- Progress 3px, gradient fill, 9px thumb.
- Controls: 58px play with gradient fill and glow; skips 17px `--tx-mid`.
- **Pairing footer:** two 28px avatars joined by a 44px gradient thread, partner label and sync pill beneath. Their avatar sits left, yours right — matching the mark.

### 5.5 Session state → visual state

| State | Artwork | Progress | Thread | Label |
|---|---|---|---|---|
| Together | Full colour | Gradient | Solid gradient | "You + Priya" · In sync |
| Catching up | Full colour | Gradient | Solid gradient | Catching up… |
| Solo | `saturate(.48) brightness(.7)` | Rose only | Broken, partner at 32% | "Priya will join when she's around" |
| Reconnecting | `saturate(.7) brightness(.84)` | Gradient | Broken, partner at 45% | "Priya's connection dropped" · amber pill, blinking |

Solo is a **normal state, not an error.** Copy is warm, never apologetic.

### 5.6 Buttons

| Variant | Fill | Use |
|---|---|---|
| Primary | `--together`, white text, glow | One per screen |
| Quiet | `--ink-700` | Secondary of equal weight (Google sign-in) |
| Ghost | transparent, 1px `--ink-500` | Declining, alternatives |
| Skip | text only, `--tx-lo` | Never styled as a button — skipping must feel free |
| Destructive | `--danger` text; solid only on final confirm | Block, delete, end |

All `--r-full`, 13px vertical padding, 14.5px/750 text, minimum 44px tap target.

**Hover (desktop):** every interactive element brightens one step at `--dur-fast`. Rows get `--ink-700`.

---

## 6. Motion

Spent in exactly three places:

1. **The vibing ring** — 4.5s continuous spin. It must look alive; it's the prompt that starts sessions.
2. **The player sheet** — drag-to-dismiss, `--dur-slow` settle. The signature gesture.
3. **The sync moment** — the thread draws in and the artwork blooms once, ~600ms. The emotional peak, and the only earned celebration.

Everything else moves once at `--dur-fast`. One easing curve throughout.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

---

## 7. Accessibility

- **Colour never carries meaning alone.** Alignment, avatars and labels repeat every signal.
- Rose and Azure differ in lightness as well as hue — you/them survives colour-blindness.
- Body text on `--ink-800` measures 14.2:1. All text meets WCAG AA at its used size.
- **Coral fails text contrast and is never used alone** — gradient terminus only.
- Minimum tap target 44×44px.
- Focus ring on every interactive element: `box-shadow: 0 0 0 3px rgba(255,79,151,.18)` plus a 1px `--you-500` border.
- Skip-to-content link on every page, revealed on focus.
- Playback state announced to screen readers; sync pill is `aria-live="polite"`.
- Full keyboard navigation on desktop; space toggles play/pause.

---

## 8. Guardrails

| Never | Because |
|---|---|
| Use the ring gradient outside live sessions | It stops meaning "together" and the system collapses into styling |
| Let Rose represent the other person | Cross-device consistency is what makes the rule learnable without a tutorial |
| Use coral on its own | It fails contrast; it exists only as the gradient's warm terminus |
| Use mint for anything but online status | Presence and vibing must stay distinguishable at a glance |
| Set Gabarito below 20px or on a control | Display weight at small sizes reads as noise |
| Animate more than one thing continuously | Ambient motion everywhere feels cheap and drains battery in long sessions |
| Add bubble tails, envelope icons or vinyl records | Borrowed signifiers read as a WhatsApp/Spotify clone — and the mark already has a tail |
| Show "in sync" before it's true | The indicator is load-bearing; one lie and users stop believing it permanently |

---

## 9. Voice

- Warm and direct. Never cute at the expense of clarity.
- Second person, present tense. "Priya is vibing," not "User is currently listening."
- Controls say what happens. "Start vibing" produces "Vibing with Priya."
- Errors explain what broke and what to do. No apologies, never vague.
- Empty states are invitations, not voids.
- **"Vibing" means active shared listening and nothing else.** It is the product's one piece of vocabulary; applying it loosely destroys it.
