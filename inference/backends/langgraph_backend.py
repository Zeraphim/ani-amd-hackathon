"""LangGraph backend with a Gemma 3 grading path and safe stub fallback."""

import csv
import json
import os
from pathlib import Path
from typing import TypedDict

import numpy as np
from openai import OpenAI
from pydantic import BaseModel

from . import stub

try:
    from langgraph.graph import END, START, StateGraph
except ImportError:
    END = "__end__"
    START = "__start__"
    StateGraph = None

FIREWORKS_API_KEY = os.getenv("FIREWORKS_API_KEY", "")
BASE_URL = os.getenv("ANI_BASE_URL", "https://api.fireworks.ai/inference/v1")
MODEL = os.getenv("ANI_MODEL", "accounts/fireworks/models/gemma-3-27b-it")
DATA_DIR = Path(__file__).parent.parent / "data"
CSV_PATH = DATA_DIR / "ncr_prices.csv"


class HarvestState(TypedDict, total=False):
    crop_type: str
    quantity: int
    image_data: str
    location: str
    is_crop: bool
    error_message: str
    cropId: str
    crop: str
    grade: str
    score: float
    ripeness: str
    shelfLifeHours: int
    freshnessWindow: str
    freshnessFill: int
    urgency: str
    suggestion: str
    source: str
    buyers: list
    matched_buyer: str
    dispatch: dict


class GraderOutput(BaseModel):
    is_crop: bool
    error_message: str
    grade: str
    score: float
    ripeness: str
    shelfLifeHours: int
    freshnessWindow: str
    freshnessFill: int
    urgency: str
    suggestion: str


class AnalyzeOutput(BaseModel):
    # Photo-first: identify + estimate + grade in one vision pass.
    is_crop: bool
    error_message: str
    crop: str
    cropConfidence: int
    volumeKg: float
    volumeConfidence: int
    grade: str
    score: float
    ripeness: str
    shelfLifeHours: int
    freshnessWindow: str
    freshnessFill: int
    urgency: str
    suggestion: str


def _client() -> OpenAI:
    return OpenAI(base_url=BASE_URL, api_key=FIREWORKS_API_KEY or "sk-none")


def _crop_id(crop: str) -> str:
    normalized = crop.strip().lower()
    return normalized if normalized in stub.DATA else "pechay"


def get_embedding(text: str) -> np.ndarray:
    response = _client().embeddings.create(
        model="nomic-ai/nomic-embed-text-v1.5",
        input=text,
    )
    return np.array(response.data[0].embedding)


def _load_buyers() -> list[dict]:
    with open(CSV_PATH, "r", encoding="utf-8") as handle:
        rows = [row for row in csv.reader(handle) if row and not row[0].startswith("#")]

    rows = [row for row in rows if len(row) >= 5]
    if not rows:
        raise ValueError("no usable market-price rows")

    latest_date = max(row[4] for row in rows)
    buyers = []
    for row in rows:
        if row[4] != latest_date:
            continue
        profile = (
            f"{row[0]} wholesale market needs {row[1]}. "
            f"Price is {row[2]} PHP/kg. Demand is {row[3]}."
        )
        buyers.append(
            {
                "market": row[0],
                "commodity": row[1],
                "price_php_per_kg": int(row[2]),
                "demand": row[3],
                "vector": get_embedding(profile),
            }
        )
    if not buyers:
        raise ValueError("no buyers for latest market-price date")
    return buyers


def harvest_grader_node(state: HarvestState) -> dict:
    crop = state["crop_type"]
    image_data = state.get("image_data", "")
    prompt = (
        "You are an expert crop grader for Philippine highland vegetables. "
        f"We have {state['quantity']}kg of {crop}. "
        "Verify that the image contains an edible crop, vegetable, or fruit. "
        "If it does not, or the crop is completely spoiled, set is_crop to false and "
        "explain why in error_message. Overripe but edible crops remain valid and should "
        "receive a lower grade. Return the GraderOutput JSON schema."
    )
    messages = [{"role": "user", "content": [{"type": "text", "text": prompt}]}]
    if image_data:
        messages[0]["content"].append({"type": "image_url", "image_url": {"url": image_data}})

    try:
        response = _client().chat.completions.create(
            model=MODEL,
            messages=messages,
            response_format={"type": "json_object", "schema": GraderOutput.model_json_schema()},
            temperature=0.1,
        )
        result = json.loads(response.choices[0].message.content or "{}")
        GraderOutput.model_validate(result)
        return {
            **result,
            "cropId": _crop_id(crop),
            "crop": stub.DATA.get(_crop_id(crop), {}).get("name", crop),
            "source": "langgraph",
        }
    except Exception as error:  # noqa: BLE001
        print(f"[langgraph.grade] fallback to stub: {error}")
        return {
            **stub.grade(crop, state["quantity"], image_data, state.get("location", "La Trinidad, Benguet")),
            "is_crop": True,
            "error_message": "",
        }


def grade_is_crop(state: HarvestState) -> str:
    return END if not state.get("is_crop", True) else "demand_oracle"


def demand_oracle_node(state: HarvestState) -> dict:
    grade_dict = {
        key: state.get(key)
        for key in (
            "cropId", "crop", "grade", "score", "ripeness", "shelfLifeHours",
            "freshnessWindow", "freshnessFill", "urgency", "suggestion", "source",
        )
    }
    location = state.get("location", "La Trinidad, Benguet")
    try:
        buyers = _load_buyers()
        harvest_text = (
            f"{state['quantity']}kg of Grade {state['grade']} {state['crop_type']} "
            f"located in {location}."
        )
        harvest_vector = get_embedding(harvest_text)
        scored = []
        for buyer in buyers:
            denominator = np.linalg.norm(harvest_vector) * np.linalg.norm(buyer["vector"])
            if denominator:
                scored.append((float(np.dot(harvest_vector, buyer["vector"]) / denominator), buyer))
        top_matches = sorted(scored, key=lambda entry: entry[0], reverse=True)[:3]
        if not top_matches:
            raise ValueError("no ranked buyers")
        return {
            "buyers": [
                {
                    "buyer": f"{buyer['market']} Wholesale",
                    "sub": "Top market match based on current demand",
                    "pricePerKg": buyer["price_php_per_kg"],
                    "trend": buyer["demand"] if buyer["demand"] in {"Surging", "Rising", "Stable"} else "Stable",
                    "fit": f"{int(score * 100)}% fit",
                    "first": index == 0,
                }
                for index, (score, buyer) in enumerate(top_matches)
            ],
            "matched_buyer": top_matches[0][1]["market"],
            "source": "langgraph",
        }
    except Exception as error:  # noqa: BLE001
        print(f"[langgraph.match] fallback to stub: {error}")
        fallback = stub.match(grade_dict, location)
        return {
            "buyers": fallback["buyers"],
            "matched_buyer": fallback["dispatch"]["to"],
            "source": "stub",
        }


def logistics_router_node(state: HarvestState) -> dict:
    if state.get("source") == "stub":
        return {"dispatch": stub.match({"cropId": state.get("cropId")}, state.get("location", ""))["dispatch"]}
    return {
        "dispatch": {
            "to": state.get("matched_buyer", "NCR market"),
            "eta": "6h · market route planned",
            "load": f"{state['quantity'] / 1000:g}t matched",
        }
    }


def build_graph():
    if StateGraph is None:
        print("[langgraph] package unavailable; using direct safe-fallback flow")
        return None
    builder = StateGraph(HarvestState)
    builder.add_node("harvest_grader", harvest_grader_node)
    builder.add_node("demand_oracle", demand_oracle_node)
    builder.add_node("logistics_router", logistics_router_node)
    builder.add_edge(START, "harvest_grader")
    builder.add_conditional_edges("harvest_grader", grade_is_crop)
    builder.add_edge("demand_oracle", "logistics_router")
    builder.add_edge("logistics_router", END)
    return builder.compile()


ani_app = build_graph()


def grade(
    crop: str,
    quantity_kg: float,
    image_data: str = "",
    location: str = "La Trinidad, Benguet",
) -> dict:
    result = harvest_grader_node(
        {"crop_type": crop, "quantity": int(quantity_kg), "image_data": image_data, "location": location}
    )
    result["quantity_kg"] = quantity_kg
    if not result.get("is_crop", True):
        result["error"] = result.get("error_message", "Invalid crop image.")
    return result


ANALYZE_PROMPT = (
    "You are an expert crop grader for Philippine highland (Benguet) vegetables. "
    "In one pass, read this harvest photo. First confirm it shows an edible crop, "
    "vegetable, or fruit; if not, set is_crop to false and explain in error_message. "
    "Otherwise identify the crop, estimate the total harvest volume in kilograms from "
    "what's visible (a rough estimate from crate/pile size and typical density, not a "
    "measurement), and grade it. Overripe but edible crops stay valid at a lower grade. "
    "Return the AnalyzeOutput JSON schema."
)


def analyze(image_data: str = "", location: str = "La Trinidad, Benguet") -> dict:
    """Photo-first: detect crop + estimate volume + grade in a single vision call."""
    try:
        messages = [{"role": "user", "content": [{"type": "text", "text": ANALYZE_PROMPT}]}]
        if image_data:
            messages[0]["content"].append({"type": "image_url", "image_url": {"url": image_data}})
        response = _client().chat.completions.create(
            model=MODEL,
            messages=messages,
            response_format={"type": "json_object", "schema": AnalyzeOutput.model_json_schema()},
            temperature=0.1,
        )
        data = json.loads(response.choices[0].message.content or "{}")
        AnalyzeOutput.model_validate(data)

        if not data.get("is_crop", True):
            fb = stub.analyze(image_data, location)
            return {**fb, "isCrop": False, "error": data.get("error_message", "That photo doesn't look like a harvest."), "source": "langgraph"}

        detected = str(data.get("crop") or "Pechay").strip()
        crop_id = _crop_id(detected)  # unknown -> pechay for match keying
        # open detection + degrade: keep the model's detected name for display
        display = stub.DATA.get(crop_id, {}).get("name") or detected.title()
        return {
            "isCrop": True,
            "error": "",
            "cropId": crop_id,
            "crop": display,
            "cropConfidence": int(data.get("cropConfidence", 80)),
            "volumeKg": round(float(data.get("volumeKg", 450) or 450), 1),
            "volumeConfidence": int(data.get("volumeConfidence", 60)),
            "grade": data["grade"],
            "score": data["score"],
            "ripeness": data["ripeness"],
            "shelfLifeHours": data["shelfLifeHours"],
            "freshnessWindow": data["freshnessWindow"],
            "freshnessFill": data["freshnessFill"],
            "urgency": data["urgency"],
            "suggestion": data["suggestion"],
            "source": "langgraph",
        }
    except Exception as error:  # noqa: BLE001
        print(f"[langgraph.analyze] fallback to stub: {error}")
        return stub.analyze(image_data, location)


def match(grade_dict: dict, location: str = "La Trinidad, Benguet") -> dict:
    state = {
        "crop_type": grade_dict.get("crop", "Pechay"),
        "quantity": int(grade_dict.get("quantity_kg", 450)),
        "location": location,
        **grade_dict,
    }
    oracle = demand_oracle_node(state)
    state.update(oracle)
    return {
        "buyers": oracle["buyers"],
        "dispatch": logistics_router_node(state)["dispatch"],
        "source": oracle["source"],
    }


def process_harvest(
    crop: str,
    quantity_kg: float,
    image_data: str = "",
    location: str = "La Trinidad, Benguet",
) -> dict:
    initial_state = {"crop_type": crop, "quantity": int(quantity_kg), "image_data": image_data, "location": location}
    if ani_app is None:
        grade_result = grade(crop, quantity_kg, image_data, location)
        if grade_result.get("error"):
            return {**grade_result, "buyers": [], "dispatch": {}}
        return {**grade_result, **match(grade_result, location)}

    state = ani_app.invoke(initial_state)
    result = {
        "cropId": state.get("cropId", _crop_id(crop)),
        "crop": state.get("crop", crop),
        "grade": state.get("grade", "A"),
        "score": state.get("score", 0),
        "ripeness": state.get("ripeness", ""),
        "shelfLifeHours": state.get("shelfLifeHours", 0),
        "freshnessWindow": state.get("freshnessWindow", ""),
        "freshnessFill": state.get("freshnessFill", 0),
        "urgency": state.get("urgency", "low"),
        "suggestion": state.get("suggestion", ""),
        "buyers": state.get("buyers", []),
        "dispatch": state.get("dispatch", {}),
        "source": state.get("source", "stub"),
    }
    if not state.get("is_crop", True):
        result["error"] = state.get("error_message", "Invalid crop image.")
    return result
