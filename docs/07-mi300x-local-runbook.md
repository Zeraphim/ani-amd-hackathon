# 07 · MI300X local development runbook

This is the current, copy-paste procedure for running Ani from a Mac while Gemma
inference stays on the AMD MI300X. It is the supporting runbook for Track B3
(vLLM serving) and B5 (FastAPI orchestration).

The local development path is:

```text
Browser -> Next.js on the Mac -> SSH tunnel -> FastAPI on the MI300X -> vLLM/Gemma on the MI300X
```

Only FastAPI and vLLM use the card. The web app stays local. Both remote services
bind to loopback, so the model endpoint is never exposed directly to the internet.

## Before you start

You need a Mac with Node.js/npm and SSH, plus an MI300X host with ROCm and Docker.
Set these variables in each new Mac terminal; use your own host, user, and private-key
path. Do not put real values in this document or commit them to the repository.

```bash
export MI300X_HOST=<public-ip-or-hostname>
export MI300X_USER=<remote-user>
export MI300X_SSH_KEY=<path-to-private-key>
```

Connect with:

```bash
ssh -i "$MI300X_SSH_KEY" -o IdentitiesOnly=yes "$MI300X_USER@$MI300X_HOST"
```

After connecting, set the repository location in the **MI300X shell** (SSH does not
forward this variable from the Mac by default):

```bash
export ANI_REPO_DIR=/shared-docker/ani
```

> The verified card is an AMD Instinct MI300X (`gfx942`). Check the live state before
> changing anything: an already-running shared demo should not be restarted casually.

```bash
rocm-smi --showproductname --showdriverversion --showmeminfo vram
docker ps --filter name=ani-vllm
curl -fsS http://127.0.0.1:8000/
```

Expected FastAPI output is `{"ok":true,"backend":"mi300x"}`. A real B3 restart
refreshes `training/receipts/vllm_serve.log`; do not replace committed receipts just to
perform ordinary local UI work.

## First-time remote setup

The launchers expect the repository at `$ANI_REPO_DIR`, its Python environment at
`$ANI_REPO_DIR/.venv-inference`, and the vLLM cache under `/shared-docker/hf-cache`.
Use a clone or synchronize the commit you intend to run. A fresh clone does **not**
include uncommitted work from your Mac.

```bash
git clone <your-repository-url> "$ANI_REPO_DIR"
cd "$ANI_REPO_DIR"
python3 -m venv .venv-inference
.venv-inference/bin/python -m pip install --upgrade pip
.venv-inference/bin/python -m pip install -r inference/requirements.txt
```

Create the private MI300X environment file from the tracked template:

```bash
cp docs/templates/mi300x.env.example .env.mi300x
chmod 600 .env.mi300x
```

Set a new private vLLM token after `FIREWORKS_API_KEY=` in `.env.mi300x`; its historical
variable name is `FIREWORKS_API_KEY`, but on this path it is the bearer token shared by
FastAPI and vLLM. For example:

```bash
openssl rand -hex 32
```

Paste the generated value after the equals sign. Do not reuse a Fireworks credential and do
not print the value in terminal output.

If the Hugging Face cache is cold, first accept the Gemma 3 access terms with your
Hugging Face account. Set the private `HUGGINGFACE_TOKEN` value in `.env.mi300x`, then
authenticate the cache. The token stays private.

```bash
cd "$ANI_REPO_DIR"
set -a
source .env.mi300x
set +a
HF_HOME="$HF_HOME" huggingface-cli login --token "$HUGGINGFACE_TOKEN"
unset HUGGINGFACE_TOKEN
```

The template selects the existing `ani-grader` adapter. To serve the base model only,
set `ANI_MODEL=google/gemma-3-27b-it` and leave `ANI_LORA_PATH` and `ANI_LORA_NAME`
empty.

## Start Tier 3 and Tier 2

Run each command in its own MI300X terminal and leave both running. Do not start a
second vLLM container while `ani-vllm` already appears in `docker ps`.

Terminal 1 — Gemma 3 vLLM on `127.0.0.1:8001`:

```bash
cd "$ANI_REPO_DIR"
ANI_ENV_FILE="$ANI_REPO_DIR/.env.mi300x" ./training/run_vllm.sh
```

Terminal 2 — Ani FastAPI on `127.0.0.1:8000`:

```bash
cd "$ANI_REPO_DIR"
ANI_ENV_FILE="$ANI_REPO_DIR/.env.mi300x" ./training/run_inference.sh
```

The launchers retain the required B3 receipt at
`training/receipts/vllm_serve.log`. `run_vllm.sh` serves the base model named by
`ANI_BASE_MODEL`; FastAPI requests the adapter named by `ANI_MODEL`.

## Verify the remote stack

On the MI300X, verify FastAPI first. Then authenticate the model-list request without
printing the private token:

```bash
cd "$ANI_REPO_DIR"
set -a
source .env.mi300x
set +a

curl -fsS http://127.0.0.1:8000/
curl -fsS -H "Authorization: Bearer $FIREWORKS_API_KEY" \
  http://127.0.0.1:8001/v1/models
```

The model list must include `google/gemma-3-27b-it`; when the adapter is configured,
it must also include `ani-grader`.

For an end-to-end photo request, run this from the repository root on the MI300X:

```bash
IMAGE_DATA="data:image/jpeg;base64,$(base64 -w 0 web/public/Pechay_B12.jpg)"
curl -fsS http://127.0.0.1:8000/process \
  -H 'content-type: application/json' \
  --data "{\"crop\":\"pechay\",\"quantity_kg\":400,\"image_data\":\"$IMAGE_DATA\"}"
```

The response must contain `"source":"mi300x"`. If it instead reports `stub`, check
the FastAPI terminal for the upstream vLLM error before changing the web app.

## Run the web app locally through SSH

On the Mac, create the local web environment file only when it does not already exist.
If `web/.env.local` exists, retain its unrelated entries and ensure that its
`INFERENCE_BASE_URL` line has the value shown in the template.

```bash
cd <local-repository-path>
cp -n docs/templates/web.local.env.example web/.env.local
```

In one Mac terminal, forward local port 8000 to FastAPI on the card:

```bash
ssh -N \
  -i "$MI300X_SSH_KEY" \
  -o IdentitiesOnly=yes \
  -L 8000:127.0.0.1:8000 \
  "$MI300X_USER@$MI300X_HOST"
```

In another Mac terminal, start the web tier:

```bash
cd <local-repository-path>/web
npm install
npm run dev
```

Open `http://localhost:3000`, submit a harvest photo, and inspect the `/api/analyze`
or `/api/process` response in browser DevTools. It must return `source: "mi300x"`.
If the tunnel or card is unavailable, the web route intentionally falls back to its
built-in stub; that is expected safety behavior, not a reason to remove the fallback.

## Optional: live Vercel handoff

For a public demo, use a pre-provisioned **named** Cloudflare tunnel that forwards only
to `http://127.0.0.1:8000`. Do not publish port 8001. Keep the tunnel identity and
credentials outside the repository.

```bash
export CLOUDFLARE_CONFIG=<path-to-private-cloudflared-config>
export CLOUDFLARE_TUNNEL_NAME=<named-tunnel>
cloudflared --config "$CLOUDFLARE_CONFIG" tunnel run "$CLOUDFLARE_TUNNEL_NAME"
```

Set Vercel's `INFERENCE_BASE_URL` to the named FastAPI URL (without a trailing slash),
redeploy, and verify a browser request returns `source: "mi300x"`. This is the approved
Decision E1 path; do not claim a Fireworks result.

## Recovery notes

- `docker ps` shows `ani-vllm`: reuse it; do not launch another container with the same name.
- FastAPI is down but vLLM is healthy: restart only `./training/run_inference.sh`.
- vLLM is down: inspect `training/receipts/vllm_serve.log`, then start
  `./training/run_vllm.sh` and wait for the model endpoint before starting FastAPI.
- A cold first request can be slower while Triton compiles kernels; retry only after the
  health and model-list checks pass.
- Destroy the MI300X instance when it is no longer needed; powering it off does not stop
  all AMD Dev Cloud charges.
