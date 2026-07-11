# 02 · Roadmap & Checklist

Status is reconciled against the current repository, committed-style receipts, the
production build, and live MI300X checks. Run `.agents/skills/ani-roadmap-checks/scripts/update_checks.py --check`
before changing these markers.

Legend: `[x]` verified complete · `[ ]` not proven/remaining · `[~]` partial or formally waived.

## Current champion path

The original Fireworks prerequisite is formally waived by Decision E1 in
[`docs/06-execution-plan.md`](06-execution-plan.md): the available account cannot serve the
required Gemma 3 endpoint. The selected path is Vercel → named Cloudflare Tunnel → FastAPI →
tuned Gemma 3 on the MI300X.

Verified now:

- [x] GitHub repository is public.
- [x] Production Next.js build succeeds.
- [x] MI300X `gfx942` and vLLM Gemma 3 vision receipts exist.
- [x] Named tunnel and FastAPI return `backend: mi300x`.
- [x] Production photo request returns HTTP 200 with `source: mi300x`.
- [x] LoRA evaluation improves 86.67% → 100% on the 30-image held-out slice.
- [x] B8 notes document memory math and failure modes.

Evidence: [`training/receipts/ROCM_NOTES.md`](../training/receipts/ROCM_NOTES.md),
[`training/receipts/b7_metrics.json`](../training/receipts/b7_metrics.json), and the live
demo at <https://ani-amd-hackathon.vercel.app>.

## Phase 0 — Stub MVP

- [x] Monorepo scaffold, Dockerfile, README Space metadata, and Tier 1 Next.js app.
- [x] Stub inference contract and Benguet/NCR-localized fallback.
- [x] FastAPI with `stub` / `fireworks` / `mi300x` backend dispatch.
- [x] Static verification and production build.

## Phase 1 — UI and deployment

- [x] A1: Make `Zeraphim/ani-amd-hackathon` public.
- [x] A3: Build the `web` Next.js application successfully.
- [x] B6 assembly target: production Vercel deployment points at the MI300X API.
- [ ] Push to a Hugging Face Docker Space.
- [ ] Port superseded `initial_site/` mockups (cut-list item; intentionally not planned).
- [ ] Add or change map implementation beyond the current showcase.

## Phase 2 — Fireworks grading

- [x] Implement the multimodal OpenAI-compatible payload and Gemma 3 model default in
  `inference/backends/fireworks.py`.
- [~] Live Fireworks Gemma grading: formally waived under Decision E1 because the account
  exposes no accessible Gemma endpoint; do not claim `source: fireworks`.

## Phase 3 — Real data and matching

- [ ] Replace seed prices with a dated DA Bantay-Presyo / PSA pull.
- [ ] Wire `ncr_prices.csv` into buyer matching.
- [ ] Promote LangGraph embeddings/rerank over real buyer data.
- [ ] Replace staged client reveal with real SSE (cut-list item; intentionally not planned).

## Phase 4 — Judge readiness

- [x] Sample photos and the production Grade & match flow are present.
- [ ] Update `JUDGES_START_HERE.md` with the live URL and committed receipt links.
- [ ] Clean README’s stale Space/Fireworks wording and personal-tag lines.
- [ ] Draft the pitch deck with MI300X memory math and base→tuned table.

## Phase 5 — MI300X load-bearing path

- [x] B1/B2/B3: ROCm `gfx942`; Gemma 3 multimodal vLLM loads on MI300X.
- [x] B4/B5: named Cloudflare tunnel and FastAPI return real `source: mi300x` grades.
- [x] B6: Vercel production request reaches the MI300X path.
- [x] B7: one-epoch multimodal LoRA fine-tune, held-out comparison, and vLLM adapter serving.
- [x] B8: ROCm notes, receipts, memory math, and failure log completed.

## Phase 6 — Submission assembly

- [ ] Commit and push the feature work, then merge it into `main` (S1).
- [ ] Perform the manual incognito dry-run and update judge-facing docs (S2/S5/S6).
- [ ] Record the ≤5-minute submission video.
- [ ] Submit before the deadline.
- [ ] Destroy the MI300X only after the judging window ends.
