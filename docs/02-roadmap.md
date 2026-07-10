# 02 · Roadmap & Checklist
### What exists now, and what's left to reach the end state (`01-end-goal.md`)

*Legend: ✅ done · 🟡 partial/stub · ⬜ not started · 🔒 blocked (MI300X pending)*

---

## Where we are: **Phase 0 complete** (deployable stub MVP)

The scaffold builds and runs end-to-end on a stub — deployable to a Space with zero backend.

### ✅ Done now
- ✅ Monorepo scaffold, root `Dockerfile` (Next standalone, port 7860), `README.md` Space config
- ✅ **Tier 1** Next.js app: `web/app/page.tsx`, components (`UrgencyCard`, `MatchFeed`,
  `AgentTrace`), Ani-branded `globals.css`, API routes `web/app/api/{grade,match}/route.ts`
- ✅ Stub inference contract (`web/lib/stub.ts` + `web/lib/types.ts`), Benguet/NCR-localized
- ✅ **Tier 2** FastAPI (`inference/main.py`) with swappable `stub` / `fireworks` / `mi300x`
  backends; seed price CSV (`inference/data/ncr_prices.csv`)
- ✅ **Tier 3** skeletons: `training/finetune_gemma_grader.py`, `serve_vllm.sh`,
  `receipts/ROCM_NOTES.md`
- ✅ `JUDGES_START_HERE.md`
- ✅ Static verification: JSON/config valid, Python compiles, stub logic smoke-tested

### 🟡 Needs one local action before trusting it
- 🟡 Run `cd web && npm install && npm run build` locally once (sandbox blocked the npm
  registry, so the production Next build is unverified)

---

## What's left, by phase

### Phase 1 — Ship the real UI + first deploy
- ⬜ Push to a Hugging Face **Docker** Space; confirm green build on port 7860
- ⬜ Port the exact mockup components (from `../initial_site/stitch_ani_smart_logistics_engine`)
  into Tier 1 for pixel-level polish
- ⬜ Localize maps to Benguet→NCR (Leaflet) if/when a map is added
- ⬜ Keep the Space `pinned` + public

### Phase 2 — Real grading via Fireworks
- ⬜ Add `FIREWORKS_API_KEY`; run Tier 2 with `ANI_BACKEND=fireworks`
- ⬜ Set the Space secret `INFERENCE_BASE_URL` → Tier 2; verify the card reflects the real photo
- ⬜ Extend `fireworks.grade()` to true multimodal (send the uploaded image)

### Phase 3 — Real data + real matching
- ⬜ Replace seed CSV with a live DA Bantay-Presyo / PSA pull
- ⬜ Upgrade `match()` from stub ranking to embeddings + rerank
- ⬜ Real SSE streaming in `AgentTrace` (replace the client-side simulation)

### Phase 4 — Polish + judge readiness
- ⬜ Tighten UX, empty/error states, example photos (click-to-try)
- ⬜ Finalize `JUDGES_START_HERE.md` + README
- ⬜ Draft the pitch deck (arc in `../ani-submission-framing.md`)

### Phase 5 — Swap to the MI300X 🔒 (blocked on AMD compute)
- 🔒 `vllm serve` fine-tuned Gemma on the card (`training/serve_vllm.sh`)
- 🔒 LoRA fine-tune the grader → before/after number (`training/finetune_gemma_grader.py`)
- 🔒 Expose via Cloudflare Tunnel; set `ANI_BACKEND=mi300x` + `ANI_BASE_URL`
- 🔒 Commit receipts to `training/receipts/` (rocm-smi, vLLM log, loss curve)
- **Swap cost: one env var. No UI/logic changes.**

### Phase 6 — Submit
- ⬜ Record ≤5-min video (≤300 MB, direct upload — no YouTube/Drive)
- ⬜ Dry-run from a clean clone; keep Space warm
- ⬜ Submit before the deadline; a thin Gradio fallback Space is the safety net

---

## Critical path & dependencies
Phase 1 → 2 → 3 can proceed **now** (no GPU needed). Phase 5 is the only MI300X-blocked
work and is designed to be a drop-in swap, so nothing else waits on it. Do UI + Fireworks +
real data while the card is pending; slot in the MI300X the moment it's live.

*See also: `01-end-goal.md`, `03-tier-architecture.md`, `../ani-nextjs-hfspaces-architecture.md`.*
