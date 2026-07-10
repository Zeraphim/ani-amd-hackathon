"""Ani Tier 2 — inference/orchestration API.

Run locally now:   ANI_BACKEND=langgraph uvicorn main:app --port 8000
With Fireworks:    ANI_BACKEND=fireworks FIREWORKS_API_KEY=... uvicorn main:app --port 8000
On the MI300X:     ANI_BACKEND=mi300x ANI_BASE_URL=https://<tunnel>/v1 ANI_MODEL=<your-finetune> uvicorn main:app --port 8000

Then point the web tier at it: set INFERENCE_BASE_URL=http://<host>:8000 (HF Space secret).
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backends import get_backend

app = FastAPI(title="Ani Inference", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

backend = get_backend()


class GradeReq(BaseModel):
    crop: str
    quantity_kg: float = 400
    image_data: str = ""


class MatchReq(BaseModel):
    grade: dict


class ProcessReq(BaseModel):
    crop: str
    quantity_kg: float = 400
    image_data: str = ""


@app.get("/")
def health():
    from backends import BACKEND
    return {"ok": True, "backend": BACKEND}


@app.post("/grade")
def grade(req: GradeReq):
    return backend.grade(req.crop, req.quantity_kg, req.image_data)


@app.post("/match")
def match(req: MatchReq):
    return backend.match(req.grade)


@app.post("/process")
def process(req: ProcessReq):
    return backend.process_harvest(req.crop, req.quantity_kg, req.image_data)
