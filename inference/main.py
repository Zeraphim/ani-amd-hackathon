"""Ani Tier 2 — inference/orchestration API.

Run locally now:   ANI_BACKEND=langgraph uvicorn main:app --port 8000
With Fireworks:    ANI_BACKEND=fireworks FIREWORKS_API_KEY=... uvicorn main:app --port 7999
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
    location: str = "La Trinidad, Benguet"
    quantity_kg: float = 400
    image_data: str = ""


class MatchReq(BaseModel):
    grade: dict
    location: str = "La Trinidad, Benguet"


class ProcessReq(BaseModel):
    crop: str
    location: str = "La Trinidad, Benguet"
    quantity_kg: float = 400
    image_data: str = ""


class AnalyzeReq(BaseModel):
    image_data: str = ""
    location: str = "La Trinidad, Benguet"


@app.get("/")
def health():
    from backends import BACKEND
    return {"ok": True, "backend": BACKEND}


@app.post("/grade")
def grade(req: GradeReq):
    print(f"\n[MAIN] Received grade request for crop: '{req.crop}' from '{req.location}' with image: {'YES' if req.image_data else 'NO'}")
    return backend.grade(req.crop, req.quantity_kg, req.image_data, req.location)


@app.post("/match")
def match(req: MatchReq):
    return backend.match(req.grade, req.location)


@app.post("/process")
def process(req: ProcessReq):
    print(f"\n[MAIN] Process complete pipeline for crop: '{req.crop}' from '{req.location}'")
    return backend.process_harvest(req.crop, req.quantity_kg, req.image_data, req.location)


@app.post("/analyze")
def analyze(req: AnalyzeReq):
    """Photo-first entry point: one vision pass reads the photo and returns the
    full grade PLUS the detected crop and an estimated volume. The web tier caches
    this and reuses the grade for /match, so 'Grade & match' costs no extra pass."""
    print(f"\n[MAIN] Analyze photo (image: {'YES' if req.image_data else 'NO'}) from '{req.location}'")
    return backend.analyze(req.image_data, req.location)
