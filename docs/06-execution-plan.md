# 06 · July 11 Execution Plan — Locked Champion Path

*Deadline: today, July 11, 6:00 PM CET. This is the time-boxed, three-track plan the team
locks to. Every task in this doc traces to the end goal (`01-end-goal.md`) and the champion
thesis (`../backwards-to-champion.md`). The long-form roadmap is `02-roadmap.md` — this doc
is the operational schedule for today only.*

---

## 0. Confirmed inputs

| Input | Value | Impact |
|---|---|---|
| MI300X | Instance ready now, plenty of $100 credit | Champion path GO |
| Time | 3+ people, 8+ hours before deadline | All three tracks in parallel |
| Fireworks | API key present, but the account catalog exposes no Gemma models; Gemma 3 27B/12B return `404 NOT_FOUND` | A6 Fireworks prerequisite is formally waived by Decision E1 below |
| Tier 1 deploy | Vercel (Root Directory `web`) | Fast, no Docker build risk |

---

## 1. The one invariant — Gemma 3 everywhere

**Both Fireworks *and* the self-hosted MI300X grader must call a Gemma 3 multimodal VLM.**
The $2,000 "Best AMD-Hosted Gemma Project" bonus and the on-prem-privacy pitch both hinge on
Gemma being the model that grades, not minimax-m3 or any non-Gemma fallback.

### Decision E1 — Fireworks prerequisite exception (2026-07-11)

The original plan assumed Fireworks exposed a deployable multimodal Gemma 3 endpoint. Live
account checks disproved that assumption: the account model catalog contains no Gemma model,
and both `accounts/fireworks/models/gemma-3-27b-it` and `gemma-3-12b-it` return
`404 NOT_FOUND`. The public Fireworks catalog also classifies Gemma 3 27B as an LLM rather
than a vision model.

**Approved decision:** waive A6's Fireworks dry-run prerequisite and proceed from the
verified B5 public MI300X Tier 2 directly to B6. This exception does not weaken the model
invariant at the judging path: uploaded photos are graded by `google/gemma-3-27b-it` on the
MI300X, and the response must say `source: mi300x`. The Fireworks backend remains as an
optional, contract-compatible adapter with truthful stub fallback; it must not be presented
as a working submission path unless an accessible multimodal Gemma deployment is added.

Alternatives considered:

| Alternative | Benefit | Tradeoff / reason not selected |
|---|---|---|
| Create a private Fireworks Gemma 3 deployment | Preserves the original A6→B6 sequence and cloud failover | Requires model upload/deployment access, billing, warm-up time, and a second large-model path on submission day |
| Use a currently available non-Gemma Fireworks vision model | Fastest cloud fallback | Breaks the Gemma invariant and weakens eligibility for the AMD-hosted Gemma bonus |
| Use text-only Gemma plus a separate image captioner | Retains a Gemma reasoning step | The grader is no longer end-to-end Gemma multimodal, adds latency and another failure surface, and the current account exposes no Gemma endpoint anyway |
| Use the verified MI300X endpoint directly **(selected)** | Strongest AMD load-bearing story; already passes a real public image request | Loses Fireworks provider redundancy; mitigated by a named tunnel, protected vLLM endpoint, and the non-negotiable web/Tier-2 stub fallback |

Three code edits this invariant requires (can be split across tracks):

| # | File | What changes | Handled by |
|---|---|---|---|
| I1 | `inference/backends/fireworks.py` `grade()` | Accept `image_data`, send base64 image in multimodal call, model → Gemma 3 VLM id | Track A |
| I2 | `inference/backends/langgraph_backend.py` `harvest_grader_node` | `model=` → Gemma 3 VLM id instead of `minimax-m3` | Track A or C |
| I3 | `training/serve_vllm.sh` + `finetune_gemma_grader.py` | Default model → Gemma 3 VLM (not Gemma-2-9b-it) | Track B |

---

## 2. Three parallel tracks

### Track A — Live demo + real Gemma + deck + video
*Owner: web/Vercel. First action wins the day — start here.*

| # | Task | Exit criterion | Receipt |
|---|---|---|---|
| A1 | `gh repo edit Zeraphim/ani-amd-hackathon --visibility public` | Repo shows Public | — |
| A2 | Fast-forward `main` to `origin/v1.1`; `git push origin main` | `main` HEAD = `85f86f2` (or later if B/C commits go on top) | — |
| A3 | `cd web && npm install && npm run build` — **CRITICAL: the production build is currently unverified — no `BUILD_ID` exists** | `.next/BUILD_ID` exists; standalone server boots on port 7860 | — |
| A4 | Edit `inference/backends/fireworks.py` `grade()` → multimodal Gemma 3: accept `image_data` param, send base64 image, model → Gemma 3 VLM id | `/process` returns real Gemma grade from an uploaded photo with `source: fireworks` | — |
| A5 | Deploy Tier 2 on Railway/Render: root dir `inference`, `ANI_BACKEND=fireworks`, `FIREWORKS_API_KEY=<key>`, `uvicorn main:app --host 0.0.0.0 --port $PORT` | `GET /` → `{"ok":true,"backend":"fireworks"}` | — |
| A6 | **Waived by Decision E1:** Fireworks Gemma 3 is unavailable to the account. Preserve the deployed Tier 1 and stub fallback; do not claim a Fireworks result. | Decision E1 records direct API evidence and the approved exception | — |
| A7 | Full dry-run from incognito: pick crop → sample photo → Grade & match → all panels populate → map animates La Trinidad→NCR | All panels render; no console errors; `source` = `fireworks` | — |
| A8 | Draft pitch deck from `../ani-submission-framing.md`'s 8-slide arc. Include memory-math table, before/after grading table (fill from Track B), TAM/SAM, "what didn't work." | Deck file in repo root or `docs/` | — |
| A9 | Record ≤5-min video (≤300 MB, direct upload — no YouTube/Drive). Show live demo + headline numbers + emotional close ("runs on the farmer's own phone"). | One video file committed or ready for direct upload | — |

### Track B — Make the MI300X load-bearing
*Owner: AMD Dev Cloud. This is the champion move — the entire agentic stack self-hosted on one card.*

| # | Task | Exit criterion | Receipt |
|---|---|---|---|
| B1 | SSH into MI300X. Run `rocm-smi | tee receipts/rocm-smi.log`. Note `gfx942`. | committed `rocm-smi.log` | ✅ receipt 1 |
| B2 | **Gate:** verify vLLM-ROCm supports Gemma 3 multimodal vision inference. `pip install vllm` (ROCm build), dry-run model load. | Model loads without fatal error. If blocked: fall back to text-only grader on MI300X + keep multimodal on Fireworks. | — |
| B3 | `vllm serve <gemma-3-vlm> --dtype bfloat16 --max-model-len 8192 --host 0.0.0.0 --port 8001 2>&1 | tee receipts/vllm_serve.log` | non-fatal startup; `gfx942` visible in log | ✅ receipt 2 |
| B4 | Set up Cloudflare **named** tunnel (not quick-tunnel — quick-tunnel URLs are ephemeral and reset on restart) → stable public HTTPS endpoint pointing to `localhost:8001` | `curl <tunnel-url>/v1/models` from external machine returns 200 | — |
| B5 | On the MI300X: `ANI_BACKEND=mi300x ANI_BASE_URL=http://localhost:8001/v1 ANI_MODEL=<gemma-3-vlm> uvicorn inference.main:app --host 0.0.0.0 --port 8000` then tunnel port 8000 (or nginx proxy both). Confirm `/process` returns `source: mi300x`. | Real Gemma grade from the card; `source: mi300x` in response | — |
| B6 | After A6 completes **or Decision E1 is recorded**, repaint Vercel `INFERENCE_BASE_URL` → Cloudflare tunnel URL (pointing at Tier 2 on MI300X). Redeploy. | Live Vercel demo backed by the MI300X; `source: mi300x` in network tab | — |
| B7 | **STRETCH (only if B1–B6 stable with ≥3 hrs buffer):** Assemble 150–300 labeled produce photos (grab a public produce-grading dataset — do NOT hand-label from scratch today). Write `data/produce_grades.jsonl`. Run **1-epoch** LoRA fine-tune (`finetune_gemma_grader.py --epochs 1`). Compute base-vs-tuned grading accuracy on a held-out slice. Serve the adapter via vLLM `--lora-modules`. | committed `train.log` + loss curve + a base→tuned % number in the deck | ✅ receipt 3 |
| B8 | Fill `training/receipts/ROCM_NOTES.md` honestly: instance specs, version pins, memory-math line (co-hosting grader + reasoning + embeddings ≈ X GB → MI300X 192 GB ✅ / H100 80 GB ❌), and an honest "what didn't work" beat. | committed; all checkboxes checked | ✅ |

### Track C — Real data, no mocks
*Owner: data/Python. Low dependency — run in parallel with A and B.*

| # | Task | Exit criterion | Receipt |
|---|---|---|---|
| C1 | Scrape DA Bantay-Presyo / PSA OpenSTAT / Kadiwa for pechay, cabbage, carrots, broccoli (NCR retail/wholesale prices). | `inference/data/ncr_prices.csv` updated with real rows + `# source: DA Bantay-Presyo, retrieved <date>` header | — |
| C2 | **Wire `ncr_prices.csv` into the matching pipeline.** Currently this file is loaded by **no code** — it exists as a seed but `match()` in all backends uses hardcoded buyer prices from `buyers.json`. Wire it so `MatchResult.pricePerKg` traces to the real CSV. | `source: DA Bantay-Presyo` traceable from the demo response; price changes when CSV is updated | — |
| C3 | Promote LangGraph embeddings (`inference/backends/langgraph_backend.py`) onto the real buyers+prices so the default `match()` path is embeddings-based, not the stub ranking. | `/match` returns cosine-ranked buyers over real data + real prices | — |
| C4 | (Optional) Retarget LangGraph grader node to Gemma 3 VLM per invariant I2 if not already done by Track A. | LangGraph grader uses Gemma 3, not minimax-m3 | — |

---

## 3. End-to-end connectivity contract

*Every dev must preserve these interfaces so the three tracks compose without last-minute
integration hell. Any edit that breaks a contract item below is a hard block.*

### 3.1 Shared JSON shapes (single source: `web/lib/types.ts`)

```typescript
// GradeCard  — returned by /grade and /process (Agent A, grader node)
interface GradeCard {
  cropId: string       // slug, e.g. "pechay"
  crop: string         // display name
  grade: string        // "A" | "B" | "C"
  score: number        // 0–100
  ripeness: string     // short description
  shelfLifeHours: number
  freshnessWindow: string  // e.g. "2 days"
  freshnessFill: number    // 0–100, for the meter bar
  urgency: string      // "high" | "mid" | "low"
  suggestion: string   // one actionable sentence
  source: string       // "stub" | "fireworks" | "mi300x" | "langgraph"
}

// MatchResult  — returned by /match and /process (Agent D, oracle node)
interface MatchResult {
  buyers: BuyerMatch[]
  dispatch: Dispatch
  source: string       // "stub" | "fireworks" | "mi300x" | "langgraph"
}

interface BuyerMatch {
  buyer: string        // name
  sub: string          // location + needs detail
  pricePerKg: number   // MUST trace to real DA/PSA after Track C
  trend: string        // "Surging" | "Rising" | "Stable"
  fit: string          // e.g. "96% fit"
  first: boolean       // true for the #1 recommendation
}

interface Dispatch {
  to: string           // destination city/market
  eta: string          // e.g. "6h · ₱44/kg"
  load: string         // e.g. "1.2t matched"
}
```

**Rules:**
- These shapes are mirrored in `web/lib/types.ts` (TS) and `inference/backends/stub.py` (Python). Both must stay in sync.
- No field may be renamed, retyped, or removed without updating both sides AND the contract here.
- Every backend (`stub`, `fireworks`, `mi300x`, `langgraph`) must return an object that satisfies this shape for every endpoint.

### 3.2 `source` tagging

Every response from every backend MUST carry a `source` field identifying the active backend:

| Backend | `source` value |
|---|---|
| `inference/backends/stub.py` | `"stub"` |
| `inference/backends/fireworks.py` | `"fireworks"` |
| `inference/backends/fireworks.py` (when `ANI_BACKEND=mi300x`) | `"mi300x"` |
| `inference/backends/langgraph_backend.py` | `"langgraph"` |

**Assembly gate:** the live Vercel demo, at submission time, MUST return `"source": "mi300x"`
— confirming the entire pipeline flows through the AMD card.

### 3.3 Environment variable wiring map (the only way tiers connect)

```
Tier 1 → Tier 2:  INFERENCE_BASE_URL
                  (unset → stub fallback; set → real Tier 2)
                  Set in: Vercel project env vars

Tier 2 → Tier 3:  ANI_BACKEND  (stub | fireworks | mi300x | langgraph)
                  ANI_BASE_URL (https://api.fireworks.ai/inference/v1 or <tunnel>/v1)
                  ANI_MODEL    (Gemma 3 VLM model id)
                  FIREWORKS_API_KEY  (or any key vLLM expects)
                  Set in: Railway/Render or MI300X shell environment
```

### 3.4 Stub fallback — NON-NEGOTIABLE

**No track may remove the stub fallback path.** Every API route in `web/app/api/*/route.ts`
must remain capable of falling back to `web/lib/stub.ts` when `INFERENCE_BASE_URL` is unset
or unreachable. Every Tier 2 backend must fall back to `stub.py` when upstream calls fail.

Reason: the demo must never hard-fail in front of a judge. The stub guarantee means the
MI300X tunnel dying, Fireworks rate-limiting, or a cold-start timeout all silently degrade
to a working (canned) demo — not a broken one.

### 3.5 Branch policy — single public source of truth

`main` is the default branch on GitHub and the branch Vercel deploys from. All track work
must end up on `main` before the assembly gate. The working branch `origin/v1.1` has
3 UI-fix commits ahead of `main` — these must be fast-forwarded into `main` at A2. Any
further Track B/C commits should go directly onto `main` after A2, or be merged into `main`
before assembly.

---

## 4. Cross-track dependencies

*If you're working on one track and editing a file another track also touches, coordinate.*

| Files shared across tracks | Touched by | Dependency |
|---|---|---|
| `inference/backends/fireworks.py` | Track A (A4), Track B (used via `ANI_BACKEND=mi300x` alias), Track C (C2 prices) | A4 edits `grade()` signature; B reuses it; C2 edits `match()` → stub bridge. Coordinate on the `/process` contract. |
| `inference/backends/langgraph_backend.py` | Track A/C (I2 Gemma-3 model id), Track C (C3 embeddings) | C3 wiring must not break the state-graph pipeline B inherits. |
| `inference/data/buyers.json` | Track C (C2 real prices) | C2 must not change the JSON structure — only enrich `max_price_per_kg` from real data. |
| `inference/data/ncr_prices.csv` | Track C (C1 scrape, C2 wire) | Currently dead data; C2 must wire it into `match()` without breaking existing shape. |
| `Vercel env var: INFERENCE_BASE_URL` | Track A (A6, waived by E1), Track B (B6 sets the verified MI300X tunnel) | A6 first, or record Decision E1; then B6. One variable, no code change. |
| `training/serve_vllm.sh` | Track B (B3 model, B7 adapter) | B7 starts after B3 confirms the model loads. |
| `training/receipts/ROCM_NOTES.md` | Track B (B8) | Fill only after B1–B7 are stable; reference receipts committed. |
| `web/app/page.tsx` | Track A (only if UI fix needed) | Any edit here must preserve the sample-photo→base64→`/api/process` dataflow and the JSON-shape destructuring in the `getProcess` response handlers. |

**Vercel repaint sequence (strict ordering, amended by Decision E1):**
1. A6: confirm the Fireworks-backed Tier 2, **or** record the approved E1 exception with
   direct evidence that the required Gemma deployment is unavailable.
2. B6: set `INFERENCE_BASE_URL` → Cloudflare tunnel to MI300X. Dry-run must confirm
   `source: mi300x` before submission.

---

## 5. Assembly & submit (last ~90 minutes, sequential, all owners)

| Step | Action | Confirmation |
|---|---|---|
| S1 | Merge all track branches → `main`. Push. Resolve any conflict in the shared files (see §4). | `git status` clean on `main` |
| S2 | **Second clean dry-run** from incognito browser on the live Vercel URL. Pick each crop, click Grade & match, verify map animates, check network tab for `source: mi300x`. | All panels populate; `source: mi300x` confirmed |
| S3 | Keep Vercel warm — open the URL right before judging; no cold start. | Space loads instantly |
| S4 | **Safety net:** if Vercel is down or misbehaving near the deadline, spin the 1-hour Gradio `/process` proxy on a free HF CPU Space. One `app.py`, `gr.Interface`, `ANI_BACKEND=mi300x` pointed at the tunnel. Guaranteed-live fallback. | — |
| S5 | Verify receipts committed to `training/receipts/` and linked from `JUDGES_START_HERE.md` + root `README.md`. | All receipt files committed; all `ROCM_NOTES.md` checkboxes checked |
| S6 | Clean root `README.md`: remove the stray personal-tag lines ("hi im jan / jc / andre / jake jake"), confirm MIT license, public link, live demo URL. | README is professional and submission-ready |
| S7 | **Submit** with buffer well before 6 PM CET: public repo link + ≤5-min video (direct file upload, ≤300 MB) + live demo URL noted in `JUDGES_START_HERE.md`. | Submission acknowledged |
| S8 | **Destroy the MI300X instance** to stop credit burn (powering off still bills disk/IP — full destroy only). | Instance gone; credit protected |

---

## 6. Cut list — zero judging points, do NOT touch

These items are **explicitly out of scope today**. The skill gate blocks any task matching them.

- Porting the four `initial_site/` mockup portals to Tier 1 (already superseded by the showcase)
- Real SSE streaming (the `setTimeout` staged reveal reads as streaming to a judge)
- Kubernetes / K6 / "pentacorn enterprise deploy rigor" (zero points per winner audit)
- A real OR-solver logistics route optimizer (keep the transparent heuristic)
- Tests
- Refactoring `AgentTrace.tsx` / `MatchFeed.tsx` / `UrgencyCard.tsx` null placeholders
- Gradio safety-net build until S4 (only if Vercel is failing near deadline)

---

## 7. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Build unverified** — A3 may surface TS errors or missing deps requiring fixes before the deploy can succeed | HIGH | Run A3 FIRST. If it fails, fix immediately; the rest of the tracks can't start without a deployable build. |
| **vLLM-ROCm Gemma 3 vision support** — ROCm vLLM may not support Gemma 3 multimodal inference yet (B2 gate) | MEDIUM | Fallback: serve text-only Gemma on MI300X (grade from crop+condition, not photo), keep multimodal on Fireworks. Weakens but doesn't kill the self-hosted story. |
| **Fine-tune blows the day** — data prep + GPU time for B7 could eat the entire afternoon | HIGH | B7 is explicitly a **stretch** task. Cut it if B1–B6 aren't stable by mid-afternoon. Self-hosted Gemma + `rocm-smi`/vLLM receipts alone is the table-stakes champion move. |
| **Fireworks Gemma unavailable** — the account exposes no Gemma endpoint and the planned model IDs return `404` | HIGH | Decision E1 selects the already verified MI300X multimodal path; retain truthful stub fallback and do not claim Fireworks inference. |
| **Cloudflare quick-tunnel URL is ephemeral** — each restart gives a new random URL | HIGH | Use a **named tunnel** (`cloudflared tunnel create ani-mi300x`), not the `--url` quick tunnel. Update Vercel env var once; stable for the judging window. |
| **Credit burn** — $100 MI300X depletes fast if instance is left running idle | MEDIUM | Destroy instance between sessions. Only keep it live for the judging window. |
| **HF Docker Space build timeout** — if the team pivots from Vercel, Docker-based Spaces can fail on slow builds | LOW | Vercel is the confirmed Tier 1 target; Docker is out. Gradio fallback is the safety net. |

---

## 8. Submission checklist (final gate before upload)

- [ ] Public GitHub repo: `Zeraphim/ani-amd-hackathon` → visibility = Public
- [ ] `main` is the default branch and contains all track work
- [ ] Live Vercel URL confirmed in `JUDGES_START_HERE.md`
- [ ] Dry-run from incognito: `source: mi300x` visible in network tab
- [ ] `training/receipts/` has `rocm-smi.log` + `vllm_serve.log` (+ `train.log` if B7 was reached)
- [ ] `training/receipts/ROCM_NOTES.md` is filled honestly — all checkboxes checked
- [ ] `JUDGES_START_HERE.md` links to receipt files and live demo URL
- [ ] README: no stray personal lines; MIT license; public URL
- [ ] Pitch deck committed (PDF or markdown in `docs/` or root)
- [ ] ≤5-min video file (≤300 MB, direct upload — no YouTube/Drive)
- [ ] MI300X destroyed (protect credit)
- [ ] Submit on LabLab platform before 6 PM CET with buffer

---

*Strategy source: `../backwards-to-champion.md`. Long-form roadmap: `02-roadmap.md`.
Deployment guide: `05-deployment-guide.md`. System overview: `04-system-overview.md`.*
