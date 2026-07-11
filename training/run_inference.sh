#!/usr/bin/env bash
# Tier 2 — run Ani's FastAPI backend beside vLLM on the MI300X.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ANI_ENV_FILE:-$REPO_ROOT/.env.mi300x}"
PYTHON_BIN="${PYTHON_BIN:-$REPO_ROOT/.venv-inference/bin/python}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

: "${ANI_BACKEND:?Set ANI_BACKEND=mi300x}"
: "${ANI_BASE_URL:?Set ANI_BASE_URL to the local vLLM /v1 endpoint}"
: "${ANI_MODEL:?Set ANI_MODEL to the served Gemma 3 model id}"
: "${FIREWORKS_API_KEY:?Set FIREWORKS_API_KEY to the private vLLM API key}"

cd "$REPO_ROOT/inference"
exec "$PYTHON_BIN" -m uvicorn main:app \
  --host "${ANI_API_HOST:-127.0.0.1}" \
  --port "${ANI_API_PORT:-8000}"
