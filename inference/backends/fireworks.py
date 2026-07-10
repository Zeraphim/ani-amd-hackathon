"""Fireworks (and MI300X) backend — OpenAI-compatible.

Set these env vars:
  ANI_BASE_URL   default https://api.fireworks.ai/inference/v1
                 for MI300X: your vLLM endpoint, e.g. https://<tunnel>/v1
  ANI_MODEL      default accounts/fireworks/models/gemma-3-27b-it
                 for MI300X: google/gemma-3-27b-it (or the tuned adapter name)
  FIREWORKS_API_KEY  (or any key your vLLM expects)

Every call falls back to the stub on error so the demo never hard-fails.
"""
import json
import os
import re

from openai import OpenAI
from . import stub

BASE_URL = os.getenv("ANI_BASE_URL", "https://api.fireworks.ai/inference/v1")
MODEL = os.getenv("ANI_MODEL", "accounts/fireworks/models/gemma-3-27b-it")
API_KEY = os.getenv("FIREWORKS_API_KEY", "sk-none")
SOURCE = "mi300x" if os.getenv("ANI_BACKEND") == "mi300x" else "fireworks"

_client = OpenAI(base_url=BASE_URL, api_key=API_KEY)

GRADE_SYS = (
    "You are Ani's harvest grader for Philippine highland (Benguet) vegetables. "
    "Inspect the supplied harvest photo when present. Return ONLY a JSON object with "
    "these exact keys: grade (A|B|C), score (integer 0-100), ripeness (short string), "
    "shelfLifeHours (positive integer), freshnessWindow (short string such as '2 days'), "
    "freshnessFill (integer 0-100), urgency (high|mid|low), and suggestion "
    "(one actionable sentence). Do not add markdown or extra keys."
)


def _crop_id(crop: str) -> str:
    value = crop.strip().lower()
    for known in stub.DATA:
        if value.startswith(known):
            return known
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-") or "pechay"


def _clamp_int(value, low: int, high: int) -> int:
    return max(low, min(high, int(round(float(value)))))


def _normalize_grade(data: dict, crop: str) -> dict:
    grade_value = str(data.get("grade", "")).strip().upper()
    if grade_value not in {"A", "B", "C"}:
        raise ValueError(f"invalid grade: {grade_value!r}")

    urgency = str(data.get("urgency", "")).strip().lower()
    if urgency not in {"high", "mid", "low"}:
        raise ValueError(f"invalid urgency: {urgency!r}")

    crop_id = _crop_id(crop)
    display_crop = stub.DATA.get(crop_id, {}).get("name", crop.strip() or "Pechay")
    shelf_life = _clamp_int(data["shelfLifeHours"], 1, 720)
    freshness_window = str(data.get("freshnessWindow") or "").strip()
    if not freshness_window:
        days = shelf_life / 24
        freshness_window = f"{days:g} days" if days != 1 else "1 day"

    ripeness = str(data.get("ripeness") or "").strip()
    suggestion = str(data.get("suggestion") or "").strip()
    if not ripeness or not suggestion:
        raise ValueError("ripeness and suggestion are required")

    return {
        "cropId": crop_id,
        "crop": display_crop,
        "grade": grade_value,
        "score": _clamp_int(data["score"], 0, 100),
        "ripeness": ripeness,
        "shelfLifeHours": shelf_life,
        "freshnessWindow": freshness_window,
        "freshnessFill": _clamp_int(data["freshnessFill"], 0, 100),
        "urgency": urgency,
        "suggestion": suggestion,
        "source": SOURCE,
    }


def grade(crop: str, quantity_kg: float, image_data: str = "") -> dict:
    try:
        user_content = [
            {
                "type": "text",
                "text": f"Crop: {crop}\nQuantity: {quantity_kg:g} kg\nGrade this harvest.",
            }
        ]
        if image_data:
            user_content.append(
                {"type": "image_url", "image_url": {"url": image_data}}
            )

        resp = _client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": GRADE_SYS},
                {"role": "user", "content": user_content},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        data = json.loads(resp.choices[0].message.content or "{}")
        return _normalize_grade(data, crop)
    except Exception as e:  # noqa: BLE001
        print(f"[fireworks.grade] fallback to stub: {e}")
        return stub.grade(crop, quantity_kg, image_data)


def match(grade: dict) -> dict:
    # Phase 0: reuse the grounded stub ranking (seeded from real DA/PSA prices),
    # tagged with the live source. Phase 3 upgrades this to embeddings + rerank.
    result = stub.match(grade)
    result["source"] = "stub" if (grade or {}).get("source") == "stub" else SOURCE
    return result


def process_harvest(crop: str, quantity_kg: float, image_data: str = "") -> dict:
    grade_result = grade(crop, quantity_kg, image_data)
    match_result = match(grade_result)
    return {**grade_result, **match_result}
