# ROCm / MI300X notes & receipts

*Champion-move: keep an honest log here. Winners scored on committed, hardware-specific
evidence and an honest "what didn't work" section. Fill this in as you run on the card.*

## Instance
- AMD Developer Cloud · MI300X (192 GB HBM3) · gfx942
- ROCm version: `<fill: rocm-smi --version>`
- Base image: `<fill>`

## Receipts to commit here
- [ ] `rocm-smi.log` — GPU telemetry during a real run (power/VRAM)
- [ ] `vllm_serve.log` — vLLM startup showing gfx942 + model load
- [ ] `train.log` + loss curve — from `finetune_gemma_grader.py`
- [ ] base-vs-fine-tuned grading accuracy (the deck number)

## What worked
- `<fill>`

## What did NOT work (keep this honest — it's a credibility signal)
- `<fill: any ROCm quirks, version pins, kernel issues, workarounds>`

## Memory math (the "why AMD was non-negotiable" slide)
- Co-hosting grader + reasoning + embeddings ≈ `<fill>` GB
- Fits: MI300X 192 GB ✅ · H100 80 GB ❌
