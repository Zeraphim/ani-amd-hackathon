# 04 · System Overview
### How the three tiers connect — the big picture

*Read this first for the mental model, then `03-tier-architecture.md` for the detail.*

---

## The whole system in one diagram

```
                        JUDGE / FARMER (browser)
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│ TIER 1 · WEB/UI     Next.js on HF Space (Docker, port 7860)     │
│  page.tsx → /api/grade, /api/match  (BFF: hides keys, no CORS)  │
└───────────────┬─────────────────────────────────────────────────┘
                │  INFERENCE_BASE_URL  (HTTPS; stub if unset/unreachable)
                ▼
┌───────────────────────────────────────────────────────────────┐
│ TIER 2 · INFERENCE  FastAPI /grade /match                       │
│  ANI_BACKEND = stub │ fireworks │ mi300x                        │
└───────────────┬─────────────────────────────────────────────────┘
                │  ANI_BASE_URL  (OpenAI-compatible calls)
                ▼
┌───────────────────────────────────────────────────────────────┐
│ TIER 3 · MODELS     vLLM on AMD MI300X (192 GB, ROCm)           │
│  fine-tuned Gemma grader + reasoning + embeddings (one card)    │
└───────────────────────────────────────────────────────────────┘
```

At showtime, **Tiers 2 and 3 live together on the one MI300X** — that co-location *is* the
champion narrative: "the entire agentic stack runs privately on a single AMD card."

---

## One request, end to end

1. Farmer submits `{crop, quantityKg, photo}` in Tier 1.
2. `page.tsx` calls `/api/grade`; the route handler proxies to Tier 2 (or stubs).
3. Tier 2 `/grade` (Agent A) calls Tier 3's Gemma vision model → returns a `GradeCard`
   (grade, shelf-life, **urgency**).
4. Tier 1 calls `/api/match`; Tier 2 `/match` (Agent D) ranks NCR buyers on real prices →
   `MatchResult`.
5. Tier 1 renders the urgency card + ranked buyer feed. The urgency score is the thread that
   drives the whole marketplace.

---

## The two ideas that make it all work

**1. A tiny shared contract.** Every tier speaks the same JSON shapes (`GradeCard`,
`MatchResult` in `web/lib/types.ts`, mirrored in `inference/`). Nobody needs to know how the
other tier produces them.

**2. Two env vars are the only wiring.**
- `INFERENCE_BASE_URL` (Tier 1 → Tier 2): unset = built-in stub; set = real backend.
- `ANI_BACKEND` + `ANI_BASE_URL` (Tier 2 → Tier 3): `stub` → `fireworks` → `mi300x`.

Because Fireworks and vLLM-on-MI300X are both OpenAI-compatible, moving from a hosted API to
the AMD card is a `base_url` change — **not a rewrite**. Every layer degrades gracefully to a
stub, so the demo never hard-fails in front of a judge.

---

## Deployment topology

| Tier | Deployed to | Now | Showtime |
|---|---|---|---|
| 1 | Hugging Face Space (Docker) | stub-powered, live | proxying to Tier 2 |
| 2 | local box → **MI300X** | stub / Fireworks | on the MI300X |
| 3 | AMD Developer Cloud **MI300X** | 🔒 skeleton | vLLM + fine-tune + receipts |

Tier 3 is exposed over HTTPS (Cloudflare Tunnel); Tier 1→2→3 calls are all server-side, so
API keys and the GPU endpoint never touch the browser.

---

## How this ladders to the end goal

The architecture is deliberately shaped so that the **hard, scored part** (a fine-tuned Gemma
model, self-hosted and load-bearing on the MI300X) is isolated in Tier 3 and swapped in via one
variable — letting us build and polish Tiers 1–2 *now*, on a stub, without waiting on compute.
That's the backwards-thinking bet: de-risk everything that doesn't need the GPU, so when the
MI300X arrives, the only work left is the work that actually wins.

*See also: `01-end-goal.md`, `02-roadmap.md`, `03-tier-architecture.md`.*
