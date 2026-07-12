#!/usr/bin/env bash
# Capture repeated ROCm telemetry while the real image /process path is active.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
mkdir -p receipts

BASE_URL="${ANI_PROCESS_URL:-http://127.0.0.1:8000}"
REQUESTS="${REQUESTS:-12}"
CONCURRENCY="${CONCURRENCY:-2}"
SAMPLES="${SAMPLES:-8}"
OUT="receipts/rocm-smi-loaded.log"
LOAD_JSON="/tmp/ani-capture-load.json"
LOAD_LOG="/tmp/ani-capture-load.log"

echo "[capture] generating sustained end-to-end image inference load..."
python3 bench_latency.py \
  --base-url "$BASE_URL" \
  --n "$REQUESTS" \
  --concurrency "$CONCURRENCY" \
  --warmup 1 \
  --output "$LOAD_JSON" \
  >"$LOAD_LOG" 2>&1 &
LOAD_PID=$!

sleep 3
echo "[capture] collecting $SAMPLES ROCm samples during inference..."
{
  echo "# Captured during end-to-end image inference; repeated samples show loaded VRAM and transient GPU utilization."
  date -Is
  rocm-smi --version
  for SAMPLE in $(seq 1 "$SAMPLES"); do
    echo
    echo "## sample $SAMPLE"
    date -Is
    rocm-smi --showproductname --showdriverversion --showmeminfo vram --showuse
    sleep 2
  done
} 2>&1 | tee "$OUT"

if ! wait "$LOAD_PID"; then
  cat "$LOAD_LOG" >&2
  exit 1
fi
cat "$LOAD_LOG"
echo "[capture] wrote $OUT"
