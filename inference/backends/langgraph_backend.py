import os
import json
import base64
import numpy as np
from typing import TypedDict
from pydantic import BaseModel
from openai import OpenAI
from langgraph.graph import StateGraph, START, END
from pathlib import Path

# Setup clients (Using Fireworks for both vision/chat and embeddings per prototype)
FIREWORKS_API_KEY = os.getenv("FIREWORKS_API_KEY", "")
client = OpenAI(
    base_url="https://api.fireworks.ai/inference/v1",
    api_key=FIREWORKS_API_KEY
)

# 1. Load the buyers database
DATA_DIR = Path(__file__).parent.parent / "data"
with open(DATA_DIR / "buyers.json", "r") as f:
    BUYERS = json.load(f)

# 2. Pre-calculate embeddings for buyers
def get_embedding(text: str) -> np.ndarray:
    response = client.embeddings.create(
        model="nomic-ai/nomic-embed-text-v1.5",
        input=text
    )
    return np.array(response.data[0].embedding)

for buyer in BUYERS:
    buyer["vector"] = get_embedding(buyer["requirement_profile"])

# 3. LangGraph State
class HarvestState(TypedDict, total=False):
    crop_type: str
    quantity: int
    image_data: str

    grade: str
    score: float
    ripeness: str
    shelfLifeHours: int
    freshnessWindow: str
    freshnessFill: int
    urgency: str
    suggestion: str
    cropId: str
    crop: str
    source: str

    buyers: list
    matched_buyer: str
    
    dispatch: dict

# 4. Schemas for API Extraction
class GraderOutput(BaseModel):
    grade: str
    score: float
    ripeness: str
    shelfLifeHours: int
    freshnessWindow: str
    freshnessFill: int
    urgency: str
    suggestion: str

class RouterOutput(BaseModel):
    to: str
    eta: str
    load: str

# 5. Nodes
def harvest_grader_node(state: HarvestState):
    print(f"Grader Agent: AI is visually inspecting the {state['crop_type']}...")

    image_str = state.get("image_data", "")
    if "," in image_str:
        image_str = image_str.split(",")[-1]

    # If no image is provided, we can't use vision properly. 
    # For robust fallback, if image_str is empty, we fall back to a text-only prompt.
    prompt = (
        f"You are an expert crop grader for Philippine highland vegetables. "
        f"We have {state['quantity']}kg of {state['crop_type']}. "
        f"Evaluate its quality and return a JSON object with: "
        f"grade (A, B, C), score (0-100), ripeness (short description), "
        f"shelfLifeHours (integer), freshnessWindow (e.g. '3 days'), "
        f"freshnessFill (0-100 integer representing remaining freshness), "
        f"urgency (high, mid, low), and a one-sentence suggestion for the farmer."
    )

    messages = [{"role": "user", "content": []}]
    messages[0]["content"].append({"type": "text", "text": prompt})
    
    if image_str:
        messages[0]["content"].append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{image_str}"}
        })

    response = client.chat.completions.create(
        model="accounts/fireworks/models/minimax-m3",
        messages=messages,
        response_format={"type": "json_object", "schema": GraderOutput.model_json_schema()},
        temperature=0.1
    )

    ai_result = json.loads(response.choices[0].message.content)
    
    return {
        **ai_result, 
        "cropId": state['crop_type'].lower().replace(" ", "-"),
        "crop": state['crop_type'],
        "source": "langgraph"
    }

def demand_oracle_node(state: HarvestState):
    print(f"Oracle Agent: Finding buyers for Grade {state['grade']} {state['crop_type']}...")

    harvest_text = f"We have {state['quantity']}kg of Grade {state['grade']} {state['crop_type']}."
    harvest_vector = get_embedding(harvest_text)

    scored_buyers = []
    for buyer in BUYERS:
        score = np.dot(harvest_vector, buyer["vector"]) / (np.linalg.norm(harvest_vector) * np.linalg.norm(buyer["vector"]))
        scored_buyers.append({"buyer": buyer, "score": score})
        
    scored_buyers.sort(key=lambda x: x["score"], reverse=True)
    top_3 = scored_buyers[:3]

    formatted_buyers = []
    for i, match in enumerate(top_3):
        b = match["buyer"]
        formatted_buyers.append({
            "buyer": b["name"],
            "sub": b.get("location_needs", f"Needs {state['crop_type']}"),
            "pricePerKg": b.get("max_price_per_kg", 50),
            "trend": "Surging" if i == 0 else "Stable",
            "fit": f"{int(match['score'] * 100)}% fit",
            "first": (i == 0)
        })

    return {
        "buyers": formatted_buyers,
        "matched_buyer": top_3[0]["buyer"]["name"]
    }

def logistics_router_node(state: HarvestState):
    print(f"Router Agent: Planning route to {state['matched_buyer']}...")

    prompt = f"""
    You are an expert logistics router in the Philippines.
    We are sending {state['quantity']}kg of {state['crop_type']} from Benguet to {state['matched_buyer']}.
    
    Calculate realistic transit details and return a JSON object with:
    'to': the city or market destination (e.g. 'Balintawak' or 'Makati')
    'eta': the time and transport cost (e.g. '6h · ₱44/kg')
    'load': a short description of the load (e.g. '{state['quantity']/1000}t matched')
    """

    response = client.chat.completions.create(
        model="accounts/fireworks/models/minimax-m3",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object", "schema": RouterOutput.model_json_schema()},
        temperature=0.4
    )

    dispatch_data = json.loads(response.choices[0].message.content)

    return {
        "dispatch": dispatch_data
    }

# 6. Compile Graph
workflow = StateGraph(HarvestState)
workflow.add_node("grader", harvest_grader_node)
workflow.add_node("oracle", demand_oracle_node)
workflow.add_node("router", logistics_router_node)

workflow.add_edge(START, "grader")
workflow.add_edge("grader", "oracle")
workflow.add_edge("oracle", "router")
workflow.add_edge("router", END)

ani_app = workflow.compile()

# Provide wrapper functions to easily drop into FastAPI if needed
def process_harvest(crop: str, quantity_kg: float, image_data: str = "") -> dict:
    initial_state = {
        "crop_type": crop,
        "quantity": int(quantity_kg),
        "image_data": image_data
    }
    
    final_state = ani_app.invoke(initial_state)
    return final_state
