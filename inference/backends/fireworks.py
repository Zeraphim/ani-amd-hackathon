"""Fireworks (and MI300X) backend — OpenAI-compatible.

Set these env vars:
  ANI_BASE_URL   default https://api.fireworks.ai/inference/v1
                 for MI300X: your vLLM endpoint, e.g. https://<tunnel>/v1
  ANI_MODEL      default accounts/fireworks/models/gemma-4-31b-it (swap to your fine-tune)
  FIREWORKS_API_KEY  (or any key your vLLM expects)

Every call falls back to the stub on error so the demo never hard-fails.
"""
import json
import os

from openai import OpenAI
from . import stub

BASE_URL = os.getenv("ANI_BASE_URL", "https://api.fireworks.ai/inference/v1")
MODEL = os.getenv("ANI_MODEL", "accounts/fireworks/models/gemma-4-31b-it")
API_KEY = os.getenv("FIREWORKS_API_KEY", "sk-none")
SOURCE = "mi300x" if os.getenv("ANI_BACKEND") == "mi300x" else "fireworks"

_client = OpenAI(base_url=BASE_URL, api_key=API_KEY)

GRADE_SYS = (
    "You are Ani's harvest grader for Philippine highland (Benguet) vegetables. "
    "Given a crop and quantity, return ONLY JSON with keys: grade (A|B|C), "
    "qualityScore (0-10 float), ripeness (str), shelfLifeHours (int), "
    "urgency (0-10 float, higher = more perishable/urgent to dispatch), "
    "spoilageWindow (str), suggestion (str, one actionable sentence)."
)


def grade(crop: str, quantity_kg: float) -> dict:
    try:
        resp = _client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": GRADE_SYS},
                {"role": "user", "content": f"Crop: {crop}\nQuantity: {quantity_kg} kg"},
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        data = json.loads(resp.choices[0].message.content)
        data["crop"] = crop
        data["source"] = SOURCE
        return data
    except Exception as e:  # noqa: BLE001
        print(f"[fireworks.grade] fallback to stub: {e}")
        return stub.grade(crop, quantity_kg)


def match(grade: dict) -> dict:
    # Phase 0: reuse the grounded stub ranking (seeded from real DA/PSA prices),
    # tagged with the live source. Phase 3 upgrades this to embeddings + rerank.
    result = stub.match(grade)
    result["source"] = SOURCE
    return result
