# Judges — start here (60 seconds)

**Ani** grades a highland farmer's harvest, scores its **spoilage urgency**, and matches it
to live Metro Manila (NCR) demand — so Benguet produce sells before it spoils.

## Try it
1. Open the Space (this page's app).
2. Pick a crop (e.g. *Cabbage (Scorpio)*), set a quantity, press **⚡ Grade & match harvest**.
3. Watch the agentic pipeline: **Agent A** returns a grade + urgency score → **Agent D**
   ranks NCR buyers by match, demand, and price.

## What's real vs. staged
- **Now:** the demo runs on a built-in stub (Benguet/NCR-localized) so it always works.
- **Real AI:** set the `INFERENCE_BASE_URL` secret to our Tier 2 service (Gemma via
  Fireworks today; **self-hosted on the AMD MI300X** at showtime). No code changes.

## Where the AMD story lives
- `training/serve_vllm.sh` — serves the Gemma stack on the **MI300X (192 GB)** via vLLM/ROCm.
- `training/finetune_gemma_grader.py` — LoRA fine-tune of the grader.
- `training/receipts/` — rocm-smi + vLLM logs + base-vs-tuned grading number.

## Architecture
Next.js UI (this Space) → FastAPI inference (`inference/`) → Gemma on MI300X (`training/`).
The whole agentic stack co-hosts on **one AMD card**, on-prem and private — see `README.md`.
