---
name: ani-execution-gate
description: >
  Hard gate for ALL Ani AMD Hackathon work on July 11 submission day. Activates whenever
  ANY dev or agent is building, editing, planning, reviewing, or talking about Ani code,
  docs, config, deploy, data, training, or task assignment. Every work item MUST trace to
  a Track A/B/C task in docs/06-execution-plan.md, preserve the end-to-end connectivity
  contract, respect the cut list, and not break another track's assumptions. Trigger on:
  "build", "edit", "change", "add", "fix", "implement", "deploy", "train", "fine-tune",
  "plan", "track", "task", "what should I work on", "what's next", "can I", "should I",
  any Ani filename or path pattern (web/, inference/, training/, backends/, page.tsx,
  main.py, fireworks.py, langgraph, Dockerfile, Vercel, MI300X, ROCm).
---

# Ani Execution Gate

**Purpose:** this skill is the hard gate for every Ani task on July 11 submission day.
It does NOT build anything — it validates that work aligns with the locked three-track
execution plan before a dev or agent proceeds. If a task fails a gate check, the action
is blocked and the violation is surfaced to the user.

**Source of truth:** `docs/06-execution-plan.md` — the locked champion path. This skill
distills the enforcement rules from that doc. When in doubt, re-read `06-execution-plan.md`.

---

## The five gate checks

Every proposed work item (edit, command, new file, config change, anything) must pass
ALL five checks before proceeding. Fail any one → block the action and state which
check failed and why.

### 1. TRACE — does this task map to a Track A/B/C item?

Reference the task tables in `docs/06-execution-plan.md` §2. Each task has a label
(A1–A9, B1–B8, C1–C4, S1–S8). If the proposed work does NOT map to any of those
labels:

- **If the task is clearly useful and small (≤15 min):** ask the user whether to add
  it as an implied subtask under the closest Track item, or reject.
- **If the task is a new scope item that spans >15 min:** REJECT. Cite the locked plan
  and the deadline. Do not allow scope creep on submission day.
- **If the user insists:** surface the cross-track impact and ask them to update
  `docs/06-execution-plan.md` first.

### 2. CONTRACT — does this edit preserve the shared interfaces?

Reference `docs/06-execution-plan.md` §3 (End-to-end connectivity contract). Check:

- **JSON shapes:** every field in `GradeCard`, `MatchResult`, `BuyerMatch`, `Dispatch`
  must remain consistent between `web/lib/types.ts` AND `inference/backends/stub.py`.
  Renaming, retyping, or removing a field in one file but not the other → REJECT.
- **`source` tagging:** every backend response MUST carry `source: "stub" | "fireworks"
  | "mi300x" | "langgraph"`. Removing the `source` field or changing its values → REJECT.
- **Env-var wiring:** `INFERENCE_BASE_URL`, `ANI_BACKEND`, `ANI_BASE_URL`, `ANI_MODEL`,
  `FIREWORKS_API_KEY` are the ONLY way tiers connect. Hardcoding a URL or model name that
  bypasses these env vars → REJECT.
- **Stub fallback:** every API route in `web/app/api/*/route.ts` and every Tier 2 backend
  must have a try/catch (or equivalent) that falls back to the stub on failure. Removing
  or commenting out the fallback → REJECT. This is NON-NEGOTIABLE.

### 3. CONNECTIVITY — does this edit break another track's assumption?

Reference `docs/06-execution-plan.md` §4 (Cross-track dependencies). If the file being
edited is listed in the shared-files table, check:

- **Which other tracks touch this file?** State them explicitly.
- **What does this edit change that those tracks depend on?** (e.g., a function signature,
  the `GradeCard` shape, the `process_harvest` return structure, the env-var wiring).
- **If the edit is a breaking change for another track:** REJECT and surface the conflict.
  Tell the user which track would break and why.
- **If the edit is compatible** (additive only, preserves shape, backward-compatible):
  note the track that may need to know. Proceed but flag it.

The Vercel repaint sequence (A6 → B6) is strictly ordered. Do not set `INFERENCE_BASE_URL`
to the MI300X tunnel before A6 confirms the Fireworks path is working, **unless** the source
plan contains a dated, user-approved decision record that documents direct evidence that the
required Fireworks Gemma deployment is unavailable. Decision E1 in `docs/06-execution-plan.md`
is the approved exception for this submission; B6 must still verify `source: mi300x`.

### 4. CUT-LIST — is this on the explicit cut list?

Reference `docs/06-execution-plan.md` §6 (Cut list). These items score ZERO judging points
and are explicitly out of scope today. Any task matching any of these → REJECT outright:

- Porting `initial_site/` mockup portals
- Real SSE streaming (keep the `setTimeout` staged reveal)
- Kubernetes / K6 / "enteprise deploy rigor"
- Real OR-solver logistics route optimizer
- Writing tests
- Refactoring `AgentTrace.tsx` / `MatchFeed.tsx` / `UrgencyCard.tsx` null placeholders
- Building the Gradio safety-net before S4 (only if Vercel fails near deadline)

### 5. RECEIPTS — if Track B, what receipt is produced?

If the task is Track B (MI300X) work, it MUST map to a receipt. Reference the receipt
column in `docs/06-execution-plan.md` §2 Track B table:

| Task | Receipt |
|---|---|
| B1 | `training/receipts/rocm-smi.log` (committed) |
| B3 | `training/receipts/vllm_serve.log` (committed) |
| B7 | `training/receipts/train.log` + loss curve + base→tuned % number |
| B8 | `training/receipts/ROCM_NOTES.md` (filled, all checkboxes checked) |

Any Track B task that does not specify which receipt it produces → REJECT. Ask: "What
receipt does this produce? B1/B3/B7/B8?"

If the task is Track B BUT the receipt file path is wrong (not under `training/receipts/`):
REJECT and redirect to `training/receipts/`.

---

## Additional enforcement rules

### The Gemma-3 invariant

Reference `docs/06-execution-plan.md` §1. Three files must call a Gemma 3 VLM, never
minimax-m3 or Gemma-2:

| File | Check |
|---|---|
| `inference/backends/fireworks.py` `grade()` | Model must be a Gemma 3 multimodal VLM id. If the model param is `minimax-m3` or `gemma-2-*` or text-only-only → REJECT. |
| `inference/backends/langgraph_backend.py` `harvest_grader_node` | The `model=` arg in `client.chat.completions.create()` must be a Gemma 3 VLM id, not `minimax-m3`. |
| `training/serve_vllm.sh` + `finetune_gemma_grader.py` | Default model must default to a Gemma 3 VLM, not `google/gemma-2-9b-it`. |

### Stub fallback is non-negotiable

Repeated for emphasis: the fallback path in every API route and every backend is
**sacred**. The demo must never hard-fail in front of a judge. If an edit removes,
comments out, or breaks the fallback → REJECT with extreme prejudice. This is the
single highest-impact rule for judge experience.

### `main` is the single public source of truth

After A2 (fast-forward `main` to `origin/v1.1`), all track work should land on `main`
(or be merged into `main` before the assembly gate at S1). If a dev is doing work
exclusively on a feature branch past its merge target → warn them to merge or
fast-forward to `main` before assembly.

### Assembly gate (S1–S8) is strictly sequential

Do not perform S2 before S1, S7 before S2, etc. The assembly steps are ordered
because each depends on the previous one. If a step fails, fix the root cause
before proceeding.

---

## What to do when a gate fails

1. **State clearly** which check failed (1–5) and the specific rule from `06-execution-plan.md`
   that was violated. Cite the section number.
2. **Offer the corrective action** — what would need to change for the task to pass.
   (e.g., "This task edits `fireworks.py` `grade()` without updating the `source` tag —
   add `data['source'] = SOURCE` to the return path.")
3. **If the task is legitimate but not mapped:** ask the user whether to add it as
   an implied subtask of the closest Track item, or reject it as scope creep.
4. **Never silently proceed** after a gate failure. The gate is hard — no work bypasses it.

---

## Files this skill guards (non-exhaustive — when in doubt, check)

| File | Guarded contract |
|---|---|
| `web/lib/types.ts` | JSON shapes — §3.1 |
| `web/lib/stub.ts` | Fallback shapes, `source: stub` — §3.1, §3.2 |
| `web/app/api/grade/route.ts` | env-var wiring + stub fallback — §3.3, §3.4 |
| `web/app/api/match/route.ts` | env-var wiring + stub fallback — §3.3, §3.4 |
| `web/app/api/process/route.ts` | env-var wiring + stub fallback + image_data forwarding — §3.3, §3.4 |
| `web/app/page.tsx` | JSON-destructure in `getProcess` response handlers — §3.1, §4 |
| `inference/main.py` | Backend dispatch + `/process` contract — §3.1, §3.2 |
| `inference/backends/__init__.py` | `ANI_BACKEND` dispatch — §3.3 |
| `inference/backends/stub.py` | Canonical Python JSON shapes + `source: stub` — §3.1, §3.2 |
| `inference/backends/fireworks.py` | Gemma-3 invariant + multimodal + `source` tag — §1, §3.2 |
| `inference/backends/langgraph_backend.py` | Gemma-3 invariant + state-graph contract — §1, §3.2 |
| `inference/data/buyers.json` | Structure not changed by C2 — §4 |
| `inference/data/ncr_prices.csv` | Real source header + wired by C2 — §4 |
| `training/serve_vllm.sh` | Gemma-3 default model — §1 |
| `training/finetune_gemma_grader.py` | Gemma-3 default model — §1 |
| `training/receipts/` | All receipt files committed — §2 Track B, §5 |
| `Dockerfile` | Port 7860 + Next standalone — §4 |
| `README.md` | YAML header, public link, no stray lines — §5 |
| `JUDGES_START_HERE.md` | Links receipts + live demo URL — §5 |
