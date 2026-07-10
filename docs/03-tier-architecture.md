# 03 · Tier Architectures
### Each tier in detail — responsibility, files, I/O, current vs target state, and seams

*The system is three decoupled tiers. The only coupling is a tiny JSON contract
(`GradeCard`, `MatchResult`) and one env var (`INFERENCE_BASE_URL`). That decoupling is what
lets us build on a stub today and drop in the MI300X later with no rewrites.*

---

## Tier 1 — Web / UI

- **Responsibility:** the judge-facing product. Capture the harvest input, drive the agentic
  pipeline UX, render the grade card + buyer match feed.
- **Tech:** Next.js 15 (App Router) · React 19 · TypeScript · plain CSS design tokens ·
  Docker (standalone) on Hugging Face Spaces, port **7860**.
- **Key files:**
  - `web/app/page.tsx` — the hero flow (client component; state, pipeline orchestration)
  - `web/components/` — `UrgencyCard`, `MatchFeed`, `AgentTrace`
  - `web/app/api/grade/route.ts`, `web/app/api/match/route.ts` — **BFF proxy**
  - `web/lib/stub.ts`, `web/lib/types.ts` — built-in stub + the shared contract
  - `web/app/globals.css` — Ani "Digital Cultivation" tokens
  - root `Dockerfile`, `README.md` (Space YAML: `sdk: docker`, `app_port: 7860`)
- **Input → Output:** `{crop, quantityKg, photo?}` → renders `GradeCard` + `MatchResult`.
- **The seam (how it connects down):** the route handlers check `process.env.INFERENCE_BASE_URL`.
  If set → `fetch` Tier 2 server-side (keys hidden, no CORS). If unset or unreachable → return
  the built-in stub. **So Tier 1 never breaks, with or without a backend.**
- **Now:** stub-powered, deployable. **Target:** same UI, proxying to Tier 2 on the MI300X;
  mockup-level polish; real SSE streaming in `AgentTrace`.

---

## Tier 2 — Inference / Orchestration

- **Responsibility:** the agentic brain. Owns `/grade` (Agent A) and `/match` (Agent D), and
  hides *which* model backend is in use behind one stable interface.
- **Tech:** FastAPI · Uvicorn · OpenAI-compatible client (`openai` SDK) · Pydantic.
- **Key files:**
  - `inference/main.py` — the API (`/`, `/grade`, `/match`)
  - `inference/backends/__init__.py` — selects backend via `ANI_BACKEND`
  - `inference/backends/stub.py` — canned, mirrors `web/lib/stub.ts`
  - `inference/backends/fireworks.py` — real Gemma (Fireworks **or** MI300X; identical code)
  - `inference/data/ncr_prices.csv` — real NCR price seed
- **Input → Output:** `POST /grade {crop, quantity_kg}` → `GradeCard`;
  `POST /match {grade}` → `MatchResult`.
- **The three backends (chosen by `ANI_BACKEND`):**

  | value | what runs | when |
  |---|---|---|
  | `stub` | canned Benguet/NCR data, no network | now, zero cost |
  | `fireworks` | Gemma via Fireworks (OpenAI-compatible) | now, real output |
  | `mi300x` | **same client**, `ANI_BASE_URL` → your vLLM endpoint | showtime |
- **The seam (up):** Tier 1 reaches it at `INFERENCE_BASE_URL`. **(down):** it makes
  OpenAI-compatible calls to Tier 3; Fireworks↔MI300X differ only by `base_url` + model name.
- **Now:** runs locally in stub/fireworks. **Target:** runs **on the MI300X**, co-located with
  the models, with embeddings-based matching.

---

## Tier 3 — Models (AMD MI300X)

- **Responsibility:** host the intelligence. Serve the fine-tuned Gemma grader + reasoning +
  embeddings, and produce the fine-tune and the AMD receipts.
- **Tech:** vLLM on **ROCm** · MI300X (192 GB HBM3, `gfx942`) · PyTorch + TRL + PEFT (LoRA).
- **Key files:**
  - `training/serve_vllm.sh` — `vllm serve` the Gemma stack; logs → receipts
  - `training/finetune_gemma_grader.py` — LoRA fine-tune (the before/after number)
  - `training/requirements.txt` — ROCm-side deps
  - `training/receipts/ROCM_NOTES.md` — honest notes + the committed evidence
- **Input → Output:** OpenAI-compatible chat/vision requests → completions; offline: a LoRA
  adapter + training logs.
- **Why AMD is load-bearing:** 192 GB co-hosts grader + reasoning + embeddings on **one card**
  (an 80 GB H100 can't) → the on-prem, private, single-card story + the Gemma bonus.
- **The seam (up):** exposed over HTTPS (Cloudflare Tunnel); Tier 2 points `ANI_BASE_URL` at it.
- **Now:** skeletons only 🔒 (blocked on compute). **Target:** live vLLM endpoint + a
  fine-tuned adapter + committed receipts.

---

## How the seams line up (the whole point)

```
Tier 1 ──INFERENCE_BASE_URL──▶ Tier 2 ──ANI_BASE_URL (OpenAI-compat)──▶ Tier 3
 (stub if unset/unreachable)     (stub│fireworks│mi300x)                (vLLM on MI300X)
```

Two env vars are the only wiring. Flip them and the same code runs against a stub, a hosted
API, or the MI300X — which is exactly why Phase 5 is a swap, not a rebuild.

*See also: `04-system-overview.md`, `02-roadmap.md`, `../ani-nextjs-hfspaces-architecture.md`.*
