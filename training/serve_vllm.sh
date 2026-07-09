#!/usr/bin/env bash
# Tier 3 — serve the Gemma stack on the AMD MI300X with vLLM (ROCm).
# Run this ON the MI300X instance. Capture the startup log as a "receipt".
set -euo pipefail

MODEL="${ANI_MODEL:-google/gemma-2-9b-it}"   # swap to your fine-tuned grader
PORT="${PORT:-8001}"

echo "== rocm-smi (receipt) =="
rocm-smi | tee receipts/rocm-smi.log || echo "rocm-smi not found (are you on the MI300X?)"

echo "== launching vLLM on ROCm =="
# 192 GB HBM3 lets one card co-host the grader + reasoning + embeddings.
vllm serve "$MODEL" \
  --host 0.0.0.0 --port "$PORT" \
  --dtype bfloat16 \
  --max-model-len 8192 \
  2>&1 | tee receipts/vllm_serve.log

# Then expose it (Cloudflare Tunnel) and point Tier 2 at it:
#   ANI_BACKEND=mi300x ANI_BASE_URL=https://<tunnel>/v1 uvicorn main:app --port 8000
