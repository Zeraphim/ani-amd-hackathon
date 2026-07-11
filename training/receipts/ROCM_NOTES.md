# ROCm / MI300X notes & receipts

This is the hardware-specific execution record for Ani's Track B. Values below come from
the committed logs, not marketing specifications.

## Instance

- AMD Developer Cloud, one AMD Instinct MI300X VF, `gfx942`
- HBM reported by ROCm: 205,822,885,888 bytes (191.7 GiB)
- ROCM-SMI 4.0.0, ROCM-SMI-LIB 7.8.0, driver 6.16.13
- Serving image: `vllm/vllm-openai-rocm:v0.23.0`
- Runtime pins: vLLM 0.23.0, Transformers 5.12.0, PyTorch
  `2.10.0+git8514f05`, HIP 7.2.53211, PEFT 0.19.1
- Base model: `google/gemma-3-27b-it`, BF16, 8,192-token request limit
- Tuned adapter: `ani-grader`, LoRA rank 16, 36,507,648 trainable parameters
  (0.1329% of 27,468,914,288 total parameters)

## Receipts committed here

- [x] `rocm-smi.log` — `gfx942`, driver, and 191.7 GiB HBM telemetry
- [x] `vllm_serve.log` — Gemma 3 vision startup, ROCm/HIP pins, and loaded
  `ani-grader` adapter
- [x] `train.log` — real one-epoch multimodal LoRA run plus production serving check
- [x] `loss_curve.csv` and `loss_curve.svg` — optimizer-step loss evidence
- [x] `b7_metrics.json` and `b7_predictions.jsonl` — machine-readable metric and
  per-image predictions
- [x] `../data/produce_grades.jsonl` — deterministic 300-example manifest
- [x] Base → tuned held-out accuracy: **86.67% (26/30) → 100% (30/30), +13.33 pp**

## Dataset and evaluation

- FruQ-DB v1, DOI `10.5281/zenodo.7224690`, CC BY 4.0
- Published archive MD5 verified: `1a942c2d49dc302bacef155561e1f9a8`
- 300 balanced examples: 100 each for Fresh/A, Mild/B, and Rotten/C
- 240 training examples; 30 balanced evaluation examples used for the reported metric;
  30 additional examples remain in the held-out manifest
- Seed 42; every canonical time-lapse sequence is assigned globally to one split;
  verified train/eval sequence overlap is zero
- One epoch, gradient accumulation 8, 30 optimizer steps, learning rate 2e-4
- Adapter training completed in 179.3 seconds. Evaluation used the same deterministic
  10 A / 10 B / 10 C slice before and after training.

## What worked

- Gemma 3 27B multimodal loaded natively on ROCm and accepted real image inputs.
- The base model checkpoint occupied 51.66 GiB; vLLM retained 99.42 GiB for KV cache.
- Tuned serving exposed both `google/gemma-3-27b-it` and `ani-grader`; vLLM logged
  `Loaded new LoRA adapter: name 'ani-grader'`.
- A Cloudflare **named** tunnel exposes FastAPI at `ani-api.jcdiamante.com`; vLLM remains
  bearer-protected and bound to `127.0.0.1` behind `ani-model.jcdiamante.com`.
- The production Vercel request traversed Tier 1 → Cloudflare → FastAPI → tuned vLLM and
  returned HTTP 200 with `source: mi300x`.
- Stub fallback remains in both web and inference tiers for judge-safe degradation.

## What did not work, and the fixes

- Fireworks' account catalog exposed no Gemma model; Gemma 3 27B and 12B returned
  `404 NOT_FOUND`. Decision E1 formally removed the obsolete Fireworks-before-MI300
  prerequisite instead of faking a `source: fireworks` result.
- The initial vLLM launch failed because Gloo selected `0.0.0.0`; pinning
  `GLOO_SOCKET_IFNAME=eth0` and `NCCL_SOCKET_IFNAME=eth0` fixed distributed init.
- `pipefail` combined with early-exiting `awk`/`rocminfo` probes terminated the launcher;
  the hardware probes are now non-fatal and consume their full streams.
- The launcher initially lacked its executable bit; the tracked scripts are executable.
- ROCm's native tanh GELU was unstable, so vLLM fell back to exact GELU.
- TURBOQUANT was incompatible with the decoder attention type; vLLM selected ROCm
  attention. ROCm custom paged attention was unavailable and fell back to Triton.
- The first real inference triggered Triton JIT latency spikes; warmup and compile caches
  made subsequent requests steady.
- vLLM's startup diagnostics printed the initial private API key. It was rotated, the
  launcher now redacts it, and committed receipts contain no token.
- A `pip --target` dependency preflight tried to resolve a CUDA Torch wheel. It was stopped
  before installation; training reuses the proven ROCm Torch/Transformers/PEFT stack in
  the vLLM image.
- TorchVision in the ROCm image lacked PNG support. The trainer now decodes FruQ images
  with Pillow and passes in-memory RGB images to the Gemma processor.
- The first class-by-class dataset split had seven cross-label sequence collisions. It was
  discarded; the final preparer assigns sequences globally and verifies zero overlap.
- Vercel Hobby blocked deployments authored by a collaborator while the GitHub repository
  was private. Completing A1 (public repository) removed the collaboration block.
- The first tuned restart wrote its log relative to the caller. `serve_vllm.sh` now changes
  to its own directory, guaranteeing receipts land under `training/receipts/`.

## Memory math — why the MI300X is load-bearing

- Measured serving footprint during a real request: **153.3 GiB**.
- Breakdown from vLLM: 51.66 GiB model load + 99.42 GiB available KV cache + roughly
  2.2 GiB runtime/graph overhead. The tuned LoRA adds only 0.1329% trainable parameters.
- Remaining measured headroom was about 38.4 GiB.
- This configured Gemma vision runtime alone exceeds an H100 80 GB card, while it fits on
  the MI300X 192 GB card with useful headroom: **MI300X 192 GB ✅ · H100 80 GB ❌**.
- Ani does not claim that a separate embedding model was co-hosted in this receipt; the
  measured proof is the multimodal grader, its reasoning/KV budget, and the live LoRA.

## Final live checks

- [x] Public FastAPI health returns `{"ok":true,"backend":"mi300x"}`
- [x] Unauthenticated public `/v1/models` request returns 401
- [x] Authenticated `/v1/models` lists base model and `ani-grader`
- [x] Real repository photo through Vercel returns HTTP 200 and `source: mi300x`
- [x] Tuned adapter remains loaded in the live vLLM process
