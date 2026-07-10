---
name: ani-design-system
description: >
  Use whenever building, editing, or reviewing ANY Ani UI — Next.js/React components,
  pages, HTML, CSS, styling, layout, or visual polish for the AMD Hackathon submission.
  Enforces the "Organic-Editorial" design language (Highland Green + Harvest Gold,
  Poppins/Inter/JetBrains Mono, harvest gradient, signature harvest components) so every
  screen stays consistent with docs/ui/kitchensink.html. Trigger on: "build a component",
  "style this", "make the UI", "match the design", "polish the page", grade card, freshness
  meter, match feed, agent trace, dispatch, buttons, forms, badges, colors, fonts.
---

# Ani Design System

**Source of truth:** `docs/ui/kitchensink.html` — a live, complete reference of every token,
component, state, and animation. When anything here is ambiguous, open the kitchensink and
match it exactly. Never invent new colors, fonts, radii, or shadows.

## Design philosophy — "Organic-Editorial"
Warm, tactile, and alive. Things that are alive move and grow. The UI is calm and editorial
(generous space, confident type) but organic (paper grain, ripening gradients, spring motion).
It should feel unmistakably *Ani* and never like a generic SaaS dashboard.

## Non-negotiable rules
1. **Color:** lead with green, spark with gold. Green = brand/actions/structure. Gold =
   reserved for the single most valuable action or insight on a screen (never decorative).
   Cream is the canvas; white/paper for raised surfaces. Use `tokens.css` / `tokens.ts` — do
   not hardcode hex values in components.
2. **Type:** Poppins (display/headings, weight 600–800, tight tracking `-.03em`), Inter (body),
   JetBrains Mono (labels, numbers, prices, meta — always mono for ₱ prices and stats).
3. **Spacing:** 4pt scale (`--s-1`…`--s-10`). **Radii:** pill for buttons/chips, `lg`/`md` for
   cards. **Elevation:** `--e-1` rest, `--e-2` hover, `--e-3` overlays, `--e-gold` for gold CTAs.
4. **Motion:** reveal-on-scroll (rise 26px + fade, staggered), count-up numbers, ripening
   gradient, magnetic buttons, card tilt. Easing: `--ease-spring` entrances, `--ease-out`
   reveals, `--ease-io` loops. **Always** wrap motion in `prefers-reduced-motion: reduce`
   (see the kitchensink `<script>` and CSS — it already does this correctly).
5. **Accessibility:** white/cream-on-green and black-on-cream must stay WCAG AA. Keep the
   contrast; don't put gold text on cream for body copy.
6. **Buttons are pills** that spring on press (`:active{scale(.97)}`) and drift toward the
   cursor (`.magnetic`). Primary = green; `.gold` = the one hero action; `.secondary`/`.ghost`
   for the rest.

## How to build a new component
1. Reuse existing classes/patterns from `components.md` and the kitchensink first — most needs
   are already covered (grade card, freshness meter, match feed, agent trace, dispatch, stats,
   table, badges, chips, tags, forms, toast, modal, empty/loading states).
2. Pull every value from `tokens.ts` (React) or `tokens.css` (global). No magic numbers.
3. Match the kitchensink's class contract so styles compose (e.g. `.grade-card`, `.match`,
   `.pipe > .pstep`). Port the markup to a React component; keep the class names.
4. Numbers/prices → `.mono`. Status → `badge`/`tag`. Perishability → the harvest gradient.
5. Add `data-reveal` (+ `.d1`..`.d4` for stagger) to entrance elements; respect reduced motion.

## Signature "harvest" components (the brand's heart — use these, don't reinvent)
- **Grade card** (`.grade-card`) — photo + score badge + grade + AI suggestion.
- **Freshness meter** (`.fresh`) — spoilage clock; gradient fill green→gold as time runs out.
- **Demand-match feed** (`.match`) — ranked NCR buyers with mono ₱ price + fit badge + trend tag.
- **Agent trace** (`.pipe`/`.pstep`) — three models, one MI300X; animate done/active steps.
- **Dispatch route** (`.dispatch`) — dark-green card, dashed route line, most-perishable-first.
- **Stat** (`.stat`) — gradient count-up number + label + `SRC:` citation (put real sources here).

## Files in this skill
- `tokens.css` — canonical CSS custom properties. Import once globally.
- `tokens.ts` — the same tokens as a typed TS object for React inline styles / theming.
- `components.md` — the component catalog: class contract, structure, and React porting notes.

## Applying to the current scaffold
`web/app/globals.css` currently uses an older, simpler palette. To make the app match this
system, replace its `:root` with `tokens.css` and migrate components to the classes in
`components.md`. Do this before Phase 1 polish so nothing drifts.
