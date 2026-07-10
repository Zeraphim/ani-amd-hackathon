#!/usr/bin/env bash
# Load Track B's root-only environment, then run the receipt-producing server.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ANI_ENV_FILE:-$REPO_ROOT/.env.mi300x}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing environment file: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

export HF_HOME="${HF_HOME:-/shared-docker/hf-cache}"
exec "$SCRIPT_DIR/serve_vllm.sh"
