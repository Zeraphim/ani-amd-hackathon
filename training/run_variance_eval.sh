#!/usr/bin/env bash
# Variance eval — re-run the B7 LoRA fine-tune + eval across several seeds so we can
# report base-vs-tuned grading accuracy as mean +/- std (the ENFORCERS "N runs,
# low variance" move) instead of a single, easy-to-doubt 100%.
#
# IMPORTANT: this RE-TRAINS the adapter per seed (each run loads Gemma-3-27B and
# trains on 240 examples), so it burns GPU time. Keep SEEDS small. Uses the FULL
# 60-example eval split (--eval-limit 60), not the default 30, for tighter CIs.
#
# Run from the MI300X, same environment as run_finetune.sh:
#   SEEDS="42 7 123" bash run_variance_eval.sh
# Then aggregate locally:
#   python3 aggregate_metrics.py
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ANI_ENV_FILE:-$ROOT/.env.mi300x}"
VLLM_IMAGE="${VLLM_IMAGE:-vllm/vllm-openai-rocm:v0.23.0}"
SEEDS="${SEEDS:-42 7 123}"
EVAL_LIMIT="${EVAL_LIMIT:-60}"
EPOCHS="${EPOCHS:-1}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if docker ps --format '{{.Names}}' | grep -qx 'ani-vllm'; then
  echo "ani-vllm is still using the GPU; stop it before variance training." >&2
  exit 1
fi

cd "$ROOT/training"
VAR_DIR="receipts/variance"
mkdir -p "$VAR_DIR" /shared-docker/ani-artifacts

# Ensure the dataset is prepared once up front (idempotent).
if [[ ! -f "training/data/produce_grades.jsonl" && ! -f "data/produce_grades.jsonl" ]]; then
  python3 prepare_fruq.py 2>&1 | tee "$VAR_DIR/data_prepare.log"
fi

echo "[variance] seeds=[$SEEDS] eval_limit=$EVAL_LIMIT epochs=$EPOCHS"
for SEED in $SEEDS; do
  echo "== seed $SEED =="
  docker run --rm --name "ani-train-$SEED" \
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
    "python -u finetune_gemma_grader.py --epochs $EPOCHS --eval-limit $EVAL_LIMIT --seed $SEED" \
    2>&1 | tee "$VAR_DIR/train_seed${SEED}.log"

  # finetune writes receipts/b7_metrics.json each run; archive it per seed.
  if [[ -f receipts/b7_metrics.json ]]; then
    cp receipts/b7_metrics.json "$VAR_DIR/b7_metrics_seed${SEED}.json"
    echo "[variance] saved $VAR_DIR/b7_metrics_seed${SEED}.json"
  else
    echo "[variance] WARNING: receipts/b7_metrics.json not found for seed $SEED" >&2
  fi
done

echo "[variance] done. Now run:  python3 aggregate_metrics.py"
