# Ani Component Catalog

The class contract for every component, so React components compose with the kitchensink CSS.
**Copy the CSS for a component from `docs/ui/kitchensink.html` (it's organized by section) and
keep the class names when porting to React.** Below: what each component is, its structure, and
usage rules.

## Layout & shell
- `.wrap` — max-width 1180px, centered, 32px side padding. Every section's content sits in one.
- `section.block` — 88px vertical padding, top border. `.sec-head` (eyebrow + h2 + p) opens it.
- `.eyebrow` — mono, uppercase, gold-deep, wide tracking. The "01 — Foundations" kicker.
- Grid helpers: `.grid` + `.g2`/`.g3`/`.g4` (collapse to 1 col < 900px). `.row` = flex wrap.
- `.panel` — the base card: paper bg, `--line` border, `--r-lg`, `--e-1`, 26px padding.
- `.subhead` — mono uppercase label inside panels.

## Buttons (`.btn`) — pills, spring on press, magnetic
- Variants: default (green) · `.secondary` (green outline) · `.gold` (the one hero action,
  carries `--e-gold`) · `.dark` · `.ghost` · `.icon` (round).
- Sizes: `.sm` / default / `.lg`. States: `:hover` lift, `:active` scale .97, `.is-disabled`,
  `.loading` (spinner). Effects: `.magnetic` (JS cursor pull), `.sheen` (light sweep).
- Rule: **one gold button per screen, max.** Arrow icon = `<span class="ico arrow">→</span>`
  (nudges on hover).

## Forms
- `.field` > `label` + control. Controls: `.input`, `.select`, `.textarea` — green focus ring
  (`box-shadow 0 0 0 4px rgba(20,102,59,.13)`). Error: add `.error` + `.help.err`.
- `.search` wraps an `.input` with a left `.ico`.
- `.check` (checkbox, self-drawing SVG tick) / `.check.radio` / `.toggle` / `.slider`.
- `.drop` — the harvest photo upload zone; gets the most personality (leaf icon, hover lift).
  This is where the farmer's photo enters Ani.

## Status: badges, chips, tags
- `.badge` variants: `.grade` (leaf, display font — "Grade A"), `.green`, `.gold`, `.soft`,
  `.ok`, `.warn`, `.danger`. Add `.live` + `<span class="d">` for a pulsing dot.
- `.chip` — filter pills; `.active` = green filled. `.x` = removable.
- `.tag` (price trends): `.surging` (red), `.rising` (gold), `.stable` (gray), `.first` (gold
  star — "First match"). Always pair a trend tag with the mono price.

## Signature harvest components
- **Grade card** `.grade-card` > `.grade-photo` (has a `.badge.live` "graded on MI300X") +
  `.grade-body` > `.grade-head` (`.grade-score` .num/.cap + title with `.badge.grade`) +
  `.suggestion` (italic, green-wash, left leaf border). Add `.tilt` for the 3D hover.
- **Freshness meter** `.fresh` > `.top` (subhead + `.win` big gold number) + `.fresh-meter`
  > `.val[data-fill="72"]` (gradient fill = spoilage clock) + `.ticks` (Fresh→Spoil).
- **Demand-match feed** `.match` (repeatable) > `.top` (`.nm` + mono `.price`) + `.sub` +
  `.meta` (trend tag + fit `.badge`). Hover slides right 4px. Rank best-fit first.
- **Agent trace** `.pipe` > `.pstep[data-step]` > `.rail`(`.node`) + `.txt`(`.h`/`.d`/`.stat`).
  JS toggles `.active`→`.done` down the rail. Copy `runPipe()` from the kitchensink for the
  animated three-model trace; in React, drive `.active/.done` from state instead.
- **Dispatch route** `.dispatch` (dark green, radial gold glow) > eyebrow + h3 + `.route`
  (`.stop` — `.dline` dashed w/ 🚚 — `.stop`) + badges. "Most-perishable first."

## Data viz
- `.stat` — big gradient count-up `.n[data-count][data-suffix][data-prefix]` + `.l` label +
  `.src` (mono, gold — **put the real citation here**, e.g. "SRC: DA · FAO research").
- `.bars` > `.bar-row` (`.lbl` + `.bar-track > .bf[data-w]`) — before/after comparisons.
- `.table-wrap > table` — mono uppercase `thead`, zebra hover in green-wash. Prices in `.mono`.

## Overlays & states
- `.toast` (host `.toast-host`, JS `fireToast(msg)`), `.modal-scrim > .modal` (spring in),
  `.tip > .bubble` (hover tooltip — how Ani explains AI without a glossary).
- Loading: `.skeleton`, `.spinner`, `.leaf-loader` (spinning leaf mark), `.progress > .pf`.
- `.empty` — dashed, floating emoji + headline + hint ("No harvests yet · Snap a photo").

## Motion (from the kitchensink `<script>` — reuse it)
`IntersectionObserver` reveals (`[data-reveal]` + `.in`, stagger `.d1`..`.d4`), count-up numbers
(`[data-count]`), fill-on-view (`[data-w]`/`[data-fill]`), magnetic buttons, card tilt+glow,
hero node-network canvas. **All gated behind `prefers-reduced-motion: reduce`.** In React,
prefer state-driven equivalents (e.g. an `useInView` hook) but keep the same easing tokens and
the reduced-motion guard.

## The brand mark
The Node-Leaf SVG `<symbol id="leaf">` lives at the top of the kitchensink `<body>`. Reuse it
via `<svg><use href="#leaf"/></svg>` (inline the symbol once per document / as a React SVG
component). It layers a leaf silhouette + node-network + a small mountain (Benguet highlands).
