---
title: Ani
emoji: 🌱
colorFrom: green
colorTo: yellow
sdk: docker
app_port: 7860
pinned: true
license: mit
---

<p align="center">
  <img src="docs/ui/banner.svg" alt="Ani — one photo, a harvest, sold fresh. Fine-tuned Gemma-3-27B grader on AMD MI300X." width="100%">
</p>

<h1 align="center">Ani — Agentic Harvest Grading & Market-Matching on AMD MI300X</h1>

<p align="center">
  One photo → an AI <b>grade + spoilage-urgency score</b> → a ranked feed of live Metro Manila buyers.<br>
  A <b>fine-tuned Gemma-3-27B</b> grader, served privately on a single <b>AMD Instinct MI300X</b>.
</p>

<p align="center">
  <b><a href="https://ani-amd-hackathon.vercel.app">▶ Live demo</a></b> ·
  <a href="./JUDGES_START_HERE.md">Judges start here</a> ·
  <a href="./training/receipts/METRICS.md">Measured results</a> ·
  <a href="./BUSINESS.md">Business case</a>
</p>

<p align="center">
  <i>AMD Developer Hackathon: ACT II — Track 3 (Unicorn) · entry for “Best AMD-Hosted Gemma Project.”</i>
</p>

---

## Measured on one AMD MI300X

Ani's grader isn't an API wrapper — it's a Gemma-3-27B model **LoRA fine-tuned and served on a
single MI300X**, and every number below traces to a committed receipt in
[`training/receipts/`](./training/receipts). Full analysis: [`METRICS.md`](./training/receipts/METRICS.md).

| What | Measured | Receipt |
|---|---|---|
| **Grading accuracy** | base **86.7%** → tuned **100%** (+13.3 pts) on a balanced held-out set | `b7_metrics.json` |
| **Grade latency (end-to-end)** | **p50 1.40 s**, p95 1.40 s — image → grade → buyer match | `latency_bench.json` |
| **Throughput** | **~43 grades/min** sequential, `source: mi300x` verified **20/20** | `latency_bench.json` |
| **VRAM in use** | **153.9 GiB** during image inference (51.66 GiB weights + 99.42 GiB KV) | `rocm-smi-loaded.log` |
| **Concurrency** | **22.69×** @ 8,192-token context | `vllm_serve.log` |
| **Card** | AMD Instinct **MI300X (192 GB HBM3)**, `gfx942`, ROCm + vLLM | `vllm_serve.log` |

**Read the accuracy honestly.** The tuned **100% is a point estimate on a small held-out set
(n = 30, single seed)** — its Wilson 95% confidence interval is **[88.6%, 100%]**, i.e. the true
accuracy is most consistent with **≥ ~89%**, a solid lift over the base model's 86.7%. We report
the interval (and ship a multi-seed variance harness, `run_variance_eval.sh`) rather than headline
a bare 100%. The honest limitations are logged in [`ROCM_NOTES.md`](./training/receipts/ROCM_NOTES.md).

**Why AMD is non-negotiable, not decorative:** the grader reserves ~151 GiB and measures **153.9 GiB**
in use — that co-hosts on **one MI300X (192 GB)** with headroom, but does **not** fit a single
80 GB H100. A farmer co-op can therefore run the whole grader **privately, on-site** — pricing,
contracts, and farmer photos never leave the cooperative.

## Try it

1. Open the **[live demo](https://ani-amd-hackathon.vercel.app)** (the Hugging Face Space runs the same app).
2. Add a harvest photo → the grader reads it and fills the crop + volume.
3. Press **⚡ Grade & match** → watch the pipeline: **grade** (fine-tuned Gemma vision) →
   **demand match** (embeddings over live NCR prices) → **dispatch** (most-perishable-first).

The web tier degrades gracefully to a built-in stub if the backend is unreachable, so the demo
never hard-fails in front of a judge — but with `INFERENCE_BASE_URL` set, it runs live on the MI300X
(responses are tagged `source: mi300x`). See [`JUDGES_START_HERE.md`](./JUDGES_START_HERE.md).

## Architecture — three tiers, one env-var swap

| Tier | What | Where it runs |
|---|---|---|
| **1 — Web / UI** | Next.js app (`web/`) — capture, agent trace, results, ROI calculator | HF Space / Vercel · Docker :7860 |
| **2 — Inference / orchestration** | FastAPI (`inference/`) — `/analyze` `/grade` `/match` `/process`, LangGraph multi-agent | MI300X host (stub / Fireworks / mi300x backends) |
| **3 — Models** | Fine-tuned Gemma-3-27B grader + embeddings via **vLLM on ROCm** (`training/`) | **AMD MI300X (192 GB)** |

```
Next.js (Tier 1)  ──INFERENCE_BASE_URL──▶  FastAPI (Tier 2)  ──ANI_BASE_URL──▶  vLLM/ROCm on MI300X (Tier 3)
```

Swapping the backend from stub → Fireworks → MI300X is a **single environment variable** — no code
changes. That contract is the whole point: the demo is portable, the compute is AMD.

## The fine-tune (reproduce it)

Gemma-3-27B, LoRA (r=16, α=32) on a Benguet-relevant produce set (240 train / 60 balanced eval),
one epoch on the MI300X. Scripts in [`training/`](./training):

```bash
bash run_finetune.sh                                   # fine-tune + eval on the card
SEEDS="42 7 123" bash run_variance_eval.sh             # multi-seed variance (full 60-ex eval)
python3 aggregate_metrics.py                           # -> receipts/variance/summary.md (mean±std + Wilson CI)
bash serve_vllm.sh & FIREWORKS_API_KEY=… bash capture_receipts.sh   # loaded rocm-smi snapshot
ANI_PROCESS_URL=http://127.0.0.1:8000 python3 bench_latency.py --n 20  # grade p50/p95 + grades/min
```

## Product & market

Benguet grows **~80%** of Metro Manila's highland vegetables, yet **42–50%** is lost across harvest →
transport → market — a coordination-and-timing problem software can fix *this season*, not a growing
problem. Ani grades a harvest, scores its spoilage urgency, and matches it to live NCR demand so the
most perishable loads move first. Paying customers are farmer co-ops, traders/consolidators, and
institutional buyers; the beachhead is one Benguet co-op + the La Trinidad trading post, expanding
across Luzon then SEA cold chains. Full sizing, revenue model, and unit economics in
[`BUSINESS.md`](./BUSINESS.md) — and the **interactive ROI calculator** is live in the demo's Market
section (edit volume / price / spoilage, see value recovered).

## Repo layout

```
web/         Tier 1 — Next.js app (UI, ROI calculator, API proxy routes)
inference/   Tier 2 — FastAPI + swappable backends (stub · fireworks · langgraph/mi300x)
training/    Tier 3 — LoRA fine-tune, vLLM serving, benchmarks, and committed receipts/
docs/        architecture, deployment runbook, UI assets (incl. this banner)
BUSINESS.md  market, revenue model, unit economics
JUDGES_START_HERE.md   60-second judge path
```

## Local dev

```bash
cd web && npm install && npm run dev     # http://localhost:3000
```

## Deploy

```bash
git add . && git commit -m "update" && git push        # HF builds the root Dockerfile → port 7860
```

## Team

Built by **Angelo Sebaxtian Vasquez**, **Jan Añonuevo**, **Jakey Manahan**, and **JC Diamante**
for the AMD Developer Hackathon: ACT II (Track 3 — Unicorn).

Gemma-3-27B (Google DeepMind) · served with vLLM on AMD ROCm · MI300X via AMD Developer Cloud.
Licensed **MIT**.
