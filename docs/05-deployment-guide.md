# 05 · End-to-End Deployment Guide (Vercel + Fireworks + AMD Developer Cloud)
### A for-dummies, step-by-step walkthrough — no prior deploy experience assumed

*Read `04-system-overview.md` first for the mental model. This doc is the "how do I actually
click the buttons" version, for two states: **Phase A** (deploy today, no AMD hardware needed)
and **Phase B** (swap in the AMD MI300X at showtime).*

---

## 0. The one-sentence version

Tier 1 (the Next.js web app) deploys to **Vercel** and never changes. Everything else — where
the AI actually runs — is controlled by two environment variables. Today those variables point
at **Fireworks AI** (hosted Gemma). At showtime you flip them to point at your **AMD MI300X**
instead. Same code, no rewrite.

```
Vercel (Tier 1: Web)  --INFERENCE_BASE_URL-->  Tier 2 (Inference)  --ANI_BASE_URL-->  Tier 3 (Model)
                                                     ANI_BACKEND = stub | fireworks | mi300x
```

---

## 1. Accounts you need (do this first)

| # | What | Where | Why |
|---|---|---|---|
| 1 | Vercel account | [vercel.com](https://vercel.com) — sign in with GitHub | Hosts Tier 1 (the web app judges open) |
| 2 | GitHub repo | push this project to a repo Vercel can see | Vercel deploys from git |
| 3 | Fireworks AI account | [app.fireworks.ai](https://app.fireworks.ai) | Gives you an API key + credits to run Gemma today |
| 4 | AMD Developer Cloud account | [devcloud.amd.com](https://devcloud.amd.com) | Gives you the MI300X GPU for showtime |
| 5 | Cloudflare account (free) | [dash.cloudflare.com](https://dash.cloudflare.com) | Exposes the MI300X box over HTTPS safely |

You said you already have AMD Cloud + Fireworks credits — so #3 and #4 are just "log in and
grab your key/instance," not "apply and wait."

---

## 2. Phase A — Deploy the web tier today (Vercel)

**Goal:** a live, public URL judges can open right now, with zero AMD hardware involved.

### Step 1 — Push the repo to GitHub
```bash
cd ani-amd-hackathon
git init                       # skip if already a git repo
git add .
git commit -m "Phase A: web deploy"
git branch -M main
git remote add origin https://github.com/<you>/ani.git
git push -u origin main
```

### Step 2 — Import into Vercel
1. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → pick your repo.
2. When it asks for the **Root Directory**, set it to `web` (the Next.js app lives in
   `ani-amd-hackathon/web/`, not the repo root — the repo root `Dockerfile` is for the
   Hugging Face Space path and Vercel ignores it).
3. Framework preset: Vercel auto-detects **Next.js**. Leave build command / output as default.
4. Click **Deploy**.

That's it — after the build finishes you get a URL like `https://ani-xyz.vercel.app`. Open it.
Because no environment variables are set yet, the app runs on its **built-in stub** — it will
work and look complete, just with canned data. This is intentional and matches how the repo is
designed (`web/app/api/grade/route.ts` falls back to the stub whenever `INFERENCE_BASE_URL` is
unset or unreachable).

**Checkpoint:** you now have a live, judge-shareable URL. Everything below is about making the
data behind it real.

---

## 3. Phase A, continued — Wire in real AI via Fireworks

Right now Tier 1 is stub-only. To get real Gemma output, you need Tier 2 (the FastAPI service
in `inference/`) running somewhere reachable over HTTPS, talking to Fireworks.

### Step 1 — Get a Fireworks API key
1. Log into [app.fireworks.ai](https://app.fireworks.ai).
2. Go to **API Keys** → create a new key. Copy it — you'll paste it as `FIREWORKS_API_KEY`.

### Step 2 — Run Tier 2 somewhere with a stable URL
You have two easy options; pick whichever is less friction for you.

**Option A — Quick and free: Railway or Render**
1. Create a new service, connect the same GitHub repo, set the root/working directory to
   `inference`.
2. Build/start command:
   ```bash
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
3. Set environment variables on that service:
   - `ANI_BACKEND=fireworks`
   - `FIREWORKS_API_KEY=<your key>`
4. Deploy. You'll get a URL like `https://ani-inference.up.railway.app`.

**Option B — Run it locally and skip ahead**
If you just want to sanity-check the pipeline before deploying Tier 2 anywhere public:
```bash
cd inference
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
ANI_BACKEND=fireworks FIREWORKS_API_KEY=<your key> uvicorn main:app --port 8000
```
This only works for local testing (Vercel can't reach `localhost`) — use Option A for the
actual deploy.

### Step 3 — Point Vercel at Tier 2
1. In the Vercel dashboard: **Project → Settings → Environment Variables**.
2. Add `INFERENCE_BASE_URL` = the Tier 2 URL from Step 2 (e.g.
   `https://ani-inference.up.railway.app`), no trailing slash.
3. **Redeploy** (Vercel → Deployments → ⋯ → Redeploy) so the new env var takes effect.

**Checkpoint:** reload the Vercel URL, grade a harvest — the response now comes from real
Gemma via Fireworks. If Tier 2 is ever unreachable, the app silently falls back to the stub, so
you can never end up with a broken demo.

---

## 4. Phase B — Swap in the AMD MI300X at showtime

**Goal:** move Tier 2 + Tier 3 onto your AMD MI300X so the whole agentic stack runs on one AMD
card. Tier 1 on Vercel is **not touched** — only env vars change.

### Step 1 — Spin up the MI300X
1. Log into [devcloud.amd.com](https://devcloud.amd.com).
2. Launch a **1x MI300X** instance (192 GB HBM3) — the small configuration is enough for one
   Gemma model. It comes with ROCm + Docker pre-installed.
3. Once the instance is running, the AMD DevCloud portal will show:
   - **Instance name** (e.g., `0.23.0-gpu-mi300x1-192gb-devcloud-atl1`)
   - **Public IPv4** (reachable from the internet — you'll use this for SSH)
   - **Private IP** (used only for internal node-to-node communication on the cloud VLAN — ignore for SSH)
4. SSH into the instance using the public IPv4:
   ```bash
   ssh -p 2222 amdepyc@<PUBLIC_IPV4>
   ```
   *AMD DevCloud instances listen on **port 2222** (not the default port 22). The username is `amdepyc`.*
   If you set up an SSH key in the DevCloud portal, it works automatically. If you used a password, you'll be prompted for it.

### Step 2 — Serve Gemma with vLLM on the card
The repo already has this scripted:
```bash
# on the MI300X instance
git clone https://github.com/<you>/ani.git && cd ani/training
pip install -r requirements.txt
bash serve_vllm.sh
```
This runs `vllm serve` on port 8001 and writes `receipts/rocm-smi.log` +
`receipts/vllm_serve.log` — keep those, they're your AMD proof for judging. To serve your
fine-tuned adapter instead of the base model:
```bash
ANI_MODEL=ani/gemma-grader-lora bash serve_vllm.sh
```

### Step 3 — Run Tier 2 (FastAPI) on the same box
Co-locating Tier 2 with Tier 3 on one card is the whole point of the AMD story.
```bash
cd ../inference
pip install -r requirements.txt
ANI_BACKEND=mi300x \
ANI_BASE_URL=http://localhost:8001/v1 \
ANI_MODEL=ani/gemma-grader-lora \
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Step 4 — Expose the box over HTTPS with a Cloudflare Tunnel
The MI300X instance doesn't have a public HTTPS endpoint by default, and you don't want to open
raw ports to the internet. A tunnel solves both:
```bash
# on the MI300X instance
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
./cloudflared tunnel --url http://localhost:8000
```
This prints a public URL like `https://random-words-1234.trycloudflare.com`. That's your
Tier 2 endpoint. (For a stable, non-random subdomain, set up a named tunnel with a Cloudflare
account instead of the quick-tunnel command — worth doing the night before judging so the URL
doesn't change mid-demo.)

### Step 5 — Point Vercel at the tunnel
1. Back in Vercel → **Settings → Environment Variables**, update `INFERENCE_BASE_URL` to the
   Cloudflare Tunnel URL from Step 4 (e.g. `https://random-words-1234.trycloudflare.com`).
2. Redeploy.

**Checkpoint:** reload the Vercel URL, grade a harvest — the request now flows
`Vercel → Cloudflare Tunnel → FastAPI on the MI300X → vLLM/Gemma on the same MI300X`. Keep the
MI300X instance and the `cloudflared` process running for the entire judging window — if either
dies, Tier 1 silently falls back to the stub rather than showing an error, but you'll want the
real thing live.

---

## 5. Environment variable cheat sheet

| Var | Set where | Values | Purpose |
|---|---|---|---|
| `INFERENCE_BASE_URL` | Vercel project env vars | unset, Fireworks-fronting Tier 2 URL, or Cloudflare Tunnel URL | Tier 1 → Tier 2. Unset = stub. |
| `ANI_BACKEND` | Wherever Tier 2 (FastAPI) runs | `stub` \| `fireworks` \| `mi300x` | Picks Tier 2's model backend |
| `ANI_BASE_URL` | Same as above | `https://api.fireworks.ai/inference/v1` or `http://localhost:8001/v1` (MI300X) | Tier 2 → Tier 3 endpoint |
| `ANI_MODEL` | Same as above | e.g. `accounts/fireworks/models/gemma-4-31b-it` or `ani/gemma-grader-lora` | Which model to call |
| `FIREWORKS_API_KEY` | Same as above (Phase A only) | your Fireworks key | Auth for Fireworks calls |

---

## 6. Verification checklist

- [ ] Vercel URL loads and the UI renders (Phase A, Step 2)
- [ ] Grading a harvest returns data tagged `"source": "fireworks"` (not `"stub"`) once Phase A
      Step 3 is wired up — check the JSON response or network tab
- [ ] Tier 2 health check returns ok: `curl <tier2-url>/` → `{"ok": true, "backend": "fireworks"}`
- [ ] (Showtime) `rocm-smi` on the MI300X shows the GPU active while vLLM is serving
- [ ] (Showtime) `curl <cloudflare-tunnel-url>/` from *outside* the MI300X box succeeds
- [ ] (Showtime) grading returns `"source": "mi300x"`
- [ ] Space/Vercel deploy stays warm — open it right before judging so there's no cold start
- [ ] Fallback works on purpose: stop Tier 2 and confirm Tier 1 still renders (via stub) instead
      of erroring

---

## 7. Common pitfalls

- **Vercel build fails / wrong app shown.** You forgot to set Root Directory to `web` in the
  Vercel import step — Vercel is trying to build the monorepo root instead of the Next app.
- **Env var changes don't seem to apply.** Vercel requires a manual redeploy after adding/editing
  env vars in the dashboard — it doesn't hot-reload existing deployments.
- **Grading always returns stub data even after setting `INFERENCE_BASE_URL`.** Check for a
  trailing slash mismatch, or that Tier 2 is actually reachable (`curl` it directly). Recall:
  Tier 1 *silently* falls back to stub on any fetch failure — great for demo safety, confusing
  for debugging. Check Tier 2's own logs/health endpoint first.
- **Cloudflare quick-tunnel URL changed overnight.** The free `--url` quick tunnel gives you a
  random URL each time you start it — restart it and forget to update Vercel's env var, and
  you're back on the stub. Use a named tunnel for anything you need stable overnight.
- **MI300X billed while "off."** AMD Developer Cloud still bills a powered-off instance (disk/IP
  reserved). Destroy the instance when you're fully done, not just powered off, to stop the
  credit burn.

---

*See also: `03-tier-architecture.md`, `04-system-overview.md`, `../ani-nextjs-hfspaces-architecture.md`.*
