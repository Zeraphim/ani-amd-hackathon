#!/usr/bin/env bash
# B7: run the one-epoch Gemma 3 multimodal LoRA experiment on the MI300X.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ANI_ENV_FILE:-$ROOT/.env.mi300x}"
VLLM_IMAGE="${VLLM_IMAGE:-vllm/vllm-openai-rocm:v0.23.0}"
FRUQ_ARCHIVE="$ROOT/training/data/raw/FruQ-DB.zip"
FRUQ_URL="https://zenodo.org/api/records/7224690/files/FruQ-DB.zip/content"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if docker ps --format '{{.Names}}' | grep -qx 'ani-vllm'; then
  echo "ani-vllm is still using the GPU; stop it before B7 training." >&2
  exit 1
fi

mkdir -p "$ROOT/training/receipts" "$(dirname "$FRUQ_ARCHIVE")" /shared-docker/ani-artifacts
cd "$ROOT/training"

if [[ ! -f "$FRUQ_ARCHIVE" ]]; then
  curl -L --fail --silent --show-error "$FRUQ_URL" -o "$FRUQ_ARCHIVE"
fi

python3 prepare_fruq.py 2>&1 | tee receipts/data_prepare.log

docker run --rm --name ani-train \
  --network host \
  --device /dev/kfd --device /dev/dri \
  --group-add video \
  --ipc host \
  --cap-add SYS_PTRACE \
  --security-opt seccomp=unconfined \
  -e HF_HOME=/root/.cache/huggingface \
  -e GLOO_SOCKET_IFNAME=eth0 \
  -e NCCL_SOCKET_IFNAME=eth0 \
  -v /shared-docker/hf-cache:/root/.cache/huggingface \
  -v /shared-docker:/shared-docker \
  -w /shared-docker/ani/training \
  --entrypoint bash \
  "$VLLM_IMAGE" -lc \
  'python -u finetune_gemma_grader.py --epochs 1 --eval-limit 30' \
  2>&1 | tee receipts/train.log
