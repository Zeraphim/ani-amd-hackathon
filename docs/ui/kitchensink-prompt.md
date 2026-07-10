# Kitchen-Sink Generation Prompt (reusable)

A parameterized prompt for regenerating a full UI design-language "kitchen sink" for any
brand/product. Fill the `{...}` placeholders. Below the prompt is a list of things worth
including that you might not think to ask for, with justifications.

---

## The prompt

> **Role:** You're a senior product designer + front-end engineer. I want a single
> self-contained `kitchensink.html` that documents the entire UI design language for
> **{PRODUCT}** — every token, component, state, and animation — as the visual reference
> for our {CONTEXT, e.g. hackathon submission site / marketing site / product}.
>
> **Before writing any code:**
> 1. Read my brand + product context first: `{PATHS to brand book, existing CSS/tokens,
>    positioning docs}`. Summarize the visual identity back to me and **flag any conflicts**
>    (e.g. two palettes, mismatched type scales) instead of silently picking one.
> 2. Then **grill me with multiple-choice questions** before building — at minimum:
>    (a) aesthetic direction, (b) which surface this documents (marketing / product / both),
>    (c) motion intensity, (d) component scope. For each, recommend the option that makes us
>    **stand out from the median** and say why.
>
> **Design intent:** Deviate from the safe/default look. Commit to an outlier aesthetic that
> still unmistakably reads as {BRAND}. Give the system at least one **signature interaction**
> tied directly to our brand concept ({BRAND METAPHOR, e.g. "harvest / growth"}).
>
> **Must include, as a numbered, navigable page:**
> - Foundations: color tokens (click-to-copy), gradients, type scale, spacing, radius,
>   elevation, motion/easing tokens.
> - Atoms → molecules: buttons (all variants/sizes/states incl. loading + disabled),
>   forms (input, select, checkbox, radio, toggle, slider, file upload, validation/error),
>   badges/chips/tags, cards, tables.
> - **Domain-specific components** unique to {PRODUCT}: `{list your real components}`.
> - Patterns & states: nav, hero, overlays (modal/toast/tooltip), and **loading + empty +
>   error states** for the key components.
> - A short motion-principles section explaining the "why" behind the animation.
>
> **Constraints:** One HTML file, no build step, CDN fonts only, no heavy JS libraries.
> Use CSS custom properties for every token so the file doubles as a dev spec. Real domain
> copy, not lorem ipsum. WCAG AA contrast, visible keyboard focus states, and honor
> `prefers-reduced-motion`.
>
> **When done:** verify it — syntax-check the JS, confirm tags balance, open it in a browser,
> screenshot it, and check the console for errors. Report what you couldn't verify.

---

## Additions you didn't ask for — and why to keep them

- **Accessibility (WCAG AA, `focus-visible`, `prefers-reduced-motion`).** Cheap credibility
  with judges; motion-heavy sites read as broken to some users without a reduced-motion path.
- **Loading / empty / error states per component.** These are the states real products live
  in and the ones most often forgotten. Including them signals system maturity, not a
  happy-path demo.
- **Tokens as CSS custom properties + click-to-copy.** Turns the showcase into a usable dev
  handoff spec — a working artifact your team builds from, not a throwaway.
- **Conflict-flagging up front.** If your repo has disagreeing palettes/scales, surfacing
  that early stops the whole system inheriting a wrong guess.
- **Real domain copy over lorem ipsum.** For a pitch, the sink itself becomes a persuasion
  surface while it demos components.
- **Portability constraints (single file, no build, CDN only).** It must open instantly on a
  stranger's laptop during judging; a build step or missing dependency is a silent failure.
- **A mandated "signature interaction" tied to the brand metaphor.** "Make it stand out" is
  unactionable; anchoring novelty to the core concept keeps wow-factor on-brand.
- **A built-in verification step.** Forces the model to actually check rather than claim it
  works; catches broken JS and console errors before you find them live.

### Optional, scope-dependent
- **Dark / "ops" theme toggle** — shows range and future-proofs the tokens.
- **Explicit responsive breakpoints** — call out mobile vs desktop (users on phones, judges
  on laptops).
- **Per-component do/don't usage notes** — keeps a team consistent as the system grows.
