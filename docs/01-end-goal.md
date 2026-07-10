# 01 · End Goal (Backwards Thinking)
### What we expect to see at the very end of the project

*This is the "definition of done" for a **champion** submission. Everything in the roadmap
(`02-roadmap.md`) works backwards from this picture. If a task doesn't move us toward one of
these, it's a distraction.*

---

## The one-sentence end state

> A judge opens the Ani Space, uploads a photo of Benguet produce, and in seconds sees a
> **grade + spoilage-urgency score** and a **ranked list of NCR buyers with real prices** —
> all powered by a **fine-tuned Gemma model self-hosted on a single AMD MI300X**, with the
> evidence committed in the repo.

---

## What exists at the finish line (the artifacts)

1. **A live, judge-runnable demo** — the Next.js Space is public, warm, and works in one
   click, with `JUDGES_START_HERE.md` at the repo root.
2. **Real AI, on AMD** — the demo is wired (via `INFERENCE_BASE_URL`) to Tier 2, which calls
   a **fine-tuned Gemma grader served by vLLM on the MI300X**. Fireworks remains as the
   comparison baseline, not the star.
3. **A fine-tune with a number** — a LoRA-tuned grader that measurably beats base Gemma at
   produce grading; the before/after figure appears on the deck.
4. **Real data, no mocks** — grading reflects the actual uploaded photo; buyer prices come
   from real DA/PSA/Bantay-Presyo data seeded in `inference/data/`.
5. **Committed AMD receipts** — `training/receipts/` holds `rocm-smi.log`, `vllm_serve.log`,
   the training loss curve, and the memory-math ("192 GB ✅ / 80 GB ❌").
6. **A ≤5-min video** (≤300 MB, direct upload) + an **honest, quantitative pitch deck**
   following the winning arc (see `../ani-submission-framing.md`).
7. **A clean public MIT repo** — this monorepo, runnable from a fresh clone.

---

## What the judge experiences (the demo we're building toward)

1. Opens the Space → sees the Ani product UI (not a form).
2. Uploads a produce photo, sets quantity, presses **Grade & match**.
3. Watches the agentic pipeline stream: *Analyzing photo → Grading → Forecasting NCR demand
   → Ranking buyers*.
4. Gets an **Agent A** grade card (grade, quality, shelf-life, urgency 0–10, actionable
   suggestion) and an **Agent D** match feed (ranked NCR buyers, demand, ₱/kg, "Route First").
5. Reads `JUDGES_START_HERE.md` and sees the AMD story: the whole agentic stack runs on
   **one MI300X**, on-prem and private.

---

## Success criteria, mapped to the Track-3 rubric

| Judging criterion | What proves it at the end |
|---|---|
| **Creativity & originality** | Spoilage-urgency score orchestrating a produce marketplace; fine-tuned Gemma grader |
| **Product/market potential** | Real Benguet→NCR problem + numbers + named buyers (`../ani-submission-framing.md`) |
| **Completeness** | End-to-end demo runs from a clean clone; live Space |
| **Use of AMD platforms** | Fine-tuned Gemma **self-hosted on MI300X**, receipts committed — load-bearing, not cosmetic |
| **Gemma bonus** | Gemma on the MI300X + on-prem/privacy narrative → "Best AMD-Hosted Gemma Project" |

---

## Explicitly OUT of scope (so we stay focused)

The driver gig-feed, live delivery tracker, payments/earnings, and a real route optimizer are
**pitch-deck vision only**. We build **one** hero loop deep (photo → grade → match), not four
shallow ones. No Kubernetes, no K6 — they scored zero last round.

*See also: `../backwards-to-champion.md` (the strategy this doc distills), `02-roadmap.md`
(how we get here), `04-system-overview.md` (how the pieces connect).*
