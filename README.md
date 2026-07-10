---
title: Ani
emoji: 🌱
colorFrom: green
colorTo: yellow
sdk: docker
app_port: 7860
pinned: true
license: mit
---

# Ani — Agentic Cold-Chain & Market-Matching for Highland Farmers

**Ani** grades a farmer's harvest from a photo, assigns a **spoilage-urgency score**,
and matches it to live Metro Manila (NCR) demand — so Benguet produce sells before it spoils.

> Built for the AMD Developer Hackathon: ACT II — Track 3 (Unicorn).
> Judges: see **[`JUDGES_START_HERE.md`](./JUDGES_START_HERE.md)**.

## Architecture (three tiers)

| Tier | What | Where it runs |
|---|---|---|
| **1 — Web/UI** | Next.js app (this Space) | HF Space, Docker, port 7860 |
| **2 — Inference/orchestration** | FastAPI: `/grade` `/match` (`inference/`) | Local now → **AMD MI300X** at showtime |
| **3 — Models** | fine-tuned Gemma grader + reasoning + embeddings via vLLM (`training/`) | **AMD MI300X (192 GB)** |

The web tier ships a **built-in stub** so the demo runs with zero backend. Set the
`INFERENCE_BASE_URL` Space secret to point Tier 1 at the FastAPI service (Fireworks now,
MI300X later) — **no code changes**, that's the whole swap.

## Phase 0 (this scaffold)

A deployable MVP: upload/select a harvest → get an AI grade card + urgency score →
see a ranked NCR buyer match feed. Stub-powered, Benguet-localized, ready to push.

## Local dev

```bash
cd web && npm install && npm run dev     # http://localhost:3000
```

## Deploy to this Space

```bash
git add . && git commit -m "Phase 0 MVP" && git push        # HF builds the root Dockerfile
```

hi im jan

jc diamante
