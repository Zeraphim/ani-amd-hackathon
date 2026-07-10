#!/usr/bin/env bash
# Tier 3 — serve Gemma 3 vision on the AMD MI300X with vLLM/ROCm.
# Run from training/ on the MI300X. Required receipts stay under receipts/.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

MODEL="${ANI_BASE_MODEL:-${ANI_MODEL:-google/gemma-3-27b-it}}"
PORT="${PORT:-8001}"
VLLM_IMAGE="${VLLM_IMAGE:-vllm/vllm-openai-rocm:v0.23.0}"
HF_HOME="${HF_HOME:-$HOME/.cache/huggingface}"
GPU_MEMORY_UTILIZATION="${GPU_MEMORY_UTILIZATION:-0.80}"
LORA_PATH="${ANI_LORA_PATH:-}"
LORA_NAME="${ANI_LORA_NAME:-ani-grader}"
: "${FIREWORKS_API_KEY:?Set FIREWORKS_API_KEY to the private vLLM API key}"

LORA_ARGS=()
if [[ -n "$LORA_PATH" ]]; then
  LORA_ARGS=(--enable-lora --lora-modules "${LORA_NAME}=${LORA_PATH}" --max-lora-rank 16)
fi

mkdir -p receipts "$HF_HOME"

echo "== rocm-smi (receipt) =="
{
  date -Is
  rocm-smi --version
  rocm-smi
  rocm-smi --showproductname --showdriverversion --showmeminfo vram
  (rocminfo 2>/dev/null | awk '/gfx942/ && !seen {print; seen=1}') || true
} 2>&1 | tee receipts/rocm-smi.log

echo "== launching vLLM on ROCm =="
{
  date -Is
  echo "model=$MODEL"
  echo "image=$VLLM_IMAGE"
  echo "port=$PORT"
  echo "gpu_memory_utilization=$GPU_MEMORY_UTILIZATION"
  echo "lora=${LORA_PATH:-disabled}"
  (rocminfo 2>/dev/null | awk '/gfx942/ && !seen {print; seen=1}') || true
  docker run --rm --entrypoint python "$VLLM_IMAGE" -c \
    'import torch, transformers, vllm; print(f"vllm={vllm.__version__} transformers={transformers.__version__} torch={torch.__version__} hip={torch.version.hip}")'
  docker run --rm --name ani-vllm \
    --network host \
    --device /dev/kfd --device /dev/dri \
    --group-add video \
    --ipc host \
    --cap-add SYS_PTRACE \
    --security-opt seccomp=unconfined \
    -e GLOO_SOCKET_IFNAME=eth0 \
    -e NCCL_SOCKET_IFNAME=eth0 \
    -v "$HF_HOME:/root/.cache/huggingface" \
    -v /shared-docker:/shared-docker \
    --entrypoint vllm \
    "$VLLM_IMAGE" serve "$MODEL" \
    --host 127.0.0.1 --port "$PORT" \
    --api-key "$FIREWORKS_API_KEY" \
    --dtype bfloat16 \
    --max-model-len 8192 \
    --max-num-seqs 8 \
    --limit-mm-per-prompt '{"image":1}' \
    --gpu-memory-utilization "$GPU_MEMORY_UTILIZATION" \
    "${LORA_ARGS[@]}" \
    2>&1 | sed -u "s/${FIREWORKS_API_KEY}/[REDACTED]/g"
} 2>&1 | tee receipts/vllm_serve.log

# Then expose it (Cloudflare Tunnel) and point Tier 2 at it:
#   ANI_BACKEND=mi300x ANI_BASE_URL=http://127.0.0.1:8001/v1 \
#   ANI_MODEL="$MODEL" uvicorn main:app --host 127.0.0.1 --port 8000
