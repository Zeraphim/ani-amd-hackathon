# Tier 2 — Inference / Orchestration (FastAPI)

Exposes `/grade` and `/match`. Three interchangeable backends via `ANI_BACKEND`:

| `ANI_BACKEND` | Behavior | When |
|---|---|---|
| `stub` (default) | Canned Benguet/NCR data, no network | Now, zero cost |
| `fireworks` | Real Gemma via Fireworks (OpenAI-compatible) | Now, real outputs |
| `mi300x` | Same client, `ANI_BASE_URL` → your vLLM endpoint | Showtime |

## Run
```bash
cd inference
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

ANI_BACKEND=stub uvicorn main:app --port 8000
# real:  ANI_BACKEND=fireworks FIREWORKS_API_KEY=... uvicorn main:app --port 8000
```

## Connect the web tier
Set the HF Space secret `INFERENCE_BASE_URL=http://<this-host>:8000`.
The web tier auto-detects it; if unreachable it falls back to its own stub, so the
demo never breaks.

## Swap to the MI300X (Phase 5)
```bash
ANI_BACKEND=mi300x \
ANI_BASE_URL=https://<cloudflare-tunnel>/v1 \
ANI_MODEL=ani/gemma-grader-lora \
uvicorn main:app --port 8000
```
No web-tier changes. That is the whole swap.
